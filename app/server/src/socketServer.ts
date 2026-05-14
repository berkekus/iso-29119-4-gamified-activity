import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

import { ROUND_QUESTIONS, GRAND_JURY_QUESTION } from './speedTrialQuestions.js'
import { computeScore, buildLeaderboard } from './scoring.js'
import * as RM from './roomManager.js'
import type {
  C2S_CreateRoom,
  C2S_JoinRoom,
  C2S_SubmitAnswer,
  QuestionPublic,
} from './types.js'

// ─── Server bootstrap ─────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3001)
const GRAND_JURY_TOP_N = 5

const app = express()
app.use(cors())
app.get('/health', (_req, res) => { res.json({ ok: true }) })

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 30_000,
  pingInterval: 10_000,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPublic(q: typeof ROUND_QUESTIONS[number]): QuestionPublic {
  return {
    id: q.id,
    round: q.round,
    technique: q.technique,
    prompt: q.prompt,
    codeSnippet: q.codeSnippet,
    options: q.options,
    timeLimitSeconds: q.timeLimitSeconds,
  }
}

function broadcastPlayerList(room: ReturnType<typeof RM.getRoomForSocket>): void {
  if (!room) return
  io.to(room.code).emit('player_list', { players: RM.getPlayerList(room) })
}

// Active rooms keyed by room code — used by timer callbacks that run after socket events
const activeRoomMap = new Map<string, ReturnType<typeof RM.getRoomForSocket>>()

// Scores captured at the start of each question round, used to compute per-round deltas
const prevRoundScores = new Map<string, Map<string, number>>()

function _endRound(roomCode: string): void {
  const room = activeRoomMap.get(roomCode)
  if (!room || room.status === 'leaderboard' || room.status === 'grand_jury' || room.status === 'finished') return

  if (room.roundTimer) { clearTimeout(room.roundTimer); room.roundTimer = null }

  const currentQ = room.questions[room.currentRound - 1]
  if (!currentQ) return

  // Use scores captured at the start of this round for accurate per-round deltas
  const captured = prevRoundScores.get(roomCode) ?? new Map<string, number>()
  room.leaderboard = buildLeaderboard(room.players, captured)
  room.status = 'leaderboard'

  io.to(roomCode).emit('round_ended', {
    correctOptionId: currentQ.correctOptionId,
    explanation: currentQ.explanation,
    leaderboard: room.leaderboard,
    isLastRound: room.currentRound >= room.totalRounds,
  })
}

// ─── Socket event handlers ────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`)

  // ── create_room ─────────────────────────────────────────────────────────────
  socket.on('create_room', ({ nickname }: C2S_CreateRoom) => {
    if (!nickname?.trim()) {
      socket.emit('error', { message: 'Nickname is required.' }); return
    }

    const questions = [...ROUND_QUESTIONS]
    const { room, playerId } = RM.createRoom(socket.id, questions, GRAND_JURY_QUESTION)

    activeRoomMap.set(room.code, room)
    socket.join(room.code)

    socket.emit('room_created', { code: room.code, playerId })
    console.log(`[room] ${nickname} created room ${room.code}`)
  })

  // ── join_room ────────────────────────────────────────────────────────────────
  socket.on('join_room', ({ code, nickname }: C2S_JoinRoom) => {
    if (!nickname?.trim() || !code?.trim()) {
      socket.emit('error', { message: 'Nickname and room code are required.' }); return
    }

    const result = RM.joinRoom(socket.id, code.trim(), nickname.trim())

    if ('error' in result) {
      socket.emit('error', { message: result.error }); return
    }

    const { room, playerId } = result
    activeRoomMap.set(room.code, room)
    socket.join(room.code)

    socket.emit('room_joined', {
      code: room.code,
      playerId,
      players: RM.getPlayerList(room),
    })

    // Notify everyone in the room of the updated player list
    io.to(room.code).emit('player_list', { players: RM.getPlayerList(room) })
    console.log(`[room] ${nickname} joined room ${room.code}`)
  })

  // ── start_tournament ─────────────────────────────────────────────────────────
  socket.on('start_tournament', () => {
    const room = RM.getRoomForSocket(socket.id)
    if (!room) { socket.emit('error', { message: 'Room not found.' }); return }
    if (!RM.isHost(socket.id)) { socket.emit('error', { message: 'Only the host can start.' }); return }
    if (room.status !== 'lobby') { socket.emit('error', { message: 'Tournament already started.' }); return }
    if (room.players.size < 1) { socket.emit('error', { message: 'Need at least 1 player.' }); return }

    room.status = 'question'
    room.currentRound = 1

    io.to(room.code).emit('tournament_started', { totalRounds: room.totalRounds })
    _broadcastQuestion(room)
  })

  // ── next_round ───────────────────────────────────────────────────────────────
  socket.on('next_round', () => {
    const room = RM.getRoomForSocket(socket.id)
    if (!room) return
    if (!RM.isHost(socket.id)) return
    if (room.status !== 'leaderboard') return
    if (room.currentRound >= room.totalRounds) return

    room.currentRound++
    room.status = 'question'
    _broadcastQuestion(room)
  })

  // ── start_grand_jury ─────────────────────────────────────────────────────────
  socket.on('start_grand_jury', () => {
    const room = RM.getRoomForSocket(socket.id)
    if (!room) return
    if (!RM.isHost(socket.id)) return
    if (room.status !== 'leaderboard') return
    if (room.currentRound < room.totalRounds) return

    room.status = 'grand_jury'
    room.currentRound++

    const qualifiedPlayers = RM.topNPlayers(room, GRAND_JURY_TOP_N).map((e) => e.playerId)

    // Snapshot scores for grand jury delta
    prevRoundScores.set(
      room.code,
      new Map(Array.from(room.players.values()).map((p) => [p.id, p.score])),
    )

    const startedAt = Date.now()
    room.currentQuestionStartedAt = startedAt

    const publicQ = toPublic(room.grandJuryQuestion)

    io.to(room.code).emit('grand_jury_start', {
      question: publicQ,
      qualifiedPlayerIds: qualifiedPlayers,
      startedAt,
    })

    // Auto-end grand jury after time limit
    room.roundTimer = setTimeout(() => {
      _endGrandJury(room.code)
    }, room.grandJuryQuestion.timeLimitSeconds * 1000 + 3000)
  })

  // ── finish_tournament ─────────────────────────────────────────────────────────
  socket.on('finish_tournament', () => {
    const room = RM.getRoomForSocket(socket.id)
    if (!room) return
    if (!RM.isHost(socket.id)) return
    _finishTournament(room.code)
  })

  // ── submit_answer ─────────────────────────────────────────────────────────────
  socket.on('submit_answer', ({ questionId, optionId }: C2S_SubmitAnswer) => {
    const room = RM.getRoomForSocket(socket.id)
    if (!room) return

    const isGrandJury = room.status === 'grand_jury'
    const isQuestion   = room.status === 'question'
    if (!isQuestion && !isGrandJury) return

    const currentQ = isGrandJury
      ? room.grandJuryQuestion
      : room.questions[room.currentRound - 1]

    if (!currentQ || currentQ.id !== questionId) return
    if (!room.currentQuestionStartedAt) return

    const submittedAt = Date.now()
    const { isCorrect, pointsEarned } = computeScore(
      optionId,
      currentQ.correctOptionId,
      submittedAt,
      room.currentQuestionStartedAt,
      currentQ.timeLimitSeconds * 1000,
    )

    const { alreadyAnswered } = RM.recordAnswer(
      socket.id, questionId, optionId, isCorrect, pointsEarned, submittedAt,
    )
    if (alreadyAnswered) return

    // Acknowledge only to this player
    socket.emit('answer_ack', { isCorrect, pointsEarned, correctOptionId: currentQ.correctOptionId })

    // Broadcast live answered count to room
    const answered = RM.answeredCount(room, questionId)
    const total    = RM.connectedPlayerCount(room)
    io.to(room.code).emit('answer_received', { answeredCount: answered, totalPlayers: total })

    // If everyone has answered, end immediately
    if (answered >= total) {
      if (isGrandJury) _endGrandJury(room.code)
      else              _endRound(room.code)
    }
  })

  // ── disconnect ────────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`)
    const result = RM.disconnectSocket(socket.id)
    if (result) {
      broadcastPlayerList(result.room)
    }
  })
})

