import type { Technique, Difficulty, AvatarId } from '../types.js'

// ─── Public/domain types ─────────────────────────────────────────────────────

export type MockTrialRole = 'prosecutor' | 'defense' | 'jury1' | 'jury2' | 'scribe'
export type MockTrialPhase = 'briefing' | 'arguing' | 'deliberating' | 'reveal'
export type MockTrialStatus = 'lobby' | 'in_case' | 'reveal' | 'finished'
export type Verdict = 'satisfied' | 'not_satisfied'
export type Side = 'prosecutor' | 'defense'
export type SelfScore = 0 | 0.5 | 1

export interface ArgumentCard {
  id: string
  text: string
  isStrong: boolean
}

export interface TestSetRow {
  label: string
  inputs: Record<string, string>
  expected: string
}

export interface MockTrialCase {
  id: string
  technique: Technique
  difficulty: Difficulty
  title: string
  codeSnippet: string
  testSet: TestSetRow[]
  claim: { coverage: Technique; text: string }
  lawCardRef: string
  prosecutorArguments: ArgumentCard[]
  defenseArguments: ArgumentCard[]
  correctVerdict: Verdict
  answerExplanation: string
  pitfallTag?: string
  argumentSeconds?: number
  deliberationSeconds?: number
}

export interface MockTrialPlayer {
  id: string                  // stable id (socket id at first connect)
  nickname: string
  avatar: AvatarId
  connected: boolean
}

export interface CourtSubmission {
  prosecutorArgId: string | null
  prosecutorSentence: string
  defenseArgId: string | null
  defenseSentence: string
  juryVote: Side | null
  verdict: Verdict | null
  justification: string
  selfScore: SelfScore | null
}

export interface CaseResult {
  caseId: string
  submission: CourtSubmission
  verdictScore: 0 | 2
  prosecutorBonus: 0 | 1
  defenseBonus: 0 | 1
  juryBonus: SelfScore | 0
  hostOverride: number          // can be negative
  caseTotal: number
}

export interface Court {
  id: string                    // "court-1"
  name: string                  // "Court 1"
  slots: Record<MockTrialRole, MockTrialPlayer | null>
  currentSubmission: CourtSubmission
  caseHistory: CaseResult[]
  totalScore: number
}

export interface MockTrialConfig {
  caseCount: 3 | 5 | 7
  defaultArgumentSec: 60 | 90 | 120
  defaultDeliberationSec: 30 | 45 | 60
}

export interface MockTrialRoom {
  code: string
  hostSocketId: string
  hostPlayerId: string
  hostNickname: string
  hostAvatar: AvatarId
  status: MockTrialStatus
  config: MockTrialConfig
  courts: Map<string, Court>
  spectators: Map<string, MockTrialPlayer>
  cases: MockTrialCase[]
  currentCaseIdx: number
  currentPhase: MockTrialPhase | null
  phaseEndsAt: number | null
  phaseTimer: ReturnType<typeof setTimeout> | null
  phasePaused: boolean
  pausedRemainingMs: number | null
}

// ─── Public lobby snapshot (sent to clients) ─────────────────────────────────

export interface CourtPublic {
  id: string
  name: string
  slots: Record<MockTrialRole, MockTrialPlayer | null>
  totalScore: number
  lastCaseDelta: number
  caseHistory: Array<{
    caseId: string
    verdictScore: number
    prosecutorBonus: number
    defenseBonus: number
    juryBonus: number
    hostOverride: number
    caseTotal: number
  }>
}

export interface RoomStatePayload {
  code: string
  status: MockTrialStatus
  config: MockTrialConfig
  courts: CourtPublic[]
  spectators: MockTrialPlayer[]
  hostNickname: string
  caseCount: number
  currentCaseIdx: number
  currentPhase: MockTrialPhase | null
  phaseEndsAt: number | null
  phasePaused: boolean
}

export interface CasePublic {
  // Same as MockTrialCase but with correct verdict + explanation stripped.
  id: string
  technique: Technique
  difficulty: Difficulty
  title: string
  codeSnippet: string
  testSet: TestSetRow[]
  claim: { coverage: Technique; text: string }
  lawCardRef: string
  prosecutorArguments: Array<{ id: string; text: string }>  // isStrong stripped
  defenseArguments: Array<{ id: string; text: string }>
  argumentSeconds: number
  deliberationSeconds: number
}

// ─── Client → Server payloads ────────────────────────────────────────────────

