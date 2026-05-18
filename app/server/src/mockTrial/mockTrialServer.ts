import type { Server, Namespace } from 'socket.io'
import * as CM from './courtManager.js'
import { computeCaseScore, applyHostOverride, buildLeaderboard } from './mockTrialScoring.js'
import { MOCK_TRIAL_CASES } from './cases.js'
import {
  MT_EV, BRIEFING_SEC, REVEAL_SEC, PHASE_GRACE_MS, EMPTY_SUBMISSION,
} from './types.js'
import type {
  MockTrialRoom, MockTrialCase, CasePublic, RoomStatePayload, CourtPublic,
  C2S_MTCreateRoom, C2S_MTJoinRoom, C2S_MTClaimSlot,
  C2S_MTSubmitArgument, C2S_MTSubmitVote, C2S_MTSubmitVerdict,
  C2S_MTSubmitSelfScore, C2S_MTHostOverride,
} from './types.js'

const activeRooms = new Map<string, MockTrialRoom>()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toCasePublic(c: MockTrialCase, defaultArgSec: number, defaultDelibSec: number): CasePublic {
  return {
    id: c.id,
    technique: c.technique,
    difficulty: c.difficulty,
    title: c.title,
    codeSnippet: c.codeSnippet,
    testSet: c.testSet,
    claim: c.claim,
    lawCardRef: c.lawCardRef,
    prosecutorArguments: c.prosecutorArguments.map(({ id, text }) => ({ id, text })),
    defenseArguments: c.defenseArguments.map(({ id, text }) => ({ id, text })),
    argumentSeconds: c.argumentSeconds ?? defaultArgSec,
    deliberationSeconds: c.deliberationSeconds ?? defaultDelibSec,
  }
}

function toCourtPublic(room: MockTrialRoom): CourtPublic[] {
  return Array.from(room.courts.values()).map((c) => {
    const last = c.caseHistory[c.caseHistory.length - 1]
    return {
      id: c.id,
      name: c.name,
      slots: c.slots,
      totalScore: c.totalScore,
      lastCaseDelta: last?.caseTotal ?? 0,
    }
  })
}

function toRoomState(room: MockTrialRoom): RoomStatePayload {
  return {
    code: room.code,
    status: room.status,
    config: room.config,
    courts: toCourtPublic(room),
    spectators: Array.from(room.spectators.values()),
    hostNickname: room.hostNickname,
    caseCount: room.config.caseCount,
    currentCaseIdx: room.currentCaseIdx,
    currentPhase: room.currentPhase,
    phaseEndsAt: room.phaseEndsAt,
  }
}

function broadcastRoomState(nsp: Namespace, room: MockTrialRoom): void {
  nsp.to(room.code).emit(MT_EV.ROOM_STATE, toRoomState(room))
}

function clearPhaseTimer(room: MockTrialRoom): void {
  if (room.phaseTimer) { clearTimeout(room.phaseTimer); room.phaseTimer = null }
}

// ─── Phase transitions (state machine) ───────────────────────────────────────

function startBriefing(nsp: Namespace, room: MockTrialRoom): void {
  clearPhaseTimer(room)
  const c = room.cases[room.currentCaseIdx]
  if (!c) return

  // Reset per-case submissions for active courts only
  for (const court of room.courts.values()) {
    if (court.slots.prosecutor && court.slots.defense && court.slots.scribe) {
      court.currentSubmission = { ...EMPTY_SUBMISSION }
    }
  }

  room.currentPhase = 'briefing'
  const endsAt = Date.now() + BRIEFING_SEC * 1000
  room.phaseEndsAt = endsAt
  nsp.to(room.code).emit(MT_EV.CASE_START, {
    case: toCasePublic(c, room.config.defaultArgumentSec, room.config.defaultDeliberationSec),
    caseIdx: room.currentCaseIdx,
    phase: 'briefing',
    endsAt,
  })
  room.phaseTimer = setTimeout(() => startArguing(nsp, room), BRIEFING_SEC * 1000)
}

