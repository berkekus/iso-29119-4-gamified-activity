// ─── Domain types ────────────────────────────────────────────────────────────

export type Technique = 'STATEMENT' | 'BRANCH' | 'BCC' | 'MCDC' | 'DATA_FLOW'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type RoomStatus = 'lobby' | 'question' | 'leaderboard' | 'grand_jury' | 'finished'
export type AvatarId = 'new_judge' | 'new_prosecutor' | 'new_defense' | 'bug-defendant'

export interface QuestionOption {
  id: string
  text: string
}

export interface SpeedTrialQuestion {
  id: string
  round: number
  technique: Technique
  prompt: string
  codeSnippet?: string
  options: QuestionOption[]
  correctOptionId: string
  explanation: string
  difficulty: Difficulty
  timeLimitSeconds: number
}

/** Question sent to clients — correct answer stripped */
export interface QuestionPublic {
  id: string
  round: number
  technique: Technique
  prompt: string
  codeSnippet?: string
  options: QuestionOption[]
  timeLimitSeconds: number
}

export interface PlayerAnswer {
  questionId: string
  optionId: string
  submittedAt: number
  isCorrect: boolean
  pointsEarned: number
}

export interface Player {
  id: string
  nickname: string
  avatar: AvatarId
  score: number
  answers: Record<string, PlayerAnswer>
  connected: boolean
}

export interface LeaderboardEntry {
  playerId: string
  nickname: string
  avatar: AvatarId
  score: number
  rank: number
  correctAnswers: number
  delta: number
}

export interface PlayerInfo {
  id: string
  nickname: string
  avatar: AvatarId
  score: number
  connected: boolean
  isHost: boolean
}

export interface Room {
  code: string
  hostId: string
  hostNickname: string
  hostAvatar: AvatarId
  players: Map<string, Player>
  status: RoomStatus
  currentRound: number
  totalRounds: number
  questions: SpeedTrialQuestion[]
  grandJuryQuestion: SpeedTrialQuestion
  currentQuestionStartedAt: number | null
  roundTimer: ReturnType<typeof setTimeout> | null
  leaderboard: LeaderboardEntry[]
}

// ─── Socket event payloads (Client → Server) ─────────────────────────────────

export interface C2S_CreateRoom { nickname: string; avatar: AvatarId }
export interface C2S_JoinRoom   { code: string; nickname: string; avatar: AvatarId }
export interface C2S_SubmitAnswer { questionId: string; optionId: string }

// ─── Socket event payloads (Server → Client) ─────────────────────────────────

export interface S2C_RoomCreated  { code: string; playerId: string }
export interface S2C_RoomJoined   { code: string; playerId: string; players: PlayerInfo[] }
export interface S2C_PlayerList   { players: PlayerInfo[] }
export interface S2C_TournamentStarted { totalRounds: number }

export interface S2C_QuestionStart {
  question: QuestionPublic
  roundNumber: number
  totalRounds: number
  startedAt: number
}

export interface S2C_AnswerReceived { answeredCount: number; totalPlayers: number }

export interface S2C_AnswerAck {
  isCorrect: boolean
  pointsEarned: number
  correctOptionId: string
}

export interface S2C_RoundEnded {
  correctOptionId: string
  explanation: string
  leaderboard: LeaderboardEntry[]
  isLastRound: boolean
}

export interface S2C_GrandJuryStart {
  question: QuestionPublic
  qualifiedPlayerIds: string[]
  startedAt: number
}

export interface S2C_TournamentFinished {
  leaderboard: LeaderboardEntry[]
}

export interface S2C_Error { message: string }