export interface C2S_MTCreateRoom { nickname: string; avatar: AvatarId; config: MockTrialConfig; playerId?: string }
export interface C2S_MTJoinRoom   { code: string; nickname: string; avatar: AvatarId; playerId?: string }
export interface C2S_MTClaimSlot  { courtId: string; role: MockTrialRole }
export interface C2S_MTAddCourt   {}
export interface C2S_MTStartGame  {}
export interface C2S_MTSubmitArgument { argId: string; sentence: string }
export interface C2S_MTSubmitVote { side: Side }
export interface C2S_MTSubmitVerdict { verdict: Verdict; justification: string }
export interface C2S_MTSubmitSelfScore { score: SelfScore }
export interface C2S_MTHostOverride { courtId: string; delta: number }
export interface C2S_MTNextCase   {}
export interface C2S_MTFinishGame {}
export interface C2S_MTSkipPhase  {}
export interface C2S_MTTogglePause {}

// ─── Server → Client payloads ────────────────────────────────────────────────

export interface S2C_MTRoomCreated  { code: string; playerId: string }
export interface S2C_MTRoomJoined   { code: string; playerId: string; isSpectator: boolean }
export interface S2C_MTRoomState    extends RoomStatePayload {}
export interface S2C_MTCaseStart    { case: CasePublic; caseIdx: number; phase: MockTrialPhase; endsAt: number }
export interface S2C_MTPhaseChange  { phase: MockTrialPhase; endsAt: number }
export interface S2C_MTArgumentReceived { courtId: string; role: 'prosecutor' | 'defense'; argId: string; sentence: string }
export interface S2C_MTVoteReceived { courtId: string; side: Side }
export interface S2C_MTCaseReveal   {
  correctVerdict: Verdict
  answerExplanation: string
  pitfallTag?: string
  courtResults: Array<{
    courtId: string
    courtName: string
    submission: CourtSubmission
    verdictScore: number
    prosecutorBonus: number
    defenseBonus: number
    juryBonus: number
    hostOverride: number
    baseTotal: number
    caseTotal: number
  }>
}
export interface S2C_MTLeaderboard {
  courts: Array<{ id: string; name: string; totalScore: number; lastCaseDelta: number; rank: number }>
  caseIdx: number
  isLastCase: boolean
}
export interface S2C_MTGameFinished { finalLeaderboard: S2C_MTLeaderboard['courts'] }
export interface S2C_MTError        { message: string }

// ─── Event name constants ────────────────────────────────────────────────────

export const MT_EV = {
  // C → S
  CREATE_ROOM:        'mt_create_room',
  JOIN_ROOM:          'mt_join_room',
  CLAIM_SLOT:         'mt_claim_slot',
  RELEASE_SLOT:       'mt_release_slot',
  ADD_COURT:          'mt_add_court',
  START_GAME:         'mt_start_game',
  SUBMIT_ARGUMENT:    'mt_submit_argument',
  SUBMIT_VOTE:        'mt_submit_vote',
  SUBMIT_VERDICT:     'mt_submit_verdict',
  SUBMIT_SELFSCORE:   'mt_submit_selfscore',
  HOST_OVERRIDE:      'mt_host_override',
  NEXT_CASE:          'mt_next_case',
  FINISH_GAME:        'mt_finish_game',
  SKIP_PHASE:         'mt_skip_phase',
  TOGGLE_PAUSE:       'mt_toggle_pause',
  // S → C
  ROOM_CREATED:       'mt_room_created',
  ROOM_JOINED:        'mt_room_joined',
  ROOM_STATE:         'mt_room_state',
  CASE_START:         'mt_case_start',
  PHASE_CHANGE:       'mt_phase_change',
  ARGUMENT_RECEIVED:  'mt_argument_received',
  VOTE_RECEIVED:      'mt_vote_received',
  CASE_REVEAL:        'mt_case_reveal',
  LEADERBOARD:        'mt_leaderboard',
  GAME_FINISHED:      'mt_game_finished',
  ERROR:              'mt_error',
} as const

// ─── Constants ───────────────────────────────────────────────────────────────

export const MAX_COURTS = 12
export const BRIEFING_SEC = 30
export const REVEAL_SEC = 30
export const PHASE_GRACE_MS = 1500

export const EMPTY_SUBMISSION: CourtSubmission = {
  prosecutorArgId: null,
  prosecutorSentence: '',
  defenseArgId: null,
  defenseSentence: '',
  juryVote: null,
  verdict: null,
  justification: '',
  selfScore: null,
}
