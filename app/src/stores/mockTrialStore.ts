import { create } from 'zustand'
import { getMockTrialSocket, destroyMockTrialSocket } from '../mock-trial/socket'
import { MT_EV } from '../mock-trial/types'
import type {
  AvatarId, RoomState, CourtPublic, CasePublic, MockTrialConfig, MockTrialRole,
  MockTrialPhase, Verdict, Side, SelfScore, CourtResult, LeaderboardCourt,
} from '../mock-trial/types'

export type MockTrialRoleScope = 'host' | 'player' | null

export interface MockTrialState {
  // Connection
  connected: boolean
  error: string | null

  // Identity
  roleScope: MockTrialRoleScope
  playerId: string | null
  nickname: string | null
  myAvatar: AvatarId | null

  // Room
  roomState: RoomState | null

  // Active case
  currentCase: CasePublic | null
  myCourtId: string | null
  myRole: MockTrialRole | null

  // Live argument feed (per court)
  liveArguments: Record<string, { prosecutor?: { argId: string; sentence: string }; defense?: { argId: string; sentence: string } }>
  liveVotes: Record<string, Side>

  // Reveal phase data
  revealData: {
    correctVerdict: Verdict
    answerExplanation: string
    pitfallTag?: string
    courtResults: CourtResult[]
  } | null

  // Final
  finalLeaderboard: LeaderboardCourt[]

  // Actions
  connect: () => void
  disconnect: () => void
  createRoom: (nickname: string, avatar: AvatarId, config: MockTrialConfig) => void
  joinRoom: (code: string, nickname: string, avatar: AvatarId) => void
  claimSlot: (courtId: string, role: MockTrialRole) => void
  releaseSlot: () => void
  addCourt: () => void
  startGame: () => void
  submitArgument: (argId: string, sentence: string) => void
  submitVote: (side: Side) => void
  submitVerdict: (verdict: Verdict, justification: string) => void
  submitSelfScore: (score: SelfScore) => void
  hostOverride: (courtId: string, delta: number) => void
  skipPhase: () => void
  togglePause: () => void
  nextCase: () => void
  finishGame: () => void
  clearError: () => void
  reset: () => void
}

const INITIAL = {
  connected: false,
  error: null as string | null,
  roleScope: null as MockTrialRoleScope,
  playerId: null as string | null,
  nickname: null as string | null,
  myAvatar: null as AvatarId | null,
  roomState: null as RoomState | null,
  currentCase: null as CasePublic | null,
  myCourtId: null as string | null,
  myRole: null as MockTrialRole | null,
  liveArguments: {} as MockTrialState['liveArguments'],
  liveVotes: {} as Record<string, Side>,
  revealData: null as MockTrialState['revealData'],
  finalLeaderboard: [] as LeaderboardCourt[],
}

const PLAYER_ID_KEY = 'mock-trial-session-player-id'

