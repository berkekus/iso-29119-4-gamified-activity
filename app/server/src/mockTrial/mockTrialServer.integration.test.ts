import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServer, type Server as HttpServer } from 'http'
import { Server } from 'socket.io'
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
  it('runs one case and enforces Jury-before-Scribe when a Jury exists', async () => {
    const host = await makeClient()
    const prosecutor = await makeClient()
    const defense = await makeClient()
    const scribe = await makeClient()
    const jury = await makeClient()

    host.emit(MT_EV.CREATE_ROOM, {
      nickname: 'Hoca',
      avatar: 'new_judge',
      config: { caseCount: 5, defaultArgumentSec: 90, defaultDeliberationSec: 45 },
      playerId: 'host-player',
    })
    const created = await waitForEvent<{ code: string; playerId: string }>(host, MT_EV.ROOM_CREATED)
    expect(created.code).toMatch(/^[A-Z0-9]{6}$/)
    expect(created.playerId).toBe('host-player')

    prosecutor.emit(MT_EV.JOIN_ROOM, { code: created.code, nickname: 'Ali', avatar: 'new_prosecutor', playerId: 'p-player' })
    defense.emit(MT_EV.JOIN_ROOM, { code: created.code, nickname: 'Veli', avatar: 'new_defense', playerId: 'd-player' })
    scribe.emit(MT_EV.JOIN_ROOM, { code: created.code, nickname: 'Ayse', avatar: 'new_judge', playerId: 's-player' })
    jury.emit(MT_EV.JOIN_ROOM, { code: created.code, nickname: 'Can', avatar: 'bug-defendant', playerId: 'j-player' })
    await waitForEvent(prosecutor, MT_EV.ROOM_JOINED)
    await waitForEvent(defense, MT_EV.ROOM_JOINED)
    await waitForEvent(scribe, MT_EV.ROOM_JOINED)
    await waitForEvent(jury, MT_EV.ROOM_JOINED)

    prosecutor.emit(MT_EV.CLAIM_SLOT, { courtId: 'court-1', role: 'prosecutor' })
    defense.emit(MT_EV.CLAIM_SLOT, { courtId: 'court-1', role: 'defense' })
    scribe.emit(MT_EV.CLAIM_SLOT, { courtId: 'court-1', role: 'scribe' })
    jury.emit(MT_EV.CLAIM_SLOT, { courtId: 'court-1', role: 'jury1' })
    await new Promise((r) => setTimeout(r, 100))

    const briefingP = waitForEvent<any>(prosecutor, MT_EV.CASE_START, 3000)
    host.emit(MT_EV.START_GAME)
    const briefing = await briefingP
    expect(briefing.caseIdx).toBe(0)
    expect(briefing.phase).toBe('briefing')

    const arguingP = waitForEvent<any>(prosecutor, MT_EV.PHASE_CHANGE, 2000)
    host.emit(MT_EV.SKIP_PHASE)
    const arguing = await arguingP
    expect(arguing.phase).toBe('arguing')

    prosecutor.emit(MT_EV.SUBMIT_ARGUMENT, { argId: 'p1', sentence: 'p says strong' })
    defense.emit(MT_EV.SUBMIT_ARGUMENT, { argId: 'd1', sentence: 'd says weak' })
    const delib = await waitForEvent<any>(prosecutor, MT_EV.PHASE_CHANGE, 2000)
    expect(delib.phase).toBe('deliberating')

    const scribeErrorP = waitForEvent<any>(scribe, MT_EV.ERROR, 2000)
    scribe.emit(MT_EV.SUBMIT_VERDICT, { verdict: 'not_satisfied', justification: 'Missing third test' })
    const scribeError = await scribeErrorP
    expect(scribeError.message).toContain('Jury vote')

    jury.emit(MT_EV.SUBMIT_VOTE, { side: 'prosecutor' })
    scribe.emit(MT_EV.SUBMIT_VERDICT, { verdict: 'not_satisfied', justification: 'Missing third test' })
    const reveal = await waitForEvent<any>(prosecutor, MT_EV.CASE_REVEAL, 2000)
    expect(reveal.correctVerdict).toBe('not_satisfied')
    expect(reveal.courtResults).toHaveLength(1)
    expect(reveal.courtResults[0].verdictScore).toBe(2)
    expect(reveal.courtResults[0].baseTotal).toBe(3)

    host.disconnect()
    prosecutor.disconnect()
    defense.disconnect()
    scribe.disconnect()
    jury.disconnect()
  }, 10_000)
})
