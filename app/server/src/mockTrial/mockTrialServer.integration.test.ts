import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServer, type Server as HttpServer } from 'http'
import { Server, type Socket as ServerSocket } from 'socket.io'
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client'
import { registerMockTrial } from './mockTrialServer.js'
import * as CM from './courtManager.js'
import { MT_EV } from './types.js'

let httpServer: HttpServer
let io: Server
let port: number

async function makeClient(): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const c = ioc(`http://localhost:${port}/mock-trial`, { transports: ['websocket'], forceNew: true })
    c.on('connect', () => resolve(c))
    c.on('connect_error', reject)
  })
}

function waitForEvent<T = any>(c: ClientSocket, event: string, timeoutMs = 2000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs)
    c.once(event, (payload: T) => { clearTimeout(t); resolve(payload) })
  })
}

beforeEach(async () => {
  CM._resetForTests()
  httpServer = createServer()
  io = new Server(httpServer)
  registerMockTrial(io)
  await new Promise<void>((resolve) => httpServer.listen(0, () => {
    port = (httpServer.address() as any).port
    resolve()
  }))
})

afterEach(async () => {
  io.close()
  await new Promise<void>((resolve) => httpServer.close(() => resolve()))
})

describe('Mock Trial end-to-end', () => {
  it('runs lobby → briefing → arguing → deliberating → reveal for 1 case with 4 players', async () => {
    const host = await makeClient()
    const p1 = await makeClient()
    const p2 = await makeClient()
    const p3 = await makeClient()

    // Host creates the room
    host.emit(MT_EV.CREATE_ROOM, {
      nickname: 'Hoca', avatar: 'new_judge',
      config: { caseCount: 5, defaultArgumentSec: 90, defaultDeliberationSec: 45 },
    })
    const created = await waitForEvent<{ code: string; playerId: string }>(host, MT_EV.ROOM_CREATED)
    expect(created.code).toMatch(/^[A-Z0-9]{6}$/)

    // 3 players join
    p1.emit(MT_EV.JOIN_ROOM, { code: created.code, nickname: 'Ali', avatar: 'new_prosecutor' })
    p2.emit(MT_EV.JOIN_ROOM, { code: created.code, nickname: 'Veli', avatar: 'new_defense' })
    p3.emit(MT_EV.JOIN_ROOM, { code: created.code, nickname: 'Ayse', avatar: 'new_judge' })
    await waitForEvent(p1, MT_EV.ROOM_JOINED)
    await waitForEvent(p2, MT_EV.ROOM_JOINED)
    await waitForEvent(p3, MT_EV.ROOM_JOINED)

    // Each claims a slot in court-1
    p1.emit(MT_EV.CLAIM_SLOT, { courtId: 'court-1', role: 'prosecutor' })
    p2.emit(MT_EV.CLAIM_SLOT, { courtId: 'court-1', role: 'defense' })
    p3.emit(MT_EV.CLAIM_SLOT, { courtId: 'court-1', role: 'scribe' })
    // Allow a tick for slot broadcasts
    await new Promise((r) => setTimeout(r, 100))

    // Host starts the game
    const briefingP = waitForEvent<any>(p1, MT_EV.CASE_START, 3000)
    host.emit(MT_EV.START_GAME)
    const briefing = await briefingP
    expect(briefing.caseIdx).toBe(0)
    expect(briefing.phase).toBe('briefing')

    // Wait for briefing → arguing transition (briefing is 30s fixed)
    const arguing = await waitForEvent<any>(p1, MT_EV.PHASE_CHANGE, 32_000)
    expect(arguing.phase).toBe('arguing')

    // Prosecutor + Defense submit arguments → should early-advance to deliberating
    p1.emit(MT_EV.SUBMIT_ARGUMENT, { argId: 'p1', sentence: 'p says strong' })
    p2.emit(MT_EV.SUBMIT_ARGUMENT, { argId: 'd1', sentence: 'd says strong' })
    const delib = await waitForEvent<any>(p1, MT_EV.PHASE_CHANGE, 2000)
    expect(delib.phase).toBe('deliberating')

    // Scribe submits verdict → early-advance to reveal
    p3.emit(MT_EV.SUBMIT_VERDICT, { verdict: 'not_satisfied', justification: 'Missing third test' })
    const reveal = await waitForEvent<any>(p1, MT_EV.CASE_REVEAL, 2000)
    expect(reveal.correctVerdict).toBe('not_satisfied')
    expect(reveal.courtResults).toHaveLength(1)
    expect(reveal.courtResults[0].verdictScore).toBe(2)

    host.disconnect(); p1.disconnect(); p2.disconnect(); p3.disconnect()
  }, 40_000)
})
