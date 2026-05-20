import type {
  Court,
  MockTrialConfig,
  MockTrialPlayer,
  MockTrialRole,
  MockTrialRoom,
} from './types.js'
import { EMPTY_SUBMISSION, MAX_COURTS } from './types.js'
import type { AvatarId } from '../types.js'

const rooms = new Map<string, MockTrialRoom>()
const socketToRoom = new Map<string, string>()
const socketToPlayer = new Map<string, string>()
const playerToSocket = new Map<string, string>()
const playerToCourt = new Map<string, { courtId: string; role: MockTrialRole }>()

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

function generatePlayerId(): string {
  return `mt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function stablePlayerId(playerId?: string): string {
  const trimmed = playerId?.trim()
  return trimmed && trimmed.length >= 6 ? trimmed.slice(0, 80) : generatePlayerId()
}

function emptyCourt(id: string, name: string): Court {
  return {
    id,
    name,
    slots: {
      prosecutor: null,
      defense: null,
      jury1: null,
      jury2: null,
      scribe: null,
    },
    currentSubmission: { ...EMPTY_SUBMISSION },
    caseHistory: [],
    totalScore: 0,
  }
}

function bindSocket(socketId: string, playerId: string, roomCode: string): void {
  socketToRoom.set(socketId, roomCode)
  socketToPlayer.set(socketId, playerId)
  playerToSocket.set(playerId, socketId)
}

function findPlayerSlot(room: MockTrialRoom, playerId: string): { court: Court; role: MockTrialRole; player: MockTrialPlayer } | null {
  for (const court of room.courts.values()) {
    for (const role of Object.keys(court.slots) as MockTrialRole[]) {
      const player = court.slots[role]
      if (player?.id === playerId) return { court, role, player }
    }
  }
  return null
}

function nicknameTaken(room: MockTrialRoom, nickname: string, exceptPlayerId?: string): boolean {
  const nick = nickname.toLowerCase()
  const names = [
    ...Array.from(room.spectators.values()),
    ...Array.from(room.courts.values()).flatMap((court) =>
      Object.values(court.slots).filter((slot): slot is MockTrialPlayer => slot !== null),
    ),
  ]

  if (room.hostPlayerId !== exceptPlayerId && room.hostNickname.toLowerCase() === nick) return true
  return names.some((player) => player.id !== exceptPlayerId && player.nickname.toLowerCase() === nick)
}

export function _resetForTests(): void {
  rooms.clear()
  socketToRoom.clear()
  socketToPlayer.clear()
  playerToSocket.clear()
  playerToCourt.clear()
}

export function createRoom(
  hostSocketId: string,
  nickname: string,
  avatar: AvatarId,
  config: MockTrialConfig,
  requestedPlayerId?: string,
): { room: MockTrialRoom; playerId: string } {
  const code = uniqueCode()
  const playerId = stablePlayerId(requestedPlayerId)
  const room: MockTrialRoom = {
    code,
    hostSocketId,
    hostPlayerId: playerId,
    hostNickname: nickname,
    hostAvatar: avatar,
    status: 'lobby',
    config,
    courts: new Map(),
    spectators: new Map(),
    cases: [],
    currentCaseIdx: -1,
    currentPhase: null,
    phaseEndsAt: null,
    phaseTimer: null,
    phasePaused: false,
    pausedRemainingMs: null,
  }
  room.courts.set('court-1', emptyCourt('court-1', 'Court 1'))
  rooms.set(code, room)
  bindSocket(hostSocketId, playerId, code)
  return { room, playerId }
}

export function addCourt(room: MockTrialRoom): { ok: boolean; courtId?: string } {
  if (room.courts.size >= MAX_COURTS) return { ok: false }
  const nextIdx = room.courts.size + 1
  const id = `court-${nextIdx}`
  room.courts.set(id, emptyCourt(id, `Court ${nextIdx}`))
  return { ok: true, courtId: id }
}

export function joinRoom(
  socketId: string,
  code: string,
  nickname: string,
  avatar: AvatarId,
  requestedPlayerId?: string,
): { room: MockTrialRoom; playerId: string; isSpectator: boolean } | { error: string } {
  const room = rooms.get(code.toUpperCase())
  if (!room) return { error: 'Room not found. Check the code and try again.' }

  const nick = nickname.trim()
  let requested = requestedPlayerId?.trim()

  if (requested && requested === room.hostPlayerId) {
    if (!nick || nick.toLowerCase() === room.hostNickname.toLowerCase()) {
      room.hostSocketId = socketId
      room.hostNickname = nick || room.hostNickname
      room.hostAvatar = avatar
      bindSocket(socketId, requested, room.code)
      return { room, playerId: requested, isSpectator: false }
    }
    requested = undefined
  }

  const existingSpectator = requested ? room.spectators.get(requested) ?? null : null
  const existingSlot = requested ? findPlayerSlot(room, requested) : null
  const existingPlayer = existingSpectator ?? existingSlot?.player ?? null

  if (existingPlayer) {
    if (nick && nicknameTaken(room, nick, existingPlayer.id)) {
      return { error: 'That nickname is already taken in this room.' }
    }
    existingPlayer.nickname = nick || existingPlayer.nickname
    existingPlayer.avatar = avatar
    existingPlayer.connected = true
    bindSocket(socketId, existingPlayer.id, room.code)
    if (existingSlot) playerToCourt.set(existingPlayer.id, { courtId: existingSlot.court.id, role: existingSlot.role })
    return { room, playerId: existingPlayer.id, isSpectator: !existingSlot }
  }

  if (nicknameTaken(room, nick)) {
    return { error: 'That nickname is already taken in this room.' }
  }

  const playerId = stablePlayerId(requested)
  const player: MockTrialPlayer = { id: playerId, nickname: nick, avatar, connected: true }
  room.spectators.set(playerId, player)
  bindSocket(socketId, playerId, room.code)
  return { room, playerId, isSpectator: true }
}

export function claimSlot(
  socketId: string,
  courtId: string,
  role: MockTrialRole,
): { ok: boolean; error?: string } {
  const code = socketToRoom.get(socketId)
  const playerId = socketToPlayer.get(socketId)
  if (!code || !playerId) return { ok: false, error: 'Not in a room' }
  const room = rooms.get(code)
  if (!room) return { ok: false, error: 'Room not found' }
  if (room.status !== 'lobby') return { ok: false, error: 'Slots locked after game start' }

  const court = room.courts.get(courtId)
  if (!court) return { ok: false, error: 'Court not found' }
  if (court.slots[role] !== null) return { ok: false, error: 'Slot already taken' }

  let player: MockTrialPlayer | null = room.spectators.get(playerId) ?? null
  const priorSlot = playerToCourt.get(playerId)
  if (!player && priorSlot) {
    player = room.courts.get(priorSlot.courtId)?.slots[priorSlot.role] ?? null
  }
  if (!player) return { ok: false, error: 'Player not in room' }

  if (priorSlot) {
    const prior = room.courts.get(priorSlot.courtId)
    if (prior) prior.slots[priorSlot.role] = null
  } else {
    room.spectators.delete(playerId)
  }

  player.connected = true
  court.slots[role] = player
  playerToCourt.set(playerId, { courtId, role })
  return { ok: true }
}

export function releaseSlot(socketId: string): { ok: boolean } {
  const code = socketToRoom.get(socketId)
  const playerId = socketToPlayer.get(socketId)
  if (!code || !playerId) return { ok: false }
  const room = rooms.get(code)
  if (!room || room.status !== 'lobby') return { ok: false }
  const slot = playerToCourt.get(playerId)
  if (!slot) return { ok: false }
  const court = room.courts.get(slot.courtId)
  if (!court) return { ok: false }
  const player = court.slots[slot.role]
  if (player) room.spectators.set(playerId, player)
  court.slots[slot.role] = null
  playerToCourt.delete(playerId)
  return { ok: true }
}

export function validateStart(room: MockTrialRoom): { ok: boolean; error?: string } {
  const ready = Array.from(room.courts.values()).filter(
    (court) => court.slots.prosecutor && court.slots.defense && court.slots.scribe,
  )
  if (ready.length === 0) {
    return { ok: false, error: 'At least one court must have Prosecutor + Defense + Scribe filled.' }
  }
  return { ok: true }
}

export function disconnectSocket(socketId: string): { room: MockTrialRoom } | null {
  const code = socketToRoom.get(socketId)
  const playerId = socketToPlayer.get(socketId)
  if (!code || !playerId) return null
  const room = rooms.get(code)
  if (!room) return null

  if (room.hostPlayerId === playerId) {
    room.hostSocketId = ''
  } else if (room.spectators.has(playerId)) {
    const spectator = room.spectators.get(playerId)
    if (spectator) spectator.connected = false
  } else {
    const slot = playerToCourt.get(playerId)
    if (slot) {
      const court = room.courts.get(slot.courtId)
      const player = court?.slots[slot.role]
      if (player) player.connected = false

      if (room.status !== 'lobby' && slot.role === 'scribe' && court) {
        const juryRole = court.slots.jury1 ? 'jury1' : court.slots.jury2 ? 'jury2' : null
        if (juryRole) {
          const promoted = court.slots[juryRole]
          court.slots.scribe = promoted
          court.slots[juryRole] = null
          if (promoted) playerToCourt.set(promoted.id, { courtId: court.id, role: 'scribe' })
          playerToCourt.delete(playerId)
        }
      }
    }
  }

  socketToRoom.delete(socketId)
  socketToPlayer.delete(socketId)
  if (playerToSocket.get(playerId) === socketId) playerToSocket.delete(playerId)
  return { room }
}

export function getRoomForSocket(socketId: string): MockTrialRoom | null {
  const code = socketToRoom.get(socketId)
  return code ? rooms.get(code) ?? null : null
}

export function getPlayerIdForSocket(socketId: string): string | null {
  return socketToPlayer.get(socketId) ?? null
}

export function getCourtRoleForSocket(socketId: string): { courtId: string; role: MockTrialRole } | null {
  const playerId = socketToPlayer.get(socketId)
  return playerId ? playerToCourt.get(playerId) ?? null : null
}

export function isHost(socketId: string): boolean {
  const room = getRoomForSocket(socketId)
  const playerId = socketToPlayer.get(socketId)
  return !!room && !!playerId && room.hostPlayerId === playerId
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code)
  if (!room) return
  if (room.phaseTimer) clearTimeout(room.phaseTimer)
  for (const spectator of room.spectators.values()) {
    playerToSocket.delete(spectator.id)
    playerToCourt.delete(spectator.id)
  }
  for (const court of room.courts.values()) {
    for (const player of Object.values(court.slots)) {
      if (!player) continue
      playerToSocket.delete(player.id)
      playerToCourt.delete(player.id)
    }
  }
  rooms.delete(code)
}
