import type { Room, Player, PlayerInfo, LeaderboardEntry } from './types.js'
import type { SpeedTrialQuestion } from './types.js'

// ─── In-memory store ──────────────────────────────────────────────────────────

const rooms = new Map<string, Room>()
const socketToRoom = new Map<string, string>()   // socketId → roomCode
const socketToPlayer = new Map<string, string>()  // socketId → playerId

// ─── Room code generation ─────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function uniqueCode(): string {
  let code = generateCode()
  while (rooms.has(code)) code = generateCode()
  return code
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function createRoom(
  hostSocketId: string,
  hostNickname: string,
  questions: SpeedTrialQuestion[],
  grandJuryQuestion: SpeedTrialQuestion,
): { room: Room; playerId: string } {
  const code = uniqueCode()
  const playerId = hostSocketId

  // Host is NOT added to room.players — they manage the game but don't score.
  const room: Room = {
    code,
    hostId: playerId,
    players: new Map(),   // starts empty; only joining players are scored
    status: 'lobby',
    currentRound: 0,
    totalRounds: questions.length,
    questions,
    grandJuryQuestion,
    currentQuestionStartedAt: null,
    roundTimer: null,
    leaderboard: [],
  }

  rooms.set(code, room)
  socketToRoom.set(hostSocketId, code)
  socketToPlayer.set(hostSocketId, playerId)

  return { room, playerId }
}

export function joinRoom(
  socketId: string,
  code: string,
  nickname: string,
): { room: Room; playerId: string } | { error: string } {
  const room = rooms.get(code.toUpperCase())
  if (!room) return { error: 'Room not found. Check the code and try again.' }
  if (room.status !== 'lobby') return { error: 'Tournament has already started.' }

  const nicknameUsed = Array.from(room.players.values()).some(
    (p) => p.nickname.toLowerCase() === nickname.toLowerCase(),
  )
  if (nicknameUsed) return { error: 'That nickname is already taken in this room.' }

  const playerId = socketId
  const player: Player = { id: playerId, nickname, score: 0, answers: {}, connected: true }

  room.players.set(playerId, player)
  socketToRoom.set(socketId, code.toUpperCase())
  socketToPlayer.set(socketId, playerId)

  return { room, playerId }
}

export function disconnectSocket(socketId: string): { room: Room; playerId: string } | null {
  const code = socketToRoom.get(socketId)
  const playerId = socketToPlayer.get(socketId)
  if (!code || !playerId) return null

  const room = rooms.get(code)
  if (!room) return null

  const player = room.players.get(playerId)
  if (player) player.connected = false

  socketToRoom.delete(socketId)
  socketToPlayer.delete(socketId)

  return { room, playerId }
}

export function getRoomForSocket(socketId: string): Room | null {
  const code = socketToRoom.get(socketId)
  return code ? (rooms.get(code) ?? null) : null
}

export function getPlayerForSocket(socketId: string): Player | null {
  const room = getRoomForSocket(socketId)
  const playerId = socketToPlayer.get(socketId)
  if (!room || !playerId) return null
  return room.players.get(playerId) ?? null
}

export function isHost(socketId: string): boolean {
  const room = getRoomForSocket(socketId)
  const playerId = socketToPlayer.get(socketId)
  return !!room && room.hostId === playerId
}

export function getPlayerList(room: Room, hostId?: string): PlayerInfo[] {
  return Array.from(room.players.values()).map((p) => ({
    id: p.id,
    nickname: p.nickname,
    score: p.score,
    connected: p.connected,
    isHost: p.id === (hostId ?? room.hostId),
  }))
}

export function recordAnswer(
  socketId: string,
  questionId: string,
  optionId: string,
  isCorrect: boolean,
  pointsEarned: number,
  submittedAt: number,
): { alreadyAnswered: boolean } {
  const room = getRoomForSocket(socketId)
  const player = getPlayerForSocket(socketId)
  if (!room || !player) return { alreadyAnswered: true }

  // Idempotent guard — one answer per question per player
  if (player.answers[questionId]) return { alreadyAnswered: true }

  player.answers[questionId] = { questionId, optionId, isCorrect, pointsEarned, submittedAt }
  if (isCorrect) player.score += pointsEarned

  return { alreadyAnswered: false }
}

export function answeredCount(room: Room, questionId: string): number {
  return Array.from(room.players.values()).filter((p) => !!p.answers[questionId]).length
}

export function connectedPlayerCount(room: Room): number {
  return Array.from(room.players.values()).filter((p) => p.connected).length
}

export function topNPlayers(room: Room, n: number): LeaderboardEntry[] {
  return room.leaderboard.slice(0, n)
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code)
  if (!room) return
  if (room.roundTimer) clearTimeout(room.roundTimer)
  rooms.delete(code)
}
