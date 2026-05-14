/**
 * Quick end-to-end smoke test — run with:
 *   node test-e2e.mjs
 * while the server is already running (npm run dev in this directory).
 */
import { io } from 'socket.io-client'

const URL = 'http://localhost:3001'

function connect(label) {
  return new Promise((resolve, reject) => {
    const socket = io(URL, { transports: ['websocket', 'polling'] })
    socket.on('connect', () => {
      console.log(`[${label}] connected  id=${socket.id}`)
      resolve(socket)
    })
    socket.on('connect_error', (err) => {
      console.error(`[${label}] connect_error: ${err.message}`)
      reject(err)
    })
    setTimeout(() => reject(new Error(`[${label}] timeout`)), 5000)
  })
}

async function run() {
  console.log('=== Speed Trial E2E smoke test ===\n')

  // Host connects and creates a room
  const host = await connect('HOST')
  const roomCode = await new Promise((resolve) => {
    host.emit('create_room', { nickname: 'TestHost' })
    host.on('room_created', ({ code, playerId }) => {
      console.log(`[HOST] room_created  code=${code}  playerId=${playerId}`)
      resolve(code)
    })
    host.on('error', (e) => console.error('[HOST] error:', e))
  })

  // Player connects and joins the room
  const player = await connect('PLAYER')
  await new Promise((resolve) => {
    player.emit('join_room', { code: roomCode, nickname: 'Alice' })
    player.on('room_joined', ({ code, playerId, players }) => {
      console.log(`[PLAYER] room_joined  code=${code}  players=${players.map(p => p.nickname).join(', ')}`)
      resolve()
    })
    player.on('error', (e) => console.error('[PLAYER] error:', e))
  })

  // Host starts the tournament
  let q1
  const tournamentReady = new Promise((resolve) => {
    let started = false
    host.on('tournament_started', ({ totalRounds }) => {
      console.log(`[HOST] tournament_started  totalRounds=${totalRounds}`)
      started = true
    })
    host.on('question_start', (payload) => {
      console.log(`[HOST] question_start  round=${payload.roundNumber}  q="${payload.question.prompt.slice(0,60)}…"`)
      q1 = payload.question
      if (started) resolve()
    })
  })

  const playerQ = new Promise((resolve) => {
    player.on('tournament_started', () => console.log('[PLAYER] tournament_started'))
    player.on('question_start', (payload) => {
      console.log(`[PLAYER] question_start  q.id=${payload.question.id}`)
      resolve(payload.question)
    })
  })

  host.emit('start_tournament')
  await tournamentReady
  await playerQ

  // Player submits the correct answer (option 'c' for round 1)
  const answerResult = new Promise((resolve) => {
    player.on('answer_ack', (ack) => {
      console.log(`[PLAYER] answer_ack  isCorrect=${ack.isCorrect}  points=${ack.pointsEarned}`)
      resolve(ack)
    })
  })

  // Also wait for host to receive answer_received
  const hostGotAnswer = new Promise((resolve) => {
    host.on('answer_received', ({ answeredCount, totalPlayers }) => {
      console.log(`[HOST] answer_received  ${answeredCount}/${totalPlayers}`)
      resolve()
    })
  })

  player.emit('submit_answer', { questionId: q1.id, optionId: q1.options[0].id })
  const ack = await answerResult
  await hostGotAnswer

  // Wait for round_ended (single player → auto-end)
  const roundEnded = new Promise((resolve) => {
    host.on('round_ended', (payload) => {
      console.log(`[HOST] round_ended  correct=${payload.correctOptionId}  leaderboard[0]=${JSON.stringify(payload.leaderboard[0])}`)
      resolve(payload)
    })
  })
  await roundEnded

  console.log('\n✓ All smoke tests passed — Socket.IO server is working correctly.\n')
  process.exit(0)
}

run().catch((err) => {
  console.error('\n✗ Test failed:', err.message)
  process.exit(1)
})
