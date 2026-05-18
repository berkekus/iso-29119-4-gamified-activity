import type {
  MockTrialRoom, Court, MockTrialPlayer, MockTrialRole, MockTrialConfig,
} from './types.js'
import { EMPTY_SUBMISSION, MAX_COURTS } from './types.js'
import type { AvatarId } from '../types.js'

// ─── In-memory state ─────────────────────────────────────────────────────────

const rooms = new Map<string, MockTrialRoom>()
const socketToRoom = new Map<string, string>()
const socketToCourt = new Map<string, { courtId: string; role: MockTrialRole }>()  // only when slotted

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

// ─── Test helper ─────────────────────────────────────────────────────────────

export function _resetForTests(): void {
  rooms.clear()
  socketToRoom.clear()
  socketToCourt.clear()
}

// ─── Room lifecycle ──────────────────────────────────────────────────────────

export function createRoom(
  hostSocketId: string,
  nickname: string,
  avatar: AvatarId,
  config: MockTrialConfig,
): { room: MockTrialRoom; playerId: string } {
  const code = uniqueCode()
  const room: MockTrialRoom = {
    code,
    hostSocketId,
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
  }
  room.courts.set('court-1', emptyCourt('court-1', 'Court 1'))
  rooms.set(code, room)
  socketToRoom.set(hostSocketId, code)
  return { room, playerId: hostSocketId }
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
): { room: MockTrialRoom; playerId: string; isSpectator: boolean } | { error: string } {
  const room = rooms.get(code.toUpperCase())
  if (!room) return { error: 'Room not found. Check the code and try again.' }

  const nick = nickname.trim()
  const allNicks = [
    ...Array.from(room.spectators.values()).map((p) => p.nickname),
    ...Array.from(room.courts.values()).flatMap((c) =>
      Object.values(c.slots).filter((s): s is MockTrialPlayer => s !== null).map((s) => s.nickname),
    ),
    room.hostNickname,
  ]
  if (allNicks.some((n) => n.toLowerCase() === nick.toLowerCase())) {
    return { error: 'That nickname is already taken in this room.' }
  }

  const player: MockTrialPlayer = { id: socketId, nickname: nick, avatar, connected: true }
  room.spectators.set(socketId, player)
  socketToRoom.set(socketId, room.code)
  return { room, playerId: socketId, isSpectator: true }
}

// ─── Slot management ─────────────────────────────────────────────────────────

export function claimSlot(
  socketId: string,
  courtId: string,
  role: MockTrialRole,
): { ok: boolean; error?: string } {
  const code = socketToRoom.get(socketId)
  if (!code) return { ok: false, error: 'Not in a room' }
  const room = rooms.get(code)
  if (!room) return { ok: false, error: 'Room not found' }
  if (room.status !== 'lobby') return { ok: false, error: 'Slots locked after game start' }

  const court = room.courts.get(courtId)
  if (!court) return { ok: false, error: 'Court not found' }
  if (court.slots[role] !== null) return { ok: false, error: 'Slot already taken' }

  // Find the player record (spectator or already-slotted)
  let player: MockTrialPlayer | null = room.spectators.get(socketId) ?? null
  let priorSlot = socketToCourt.get(socketId)
  if (!player && priorSlot) {
    player = room.courts.get(priorSlot.courtId)?.slots[priorSlot.role] ?? null
  }
  if (!player) return { ok: false, error: 'Player not in room' }

  // Release prior slot if any
  if (priorSlot) {
    const prior = room.courts.get(priorSlot.courtId)
    if (prior) prior.slots[priorSlot.role] = null
  } else {
    room.spectators.delete(socketId)
  }

  court.slots[role] = player
  socketToCourt.set(socketId, { courtId, role })
  return { ok: true }
}

export function releaseSlot(socketId: string): { ok: boolean } {
  const code = socketToRoom.get(socketId)
  if (!code) return { ok: false }
  const room = rooms.get(code)
  if (!room || room.status !== 'lobby') return { ok: false }
  const slot = socketToCourt.get(socketId)
  if (!slot) return { ok: false }
  const court = room.courts.get(slot.courtId)
  if (!court) return { ok: false }
  const player = court.slots[slot.role]
  if (player) room.spectators.set(socketId, player)
  court.slots[slot.role] = null
  socketToCourt.delete(socketId)
  return { ok: true }
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateStart(room: MockTrialRoom): { ok: boolean; error?: string } {
  const ready = Array.from(room.courts.values()).filter(
    (c) => c.slots.prosecutor && c.slots.defense && c.slots.scribe,
  )
  if (ready.length === 0) {
    return { ok: false, error: 'At least one court must have Prosecutor + Defense + Scribe filled.' }
  }
  return { ok: true }
}

// ─── Disconnect ──────────────────────────────────────────────────────────────

export function disconnectSocket(socketId: string): { room: MockTrialRoom } | null {
  const code = socketToRoom.get(socketId)
  if (!code) return null
  const room = rooms.get(code)
  if (!room) return null

  if (room.spectators.has(socketId)) {
    room.spectators.delete(socketId)
  } else {
    const slot = socketToCourt.get(socketId)
    if (slot) {
      const court = room.courts.get(slot.courtId)
      const player = court?.slots[slot.role]
      if (player) player.connected = false
    }
  }
  socketToRoom.delete(socketId)
  socketToCourt.delete(socketId)
  return { room }
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

export function getRoomForSocket(socketId: string): MockTrialRoom | null {
  const code = socketToRoom.get(socketId)
  return code ? rooms.get(code) ?? null : null
}

export function getCourtRoleForSocket(socketId: string): { courtId: string; role: MockTrialRole } | null {
  return socketToCourt.get(socketId) ?? null
}

export function isHost(socketId: string): boolean {
  const room = getRoomForSocket(socketId)
  return !!room && room.hostSocketId === socketId
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code)
  if (!room) return
  if (room.phaseTimer) clearTimeout(room.phaseTimer)
  rooms.delete(code)
}