function startArguing(nsp: Namespace, room: MockTrialRoom): void {
  clearPhaseTimer(room)
  const c = room.cases[room.currentCaseIdx]
  if (!c) return
  room.currentPhase = 'arguing'
  const sec = c.argumentSeconds ?? room.config.defaultArgumentSec
  const endsAt = Date.now() + sec * 1000
  room.phaseEndsAt = endsAt
  nsp.to(room.code).emit(MT_EV.PHASE_CHANGE, { phase: 'arguing', endsAt })
  room.phaseTimer = setTimeout(() => startDeliberating(nsp, room), sec * 1000 + PHASE_GRACE_MS)
}

function startDeliberating(nsp: Namespace, room: MockTrialRoom): void {
  clearPhaseTimer(room)
  const c = room.cases[room.currentCaseIdx]
  if (!c) return
  room.currentPhase = 'deliberating'
  const sec = c.deliberationSeconds ?? room.config.defaultDeliberationSec
  const endsAt = Date.now() + sec * 1000
  room.phaseEndsAt = endsAt
  nsp.to(room.code).emit(MT_EV.PHASE_CHANGE, { phase: 'deliberating', endsAt })
  room.phaseTimer = setTimeout(() => startReveal(nsp, room), sec * 1000 + PHASE_GRACE_MS)
}

function startReveal(nsp: Namespace, room: MockTrialRoom): void {
  clearPhaseTimer(room)
  const c = room.cases[room.currentCaseIdx]
  if (!c) return

  // Compute case results for every court with a valid baseline lineup
  const courtResults = []
  for (const court of room.courts.values()) {
    if (!court.slots.prosecutor || !court.slots.defense || !court.slots.scribe) continue
    const result = computeCaseScore(c, court.currentSubmission)
    court.caseHistory.push(result)
    court.totalScore += result.caseTotal
    courtResults.push({
      courtId: court.id,
      courtName: court.name,
      submission: result.submission,
      verdictScore: result.verdictScore,
      prosecutorBonus: result.prosecutorBonus,
      defenseBonus: result.defenseBonus,
      juryBonus: result.juryBonus,
      caseTotal: result.caseTotal,
    })
  }

  room.currentPhase = 'reveal'
  room.status = 'reveal'
  const endsAt = Date.now() + REVEAL_SEC * 1000
  room.phaseEndsAt = endsAt

  nsp.to(room.code).emit(MT_EV.CASE_REVEAL, {
    correctVerdict: c.correctVerdict,
    answerExplanation: c.answerExplanation,
    pitfallTag: c.pitfallTag,
    courtResults,
  })

  // Reveal does not auto-advance — host clicks "Next Case"
}

function tryEarlyAdvance(nsp: Namespace, room: MockTrialRoom): void {
  if (room.currentPhase === 'arguing') {
    const allSubmitted = Array.from(room.courts.values())
      .filter((c) => c.slots.prosecutor && c.slots.defense && c.slots.scribe)
      .every((c) =>
        c.currentSubmission.prosecutorArgId !== null &&
        c.currentSubmission.defenseArgId !== null,
      )
    if (allSubmitted) startDeliberating(nsp, room)
  } else if (room.currentPhase === 'deliberating') {
    const allDone = Array.from(room.courts.values())
      .filter((c) => c.slots.prosecutor && c.slots.defense && c.slots.scribe)
      .every((c) => c.currentSubmission.verdict !== null)
    if (allDone) startReveal(nsp, room)
  }
}

// ─── Public registration ─────────────────────────────────────────────────────

