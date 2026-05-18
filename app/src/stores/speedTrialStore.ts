import { create } from 'zustand'
import { getSocket, destroySocket } from '../speed-trial/socket'
import { EV } from '../speed-trial/types'
import type {
  PlayerInfo,
  QuestionPublic,
  LeaderboardEntry,
  AnswerAck,
  RoundEndedPayload,
  RoomStatus,
  AvatarId,
} from '../speed-trial/types'

// ─── State shape ──────────────────────────────────────────────────────────────

export type SpeedTrialRole = 'host' | 'player' | null

interface SpeedTrialState {
  // Connection
  connected: boolean
  error: string | null

  // Identity
  role: SpeedTrialRole
  playerId: string | null
  nickname: string | null
  myAvatar: AvatarId | null

  // Room
  roomCode: string | null
  roomStatus: RoomStatus
  players: PlayerInfo[]

  // Game progress
  currentRound: number
  totalRounds: number

  // Active question
  currentQuestion: QuestionPublic | null
  questionStartedAt: number | null
  answeredCount: number
  totalPlayerCount: number

  // My answer state
  myAnsweredOptionId: string | null
  myAnswerAck: AnswerAck | null

  // Round result
  roundResult: RoundEndedPayload | null

  // Grand jury
  grandJuryQuestion: QuestionPublic | null
  grandJuryQualifiedIds: string[]
  grandJuryStartedAt: number | null
  myGrandJuryAnsweredOptionId: string | null
  myGrandJuryAnswerAck: AnswerAck | null

  // Final
  finalLeaderboard: LeaderboardEntry[]

  // Actions
  connect: () => void
  disconnect: () => void
  createRoom: (nickname: string, avatar: AvatarId) => void
  joinRoom: (code: string, nickname: string, avatar: AvatarId) => void
  startTournament: () => void
  submitAnswer: (questionId: string, optionId: string) => void
  nextRound: () => void
  startGrandJury: () => void
  finishTournament: () => void
  clearError: () => void
  reset: () => void
}

// ─── Initial values ───────────────────────────────────────────────────────────

const INITIAL: Omit<SpeedTrialState, keyof Actions> = {
  connected: false,
  error: null,
  role: null,
  playerId: null,
  nickname: null,
  myAvatar: null,
  roomCode: null,
  roomStatus: 'lobby',
  players: [],
  currentRound: 0,
  totalRounds: 5,
  currentQuestion: null,
  questionStartedAt: null,
  answeredCount: 0,
  totalPlayerCount: 0,
  myAnsweredOptionId: null,
  myAnswerAck: null,
  roundResult: null,
  grandJuryQuestion: null,
  grandJuryQualifiedIds: [],
  grandJuryStartedAt: null,
  myGrandJuryAnsweredOptionId: null,
  myGrandJuryAnswerAck: null,
  finalLeaderboard: [],
}

// Trick: we'll store action names separately for the initial spread
type Actions = Pick<SpeedTrialState,
  | 'connect' | 'disconnect' | 'createRoom' | 'joinRoom'
  | 'startTournament' | 'submitAnswer' | 'nextRound'
  | 'startGrandJury' | 'finishTournament' | 'clearError' | 'reset'