// ─── Broadcast helpers (need access to `io` and `activeRoomMap`) ─────────────

function _broadcastQuestion(room: NonNullable<ReturnType<typeof RM.getRoomForSocket>>): void {
  const q = room.questions[room.currentRound - 1]
  if (!q) return

  // Snapshot scores before the round — used for per-round delta in leaderboard
  prevRoundScores.set(
    room.code,
    new Map(Array.from(room.players.values()).map((p) => [p.id, p.score])),
  )

  const startedAt = Date.now()
  room.currentQuestionStartedAt = startedAt

  io.to(room.code).emit('question_start', {
    question: toPublic(q),
    roundNumber: room.currentRound,
    totalRounds: room.totalRounds,
    startedAt,
  })

  // Auto-end after time limit + 2s grace
  if (room.roundTimer) clearTimeout(room.roundTimer)
  room.roundTimer = setTimeout(() => {
    _endRound(room.code)
  }, q.timeLimitSeconds * 1000 + 2000)
}

function _endGrandJury(roomCode: string): void {
  const room = activeRoomMap.get(roomCode)
  if (!room || room.status === 'finished') return

  if (room.roundTimer) { clearTimeout(room.roundTimer); room.roundTimer = null }

  const captured = prevRoundScores.get(roomCode) ?? new Map<string, number>()
  room.leaderboard = buildLeaderboard(room.players, captured)

  io.to(roomCode).emit('round_ended', {
    correctOptionId: room.grandJuryQuestion.correctOptionId,
    explanation: room.grandJuryQuestion.explanation,
    leaderboard: room.leaderboard,
    isLastRound: true,
  })

  _finishTournament(roomCode)
}

function _finishTournament(roomCode: string): void {
  const room = activeRoomMap.get(roomCode)
  if (!room || room.status === 'finished') return

  if (room.roundTimer) { clearTimeout(room.roundTimer); room.roundTimer = null }

  const captured = prevRoundScores.get(roomCode) ?? new Map<string, number>()
  room.leaderboard = buildLeaderboard(room.players, captured)
  room.status = 'finished'

  io.to(roomCode).emit('tournament_finished', { leaderboard: room.leaderboard })

  // Clean up after a delay to allow clients to read results
  setTimeout(() => {
    RM.deleteRoom(roomCode)
    activeRoomMap.delete(roomCode)
    prevRoundScores.delete(roomCode)
  }, 5 * 60 * 1000)
}

// ─── Start ────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[Speed Trial Server] listening on http://localhost:${PORT}`)
})