export function registerMockTrial(io: Server): void {
  const nsp = io.of('/mock-trial')

  nsp.on('connection', (socket) => {
    console.log(`[mt+] ${socket.id} connected`)

    socket.on(MT_EV.CREATE_ROOM, ({ nickname, avatar, config }: C2S_MTCreateRoom) => {
      if (!nickname?.trim()) { socket.emit(MT_EV.ERROR, { message: 'Nickname required' }); return }
      const { room, playerId } = CM.createRoom(socket.id, nickname.trim(), avatar || 'new_judge', config)
      activeRooms.set(room.code, room)
      socket.join(room.code)
      socket.emit(MT_EV.ROOM_CREATED, { code: room.code, playerId })
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.JOIN_ROOM, ({ code, nickname, avatar }: C2S_MTJoinRoom) => {
      if (!nickname?.trim() || !code?.trim()) { socket.emit(MT_EV.ERROR, { message: 'Nickname and code required' }); return }
      const result = CM.joinRoom(socket.id, code, nickname.trim(), avatar || 'new_defense')
      if ('error' in result) { socket.emit(MT_EV.ERROR, { message: result.error }); return }
      activeRooms.set(result.room.code, result.room)
      socket.join(result.room.code)
      socket.emit(MT_EV.ROOM_JOINED, { code: result.room.code, playerId: result.playerId, isSpectator: result.isSpectator })
      broadcastRoomState(nsp, result.room)
    })

    socket.on(MT_EV.CLAIM_SLOT, ({ courtId, role }: C2S_MTClaimSlot) => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room) return
      const r = CM.claimSlot(socket.id, courtId, role)
      if (!r.ok) { socket.emit(MT_EV.ERROR, { message: r.error ?? 'Cannot claim slot' }); return }
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.RELEASE_SLOT, () => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room) return
      CM.releaseSlot(socket.id)
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.ADD_COURT, () => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room || !CM.isHost(socket.id)) return
      const r = CM.addCourt(room)
      if (!r.ok) { socket.emit(MT_EV.ERROR, { message: 'Max courts reached' }); return }
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.START_GAME, () => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room || !CM.isHost(socket.id)) return
      if (room.status !== 'lobby') { socket.emit(MT_EV.ERROR, { message: 'Already started' }); return }
      const v = CM.validateStart(room)
      if (!v.ok) { socket.emit(MT_EV.ERROR, { message: v.error ?? 'Not ready' }); return }

      // Pick cases (first N from the pool; could be shuffled in future)
      room.cases = MOCK_TRIAL_CASES.slice(0, room.config.caseCount)
      room.currentCaseIdx = 0
      room.status = 'in_case'
      startBriefing(nsp, room)
    })

    socket.on(MT_EV.SUBMIT_ARGUMENT, ({ argId, sentence }: C2S_MTSubmitArgument) => {
      const room = CM.getRoomForSocket(socket.id)
      const slot = CM.getCourtRoleForSocket(socket.id)
      if (!room || !slot || room.currentPhase !== 'arguing') return
      if (slot.role !== 'prosecutor' && slot.role !== 'defense') return
      const court = room.courts.get(slot.courtId)
      if (!court) return

      const sub = court.currentSubmission
      const truncated = (sentence ?? '').slice(0, 140)
      if (slot.role === 'prosecutor') {
        sub.prosecutorArgId = argId
        sub.prosecutorSentence = truncated
      } else {
        sub.defenseArgId = argId
        sub.defenseSentence = truncated
      }
      nsp.to(room.code).emit(MT_EV.ARGUMENT_RECEIVED, {
        courtId: court.id,
        role: slot.role,
        argId,
        sentence: truncated,
      })
      tryEarlyAdvance(nsp, room)
    })

    socket.on(MT_EV.SUBMIT_VOTE, ({ side }: C2S_MTSubmitVote) => {
      const room = CM.getRoomForSocket(socket.id)
      const slot = CM.getCourtRoleForSocket(socket.id)
      if (!room || !slot || room.currentPhase !== 'deliberating') return
      if (slot.role !== 'jury1' && slot.role !== 'jury2') return
      const court = room.courts.get(slot.courtId)
      if (!court) return
      if (court.currentSubmission.juryVote) return  // first-to-vote wins
      court.currentSubmission.juryVote = side
      nsp.to(room.code).emit(MT_EV.VOTE_RECEIVED, { courtId: court.id, side })
    })

    socket.on(MT_EV.SUBMIT_VERDICT, ({ verdict, justification }: C2S_MTSubmitVerdict) => {
      const room = CM.getRoomForSocket(socket.id)
      const slot = CM.getCourtRoleForSocket(socket.id)
      if (!room || !slot || room.currentPhase !== 'deliberating') return
      if (slot.role !== 'scribe') return
      const court = room.courts.get(slot.courtId)
      if (!court) return
      court.currentSubmission.verdict = verdict
      court.currentSubmission.justification = (justification ?? '').slice(0, 200)
      tryEarlyAdvance(nsp, room)
    })

    socket.on(MT_EV.SUBMIT_SELFSCORE, ({ score }: C2S_MTSubmitSelfScore) => {
      const room = CM.getRoomForSocket(socket.id)
      const slot = CM.getCourtRoleForSocket(socket.id)
      if (!room || !slot || room.currentPhase !== 'reveal') return
      // Jury OR Scribe (fallback when no jury)
      if (!['jury1', 'jury2', 'scribe'].includes(slot.role)) return
      const court = room.courts.get(slot.courtId)
      if (!court) return
      // Only allow first self-score submission
      const last = court.caseHistory[court.caseHistory.length - 1]
      if (!last || last.juryBonus !== 0) return
      // Recompute with the new selfScore
      court.currentSubmission.selfScore = score
      const c = room.cases[room.currentCaseIdx]
      if (!c) return
      // Subtract prior result, add new
      court.totalScore -= last.caseTotal
      const fresh = computeCaseScore(c, court.currentSubmission)
      court.caseHistory[court.caseHistory.length - 1] = fresh
      court.totalScore += fresh.caseTotal
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.HOST_OVERRIDE, ({ courtId, delta }: C2S_MTHostOverride) => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room || !CM.isHost(socket.id) || room.currentPhase !== 'reveal') return
      const court = room.courts.get(courtId)
      if (!court) return
      const last = court.caseHistory[court.caseHistory.length - 1]
      if (!last) return
      court.totalScore -= last.caseTotal
      const updated = applyHostOverride(last, delta)
      court.caseHistory[court.caseHistory.length - 1] = updated
      court.totalScore += updated.caseTotal
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.NEXT_CASE, () => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room || !CM.isHost(socket.id)) return
      if (room.status !== 'reveal') return

      // Send leaderboard before next case starts
      const lb = buildLeaderboard(room.courts)
      const isLastCase = room.currentCaseIdx >= room.cases.length - 1
      nsp.to(room.code).emit(MT_EV.LEADERBOARD, {
        courts: lb,
        caseIdx: room.currentCaseIdx,
        isLastCase,
      })

      if (isLastCase) {
        room.status = 'finished'
        room.currentPhase = null
        nsp.to(room.code).emit(MT_EV.GAME_FINISHED, { finalLeaderboard: lb })
        return
      }
      room.currentCaseIdx += 1
      room.status = 'in_case'
      startBriefing(nsp, room)
    })

    socket.on(MT_EV.FINISH_GAME, () => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room || !CM.isHost(socket.id)) return
      clearPhaseTimer(room)
      room.status = 'finished'
      room.currentPhase = null
      const lb = buildLeaderboard(room.courts)
      nsp.to(room.code).emit(MT_EV.GAME_FINISHED, { finalLeaderboard: lb })
    })

    socket.on('disconnect', () => {
      console.log(`[mt-] ${socket.id} disconnected`)
      const result = CM.disconnectSocket(socket.id)
      if (result) broadcastRoomState(nsp, result.room)
    })
  })

  // Periodic room cleanup (rooms finished for 5+ minutes get deleted)
  setInterval(() => {
    const now = Date.now()
    for (const [code, room] of activeRooms.entries()) {
      if (room.status === 'finished' && room.phaseEndsAt && now - room.phaseEndsAt > 5 * 60 * 1000) {
        CM.deleteRoom(code)
        activeRooms.delete(code)
      }
    }
  }, 60 * 1000).unref()
}