function getStablePlayerId(): string {
  const existing = sessionStorage.getItem(PLAYER_ID_KEY)
  if (existing) return existing
  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `mt_${crypto.randomUUID()}`
      : `mt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
  sessionStorage.setItem(PLAYER_ID_KEY, generated)
  return generated
}

function rememberPlayerId(playerId: string): void {
  sessionStorage.setItem(PLAYER_ID_KEY, playerId)
}

function deriveMyCourtRole(state: RoomState | null, playerId: string | null): { myCourtId: string | null; myRole: MockTrialRole | null } {
  if (!state || !playerId) return { myCourtId: null, myRole: null }
  for (const court of state.courts) {
    for (const role of Object.keys(court.slots) as MockTrialRole[]) {
      if (court.slots[role]?.id === playerId) return { myCourtId: court.id, myRole: role }
    }
  }
  return { myCourtId: null, myRole: null }
}

export const useMockTrialStore = create<MockTrialState>()((set, get) => {
  function wire(): void {
    const s = getMockTrialSocket()
    s.on('connect', () => set({ connected: true, error: null }))
    s.on('disconnect', () => set({ connected: false }))
    s.on('connect_error', (e) => set({ error: `Connection failed: ${e.message}` }))

    s.on(MT_EV.ROOM_CREATED, ({ code: _code, playerId }: { code: string; playerId: string }) => {
      rememberPlayerId(playerId)
      set({ playerId })
    })
    s.on(MT_EV.ROOM_JOINED, ({ playerId }: { playerId: string; isSpectator: boolean }) => {
      rememberPlayerId(playerId)
      set({ playerId })
    })
    s.on(MT_EV.ROOM_STATE, (state: RoomState) => {
      const { playerId } = get()
      const derived = deriveMyCourtRole(state, playerId)
      set({ roomState: state, ...derived })
    })
    s.on(MT_EV.CASE_START, ({ case: c, caseIdx, phase, endsAt }: { case: CasePublic; caseIdx: number; phase: MockTrialPhase; endsAt: number }) => {
      set((st) => ({
        currentCase: c,
        liveArguments: {},
        liveVotes: {},
        revealData: null,
        roomState: st.roomState
          ? { ...st.roomState, status: 'in_case', currentCaseIdx: caseIdx, currentPhase: phase, phaseEndsAt: endsAt, phasePaused: false }
          : st.roomState,
      }))
    })
    s.on(MT_EV.PHASE_CHANGE, ({ phase, endsAt }: { phase: MockTrialPhase; endsAt: number }) => {
      set((st) => ({
        roomState: st.roomState
          ? { ...st.roomState, currentPhase: phase, phaseEndsAt: endsAt, phasePaused: false }
          : st.roomState,
      }))
    })
    s.on(MT_EV.ARGUMENT_RECEIVED, ({ courtId, role, argId, sentence }: { courtId: string; role: 'prosecutor' | 'defense'; argId: string; sentence: string }) => {
      set((st) => ({
        liveArguments: {
          ...st.liveArguments,
          [courtId]: { ...(st.liveArguments[courtId] ?? {}), [role]: { argId, sentence } },
        },
      }))
    })
    s.on(MT_EV.VOTE_RECEIVED, ({ courtId, side }: { courtId: string; side: Side }) => {
      set((st) => ({ liveVotes: { ...st.liveVotes, [courtId]: side } }))
    })
    s.on(MT_EV.CASE_REVEAL, (payload: MockTrialState['revealData']) => {
      set((st) => ({
        revealData: payload,
        roomState: st.roomState
          ? { ...st.roomState, status: 'reveal', currentPhase: 'reveal', phasePaused: false }
          : st.roomState,
      }))
    })
    s.on(MT_EV.LEADERBOARD, ({ courts }: { courts: LeaderboardCourt[] }) => {
      set({ finalLeaderboard: courts })
    })
    s.on(MT_EV.GAME_FINISHED, ({ finalLeaderboard }: { finalLeaderboard: LeaderboardCourt[] }) => {
      set((st) => ({
        finalLeaderboard,
        roomState: st.roomState
          ? { ...st.roomState, status: 'finished', currentPhase: null, phaseEndsAt: null }
          : st.roomState,
      }))
    })
    s.on(MT_EV.ERROR, ({ message }: { message: string }) => set({ error: message }))
  }

  return {
    ...INITIAL,
    connect() {
      const s = getMockTrialSocket()
      if (!s.connected) { wire(); s.connect() }
    },
    disconnect() {
      destroyMockTrialSocket()
      set({ ...INITIAL })
    },
    createRoom(nickname, avatar, config) {
      set({ roleScope: 'host', nickname, myAvatar: avatar, error: null })
      getMockTrialSocket().emit(MT_EV.CREATE_ROOM, { nickname, avatar, config, playerId: getStablePlayerId() })
    },
    joinRoom(code, nickname, avatar) {
      set({ roleScope: 'player', nickname, myAvatar: avatar, error: null })
      getMockTrialSocket().emit(MT_EV.JOIN_ROOM, { code, nickname, avatar, playerId: getStablePlayerId() })
    },
    claimSlot(courtId, role)      { getMockTrialSocket().emit(MT_EV.CLAIM_SLOT, { courtId, role }) },
    releaseSlot()                  { getMockTrialSocket().emit(MT_EV.RELEASE_SLOT) },
    addCourt()                     { getMockTrialSocket().emit(MT_EV.ADD_COURT) },
    startGame()                    { getMockTrialSocket().emit(MT_EV.START_GAME) },
    submitArgument(argId, sentence){ getMockTrialSocket().emit(MT_EV.SUBMIT_ARGUMENT, { argId, sentence }) },
    submitVote(side)               { getMockTrialSocket().emit(MT_EV.SUBMIT_VOTE, { side }) },
    submitVerdict(verdict, justification) {
      getMockTrialSocket().emit(MT_EV.SUBMIT_VERDICT, { verdict, justification })
    },
    submitSelfScore(score)         { getMockTrialSocket().emit(MT_EV.SUBMIT_SELFSCORE, { score }) },
    hostOverride(courtId, delta)   { getMockTrialSocket().emit(MT_EV.HOST_OVERRIDE, { courtId, delta }) },
    skipPhase()                    { getMockTrialSocket().emit(MT_EV.SKIP_PHASE) },
    togglePause()                  { getMockTrialSocket().emit(MT_EV.TOGGLE_PAUSE) },
    nextCase()                     { getMockTrialSocket().emit(MT_EV.NEXT_CASE) },
    finishGame()                   { getMockTrialSocket().emit(MT_EV.FINISH_GAME) },
    clearError()                   { set({ error: null }) },
    reset() {
      destroyMockTrialSocket()
      set({ ...INITIAL })
    },
  }
})

export function getMyCourt(state: MockTrialState): CourtPublic | null {
  if (!state.roomState || !state.myCourtId) return null
  return state.roomState.courts.find((c) => c.id === state.myCourtId) ?? null
}
