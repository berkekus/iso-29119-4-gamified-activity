// Client-side mirror of server/src/mockTrial/types.ts (public payloads only).
import type { AvatarId, Technique } from '../speed-trial/types'

export type { AvatarId, Technique }

export type MockTrialRole = 'prosecutor' | 'defense' | 'jury1' | 'jury2' | 'scribe'
export type MockTrialPhase = 'briefing' | 'arguing' | 'deliberating' | 'reveal'
export type MockTrialStatus = 'lobby' | 'in_case' | 'reveal' | 'finished'
export type Verdict = 'satisfied' | 'not_satisfied'
export type Side = 'prosecutor' | 'defense'
export type SelfScore = 0 | 0.5 | 1

export interface MockTrialPlayer {
  id: string
  nickname: string
  avatar: AvatarId
  connected: boolean
}

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

export interface MockTrialConfig {
  caseCount: 3 | 5 | 7
  defaultArgumentSec: 60 | 90 | 120
  defaultDeliberationSec: 30 | 45 | 60
}

export interface CasePublic {
  id: string
  technique: Technique
  difficulty: 'easy' | 'medium' | 'hard'
  title: string
  codeSnippet: string
  testSet: Array<{ label: string; inputs: Record<string, string>; expected: string }>
  claim: { coverage: Technique; text: string }
  lawCardRef: string
  prosecutorArguments: Array<{ id: string; text: string }>
  defenseArguments: Array<{ id: string; text: string }>
  argumentSeconds: number
  deliberationSeconds: number
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

export interface CourtResult {
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
}

export interface LeaderboardCourt {
  id: string
  name: string
  totalScore: number
  lastCaseDelta: number
  rank: number
}

export interface RoomState {
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

export const MT_EV = {
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