>

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSpeedTrialStore = create<SpeedTrialState>()((set, get) => {
  // ── Socket event wiring (called once on connect) ─────────────────────────
  function wireSocketEvents(): void {
    const socket = getSocket()

    socket.on('connect', () => set({ connected: true, error: null }))
    socket.on('disconnect', () => set({ connected: false }))
    socket.on('connect_error', (err) => set({ error: `Connection failed: ${err.message}` }))

    socket.on(EV.ROOM_CREATED, ({ code, playerId }: { code: string; playerId: string }) => {
      set({ roomCode: code, playerId, roomStatus: 'lobby' })
    })

    socket.on(EV.ROOM_JOINED, ({
      code, playerId, players,
    }: { code: string; playerId: string; players: PlayerInfo[] }) => {
      set({ roomCode: code, playerId, players, roomStatus: 'lobby' })
    })

    socket.on(EV.PLAYER_LIST, ({ players }: { players: PlayerInfo[] }) => {
      set({ players, totalPlayerCount: players.filter((p) => p.connected).length })
    })

    socket.on(EV.TOURNAMENT_STARTED, ({ totalRounds }: { totalRounds: number }) => {
      set({ totalRounds, currentRound: 0, roomStatus: 'question', roundResult: null })
    })

    socket.on(EV.QUESTION_START, ({
      question, roundNumber, totalRounds, startedAt,
    }: { question: QuestionPublic; roundNumber: number; totalRounds: number; startedAt: number }) => {
      set({
        currentQuestion: question,
        currentRound: roundNumber,
        totalRounds,
        questionStartedAt: startedAt,
        answeredCount: 0,
        myAnsweredOptionId: null,
        myAnswerAck: null,
        roundResult: null,
        roomStatus: 'question',
      })
    })

    socket.on(EV.ANSWER_RECEIVED, ({
      answeredCount, totalPlayers,
    }: { answeredCount: number; totalPlayers: number }) => {
      set({ answeredCount, totalPlayerCount: totalPlayers })
    })

    socket.on(EV.ANSWER_ACK, (ack: AnswerAck) => {
      const { roomStatus } = get()
      if (roomStatus === 'grand_jury') {
        set({ myGrandJuryAnswerAck: ack })
      } else {
        set({ myAnswerAck: ack })
      }
    })

    socket.on(EV.ROUND_ENDED, (payload: RoundEndedPayload) => {
      set({ roundResult: payload, roomStatus: 'leaderboard' })
    })

    socket.on(EV.GRAND_JURY_START, ({
      question, qualifiedPlayerIds, startedAt,
    }: { question: QuestionPublic; qualifiedPlayerIds: string[]; startedAt: number }) => {
      set({
        grandJuryQuestion: question,
        grandJuryQualifiedIds: qualifiedPlayerIds,
        grandJuryStartedAt: startedAt,
        myGrandJuryAnsweredOptionId: null,
        myGrandJuryAnswerAck: null,
        roomStatus: 'grand_jury',
      })
    })

    socket.on(EV.TOURNAMENT_FINISHED, ({
      leaderboard,
    }: { leaderboard: import('../speed-trial/types').LeaderboardEntry[] }) => {
      set({ finalLeaderboard: leaderboard, roomStatus: 'finished' })
    })

    socket.on(EV.ERROR, ({ message }: { message: string }) => {
      set({ error: message })
    })
  }

  return {
    ...INITIAL,

    connect() {
      const socket = getSocket()
      if (!socket.connected) {
        wireSocketEvents()
        socket.connect()
      }
    },

    disconnect() {
      destroySocket()
      set({ ...INITIAL })
    },

    createRoom(nickname, avatar) {
      const socket = getSocket()
      set({ role: 'host', nickname, myAvatar: avatar, error: null })
      socket.emit(EV.CREATE_ROOM, { nickname, avatar })
    },

    joinRoom(code, nickname, avatar) {
      const socket = getSocket()
      set({ role: 'player', nickname, myAvatar: avatar, error: null })
      socket.emit(EV.JOIN_ROOM, { code, nickname, avatar })
    },

    startTournament() {
      getSocket().emit(EV.START_TOURNAMENT)
    },

    submitAnswer(questionId, optionId) {
      const { roomStatus, myAnsweredOptionId, myGrandJuryAnsweredOptionId } = get()
      if (roomStatus === 'grand_jury') {
        if (myGrandJuryAnsweredOptionId) return
        set({ myGrandJuryAnsweredOptionId: optionId })
      } else {
        if (myAnsweredOptionId) return
        set({ myAnsweredOptionId: optionId })
      }
      getSocket().emit(EV.SUBMIT_ANSWER, { questionId, optionId })
    },

    nextRound() {
      getSocket().emit(EV.NEXT_ROUND)
    },

    startGrandJury() {
      getSocket().emit(EV.START_GRAND_JURY)
    },

    finishTournament() {
      getSocket().emit(EV.FINISH_TOURNAMENT)
    },

    clearError() {
      set({ error: null })
    },

    reset() {
      destroySocket()
      set({ ...INITIAL })
    },
  }
})
