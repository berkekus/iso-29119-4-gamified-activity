// ─── Client-side Speed Trial types ───────────────────────────────────────────
// Mirrors server/src/types.ts but kept separate — no shared package needed.

export type Technique = 'STATEMENT' | 'BRANCH' | 'BCC' | 'MCDC' | 'DATA_FLOW'
export type RoomStatus = 'lobby' | 'question' | 'leaderboard' | 'grand_jury' | 'finished'
export type AvatarId = 'new_judge' | 'new_prosecutor' | 'new_defense' | 'bug-defendant'

export interface QuestionOption {
  id: string
  text: string
}

/** Question as received from the server — no correct answer included. */
export interface QuestionPublic {
  id: string
  round: number
  technique: Technique
  prompt: string
  codeSnippet?: string
  options: QuestionOption[]
  timeLimitSeconds: number
}

export interface PlayerInfo {
  id: string
  nickname: string
  avatar: AvatarId
  score: number
  connected: boolean
  isHost: boolean
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

export interface AnswerAck {
  isCorrect: boolean
  pointsEarned: number
  correctOptionId: string
}

export interface RoundEndedPayload {
  correctOptionId: string
  explanation: string
  leaderboard: LeaderboardEntry[]
  isLastRound: boolean
}

// ─── Socket event name constants ──────────────────────────────────────────────

export const EV = {
  // C → S
  CREATE_ROOM:       'create_room',
  JOIN_ROOM:         'join_room',
  START_TOURNAMENT:  'start_tournament',
  SUBMIT_ANSWER:     'submit_answer',
  NEXT_ROUND:        'next_round',
  START_GRAND_JURY:  'start_grand_jury',
  FINISH_TOURNAMENT: 'finish_tournament',
  // S → C
  ROOM_CREATED:         'room_created',
  ROOM_JOINED:          'room_joined',
  PLAYER_LIST:          'player_list',
  TOURNAMENT_STARTED:   'tournament_started',
  QUESTION_START:       'question_start',
  ANSWER_RECEIVED:      'answer_received',
  ANSWER_ACK:           'answer_ack',
  ROUND_ENDED:          'round_ended',
  GRAND_JURY_START:     'grand_jury_start',
  TOURNAMENT_FINISHED:  'tournament_finished',
  ERROR:                'error',
} as const
