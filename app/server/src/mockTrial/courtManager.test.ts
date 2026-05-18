import { describe, it, expect, beforeEach } from 'vitest'
import * as CM from './courtManager.js'
import type { MockTrialConfig } from './types.js'

const DEFAULT_CONFIG: MockTrialConfig = {
  caseCount: 5,
  defaultArgumentSec: 90,
  defaultDeliberationSec: 45,
}

beforeEach(() => {
  CM._resetForTests()
})

describe('createRoom', () => {
  it('generates a 6-char alphanumeric code and registers the host socket', () => {
    const { room, playerId } = CM.createRoom('socket-host', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    expect(room.code).toMatch(/^[A-Z0-9]{6}$/)
    expect(playerId).toBe('socket-host')
    expect(CM.getRoomForSocket('socket-host')).toBe(room)
  })

  it('creates room with one initial court named "Court 1"', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    expect(room.courts.size).toBe(1)
    const court = room.courts.get('court-1')
    expect(court?.name).toBe('Court 1')
    expect(Object.values(court!.slots).every((s) => s === null)).toBe(true)
  })
})

describe('addCourt', () => {
  it('adds a new court with incremented id', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    const result = CM.addCourt(room)
    expect(result.ok).toBe(true)
    expect(room.courts.size).toBe(2)
    expect(room.courts.get('court-2')?.name).toBe('Court 2')
  })

  it('refuses to add beyond MAX_COURTS (12)', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    for (let i = 0; i < 11; i++) CM.addCourt(room)
    expect(room.courts.size).toBe(12)
    const result = CM.addCourt(room)
    expect(result.ok).toBe(false)
    expect(room.courts.size).toBe(12)
  })
})

describe('joinRoom', () => {
  it('rejects unknown code', () => {
    const result = CM.joinRoom('s1', 'XXXXXX', 'Ali', 'new_defense')
    expect('error' in result).toBe(true)
  })

  it('attaches player as spectator initially (no slot claimed yet)', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    const result = CM.joinRoom('s1', room.code, 'Ali', 'new_defense')
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(room.spectators.has('s1')).toBe(true)
    expect(result.isSpectator).toBe(true)
  })

  it('rejects duplicate nickname (case-insensitive)', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    CM.joinRoom('s1', room.code, 'Ali', 'new_defense')
    const dup = CM.joinRoom('s2', room.code, 'ALI', 'new_prosecutor')
    expect('error' in dup).toBe(true)
  })
})

describe('claimSlot', () => {
  it('moves spectator into the requested court slot', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    CM.joinRoom('s1', room.code, 'Ali', 'new_defense')

    const result = CM.claimSlot('s1', 'court-1', 'prosecutor')
    expect(result.ok).toBe(true)
    expect(room.courts.get('court-1')!.slots.prosecutor?.nickname).toBe('Ali')
    expect(room.spectators.has('s1')).toBe(false)
  })

  it('rejects if slot already occupied by another player', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    CM.joinRoom('s1', room.code, 'Ali', 'new_defense')
    CM.joinRoom('s2', room.code, 'Veli', 'new_prosecutor')
    CM.claimSlot('s1', 'court-1', 'prosecutor')

    const result = CM.claimSlot('s2', 'court-1', 'prosecutor')
    expect(result.ok).toBe(false)
  })

  it('releases previous slot when claiming a new one', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    CM.joinRoom('s1', room.code, 'Ali', 'new_defense')
    CM.claimSlot('s1', 'court-1', 'prosecutor')
    CM.claimSlot('s1', 'court-1', 'defense')

    expect(room.courts.get('court-1')!.slots.prosecutor).toBeNull()
    expect(room.courts.get('court-1')!.slots.defense?.nickname).toBe('Ali')
  })

  it('rejects claim during in_case status', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    CM.joinRoom('s1', room.code, 'Ali', 'new_defense')
    room.status = 'in_case'

    const result = CM.claimSlot('s1', 'court-1', 'prosecutor')
    expect(result.ok).toBe(false)
  })
})

describe('validateStart', () => {
  it('requires at least one court with Prosecutor + Defense + Scribe filled', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    expect(CM.validateStart(room).ok).toBe(false)

    CM.joinRoom('s1', room.code, 'A', 'new_prosecutor')
    CM.joinRoom('s2', room.code, 'B', 'new_defense')
    CM.joinRoom('s3', room.code, 'C', 'new_judge')

    CM.claimSlot('s1', 'court-1', 'prosecutor')
    CM.claimSlot('s2', 'court-1', 'defense')
    CM.claimSlot('s3', 'court-1', 'scribe')

    expect(CM.validateStart(room).ok).toBe(true)
  })
})

describe('disconnectSocket', () => {
  it('marks player as disconnected but keeps slot occupied', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    CM.joinRoom('s1', room.code, 'Ali', 'new_defense')
    CM.claimSlot('s1', 'court-1', 'prosecutor')

    CM.disconnectSocket('s1')
    expect(room.courts.get('court-1')!.slots.prosecutor?.connected).toBe(false)
  })

  it('removes spectator on disconnect', () => {
    const { room } = CM.createRoom('h', 'Hoca', 'new_judge', DEFAULT_CONFIG)
    CM.joinRoom('s1', room.code, 'Ali', 'new_defense')

    CM.disconnectSocket('s1')
    expect(room.spectators.has('s1')).toBe(false)
  })
})
