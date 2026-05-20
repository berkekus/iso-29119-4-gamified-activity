# Mock Trial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a role-based "Mock Trial" multiplayer mode (Prosecutor / Defense / Jury / Scribe in 4-5 person courts) alongside the existing Speed Trial mode, implementing the PDF "Test Courthouse" group format.

**Architecture:** New Socket.IO namespace `/mock-trial` on the existing server. Server logic lives in `app/server/src/mockTrial/`; client logic in `app/src/mock-trial/`, `app/src/stores/mockTrialStore.ts`, and 6 new screens under `app/src/screens/`. Speed Trial code is **not modified** (only 2 lines added to `socketServer.ts` to register the namespace).

**Tech Stack:** TypeScript (strict), React 19, Zustand, Socket.IO 4.x, Vite, Tailwind, Vitest (server-side tests added).

**Spec reference:** [docs/superpowers/specs/2026-05-18-mock-trial-multiplayer-design.md](../specs/2026-05-18-mock-trial-multiplayer-design.md)

---

## Task 0: Server-side Vitest setup

**Why:** The server currently has no test framework. Tasks 3 and 4 are TDD-driven on server logic, so we need vitest installed before starting.

**Files:**
- Modify: `app/server/package.json`
- Create: `app/server/vitest.config.ts`

- [ ] **Step 1: Add vitest to server devDependencies**

Run from `app/server/`:
```bash
pnpm add -D vitest@^2.1.0
```

- [ ] **Step 2: Add test script to `app/server/package.json`**

Edit the `scripts` block — replace it with:
```json
"scripts": {
  "dev": "tsx watch src/socketServer.ts",
  "start": "tsx src/socketServer.ts",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Create vitest config**

Create `app/server/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
})
```

- [ ] **Step 4: Smoke-test vitest works**

Create `app/server/src/mockTrial/_smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('vitest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run: `cd app/server && pnpm test`
Expected: `1 passed`. Then delete the smoke file: `rm app/server/src/mockTrial/_smoke.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add app/server/package.json app/server/vitest.config.ts app/server/pnpm-lock.yaml
git commit -m "chore(server): add vitest for mock trial test coverage"
```

---

## Task 1: Server-side types module

**Files:**
- Create: `app/server/src/mockTrial/types.ts`

- [ ] **Step 1: Create `app/server/src/mockTrial/types.ts`**

```ts
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
}

// ─── Public lobby snapshot (sent to clients) ─────────────────────────────────

export interface CourtPublic {
  id: string
  name: string
  slots: Record<MockTrialRole, MockTrialPlayer | null>
  totalScore: number
  lastCaseDelta: number
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

export interface C2S_MTCreateRoom { nickname: string; avatar: AvatarId; config: MockTrialConfig }
export interface C2S_MTJoinRoom   { code: string; nickname: string; avatar: AvatarId }
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
    caseTotal: number          // before host override
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
```

- [ ] **Step 2: Compile-check**

Run: `cd app/server && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/server/src/mockTrial/types.ts
git commit -m "feat(mock-trial): server-side types and event constants"
```

---

## Task 2: Mock Trial case content (5 cases)

**Files:**
- Create: `app/server/src/mockTrial/cases.ts`

These are refactors of the 5 existing Speed Trial questions into the Mock Trial format. Each gets a test set, 4 argument cards (2 per side, with 1-2 `isStrong`), and an answer explanation.

- [ ] **Step 1: Create `app/server/src/mockTrial/cases.ts`**

```ts
import type { MockTrialCase } from './types.js'

export const MOCK_TRIAL_CASES: MockTrialCase[] = [
  // ─── Case 1: Statement Coverage ──────────────────────────────────────────
  {
    id: 'mt-stmt-classify-01',
    technique: 'STATEMENT',
    difficulty: 'easy',
    title: 'The People vs. Three Returns',
    codeSnippet:
      'function classify(score: number) {\n  if (score >= 90) return "A";\n  if (score >= 70) return "B";\n  return "C";\n}',
    testSet: [
      { label: 'T1', inputs: { score: '85' }, expected: '"B"' },
      { label: 'T2', inputs: { score: '95' }, expected: '"A"' },
    ],
    claim: {
      coverage: 'STATEMENT',
      text: 'These 2 tests achieve 100% Statement Coverage.',
    },
    lawCardRef: 'law-statement',
    prosecutorArguments: [
      { id: 'p1', text: 'The `return "C"` statement on line 4 is never executed — one statement is uncovered.', isStrong: true },
      { id: 'p2', text: 'Two tests cannot cover three branches; we need at least three.', isStrong: true },
      { id: 'p3', text: 'Boundary values 70 and 90 are not tested.', isStrong: false },
    ],
    defenseArguments: [
      { id: 'd1', text: 'Both tests reach a return statement — every line in the active path executes.', isStrong: false },
      { id: 'd2', text: 'Statement Coverage only counts unique line executions; T1 and T2 cover lines 2 and 3.', isStrong: false },
      { id: 'd3', text: 'The default branch is implicit and does not count toward coverage.', isStrong: false },
    ],
    correctVerdict: 'not_satisfied',
    answerExplanation:
      'Statement Coverage requires **every executable statement** to run at least once. The three `return` statements are each executable statements. T1 hits `return "B"`, T2 hits `return "A"`, but `return "C"` is never reached. We need a third test with `score < 70` to satisfy 100% Statement Coverage.',
    pitfallTag: 'Missed default-path statement',
  },

  // ─── Case 2: Branch Coverage ─────────────────────────────────────────────
  {
    id: 'mt-branch-empty-queue-01',
    technique: 'BRANCH',
    difficulty: 'easy',
    title: 'The People vs. The Skipped Loop',
    codeSnippet:
      'while (queue.length > 0) {\n  process(queue.shift());\n}',
    testSet: [
      { label: 'T1', inputs: { 'queue.length': '5' }, expected: 'all 5 processed' },
      { label: 'T2', inputs: { 'queue.length': '1' }, expected: '1 processed' },
    ],
    claim: {
      coverage: 'BRANCH',
      text: 'These 2 tests achieve 100% Branch Coverage of the while loop.',
    },
    lawCardRef: 'law-branch',
    prosecutorArguments: [
      { id: 'p1', text: 'The FALSE branch of the loop condition (queue empty at entry) is never exercised.', isStrong: true },
      { id: 'p2', text: 'No test starts with an empty queue, so the loop-skip path is uncovered.', isStrong: true },
      { id: 'p3', text: 'The `process` function is called with different values but never inspected.', isStrong: false },
    ],
    defenseArguments: [
      { id: 'd1', text: 'Both true and false outcomes of the condition happen at runtime — the loop terminates.', isStrong: false },
      { id: 'd2', text: 'Branch coverage only requires loop body execution; both tests achieve this.', isStrong: false },
      { id: 'd3', text: 'A queue length of 1 covers the boundary case sufficiently.', isStrong: false },
    ],
    correctVerdict: 'not_satisfied',
    answerExplanation:
      'Branch Coverage (ISO 29119-4 §5.2.2) requires **every branch outcome — TRUE and FALSE — to be exercised at the entry** of a decision. A non-empty queue always enters the loop (TRUE), then exits when empty. But to take the FALSE branch *as a branch decision*, the loop must be entered with an empty queue and skipped entirely. T1 and T2 only show TRUE-at-entry. A T3 with `queue.length = 0` is required.',
    pitfallTag: 'Loop FALSE branch at entry missed',
  },

  // ─── Case 3: Branch Condition Coverage (BCC) ─────────────────────────────
  {
    id: 'mt-bcc-and-three-01',
    technique: 'BCC',
    difficulty: 'medium',
    title: 'The People vs. Conjunction',
    codeSnippet: 'if (A && B) { /* ... */ }',
    testSet: [
      { label: 'T1', inputs: { A: 'T', B: 'T' }, expected: 'decision = T' },
      { label: 'T2', inputs: { A: 'T', B: 'F' }, expected: 'decision = F' },
      { label: 'T3', inputs: { A: 'F', B: 'T' }, expected: 'decision = F' },
    ],
    claim: {
      coverage: 'BCC',
      text: 'These 3 tests satisfy Branch Condition Coverage for `A && B`.',
    },
    lawCardRef: 'law-bcc',
    prosecutorArguments: [
      { id: 'p1', text: 'A=F,B=F is missing — without it, we lack full combinatorial coverage.', isStrong: false },
      { id: 'p2', text: 'The decision outcome F appears twice but T only once — coverage is unbalanced.', isStrong: false },
      { id: 'p3', text: 'BCC requires all 2^N combinations; only 3 of 4 are present.', isStrong: false },
    ],
    defenseArguments: [
      { id: 'd1', text: 'A takes both T (T1,T2) and F (T3); B takes both T (T1,T3) and F (T2); decision takes T (T1) and F (T2,T3) — all BCC criteria met.', isStrong: true },
      { id: 'd2', text: 'BCC = Branch Coverage + Condition Coverage; both decision outcomes and both values of each operand are present.', isStrong: true },
      { id: 'd3', text: 'Only MCC (Multiple Condition Coverage) requires all 2^N combinations; BCC does not.', isStrong: false },
    ],
    correctVerdict: 'satisfied',
    answerExplanation:
      'BCC requires (1) every **decision** outcome (T and F) to occur, and (2) every **condition** to independently take both T and F. Audit: A takes T in T1,T2 and F in T3 ✓; B takes T in T1,T3 and F in T2 ✓; decision is T in T1 and F in T2,T3 ✓. All three BCC clauses are satisfied. Full combinatorial coverage (A=F,B=F included) is required by MCC/BCC-exhaustive, not by standard BCC.',
    pitfallTag: 'Confusing BCC with MCC',
  },

  // ─── Case 4: MCDC Independence ───────────────────────────────────────────
  {
    id: 'mt-mcdc-and-three-01',
    technique: 'MCDC',
    difficulty: 'hard',
    title: 'The People vs. The Isolated Variable',
    codeSnippet: 'if (A && B && C) { /* ... */ }',
    testSet: [
      { label: 'T1', inputs: { A: 'T', B: 'T', C: 'T' }, expected: 'decision = T' },
      { label: 'T2', inputs: { A: 'F', B: 'T', C: 'T' }, expected: 'decision = F' },
      { label: 'T3', inputs: { A: 'T', B: 'F', C: 'T' }, expected: 'decision = F' },
      { label: 'T4', inputs: { A: 'T', B: 'T', C: 'F' }, expected: 'decision = F' },
    ],
    claim: {
      coverage: 'MCDC',
      text: 'These 4 tests demonstrate MC/DC independence for each condition A, B, C.',
    },
    lawCardRef: 'law-mcdc',
    prosecutorArguments: [
      { id: 'p1', text: 'The independence pairs (T1,T2), (T1,T3), (T1,T4) only show each variable changing — they do not prove independent effect against a fixed baseline.', isStrong: false },
      { id: 'p2', text: 'For B independence: only T1 vs T3 — but T2 also exists where B=T,A=F — there is no contradiction.', isStrong: false },
      { id: 'p3', text: 'Tests cover only the "one condition flips" pattern; we need additional rows to show stability.', isStrong: false },
    ],
    defenseArguments: [
      { id: 'd1', text: 'For A: T1(T,T,T)→T vs T2(F,T,T)→F — only A changes, decision flips ✓. For B: T1 vs T3 (only B changes, flips) ✓. For C: T1 vs T4 (only C changes, flips) ✓.', isStrong: true },
      { id: 'd2', text: 'MC/DC requires N+1 tests for N conditions; we have 4 tests for 3 conditions, exactly matching the criterion.', isStrong: true },
      { id: 'd3', text: 'All decision outcomes T and F are reached, and each variable appears in both T and F states.', isStrong: false },
    ],
    correctVerdict: 'satisfied',
    answerExplanation:
      'MC/DC (ISO 29119-4 §5.3.6) requires that each condition be shown to **independently affect the decision**. The proof for each is a pair of test rows where (1) only that condition changes, all others stay fixed, and (2) the decision outcome flips. For A: T1(T,T,T) and T2(F,T,T) — only A changes T→F, decision flips T→F ✓. For B: T1 and T3 — only B changes, decision flips ✓. For C: T1 and T4 — only C changes, decision flips ✓. All three independence requirements are met with exactly N+1=4 tests.',
    pitfallTag: 'MCDC independence pair structure',
  },

  // ─── Case 5: Data Flow ───────────────────────────────────────────────────
  {
    id: 'mt-dataflow-killed-def-01',
    technique: 'DATA_FLOW',
    difficulty: 'medium',
    title: 'The People vs. The Orphan Definition',
    codeSnippet:
      'function fee(amount: number) {\n  let total = amount * 0.05;  // def 1\n  total = amount * 0.08;       // def 2\n  return total;\n}',
    testSet: [
      { label: 'T1', inputs: { amount: '100' }, expected: 'returns 8' },
      { label: 'T2', inputs: { amount: '200' }, expected: 'returns 16' },
    ],
    claim: {
      coverage: 'DATA_FLOW',
      text: 'These 2 tests achieve full All-Definitions (all-defs) coverage for variable `total`.',
    },
    lawCardRef: 'law-dataflow',
    prosecutorArguments: [
      { id: 'p1', text: 'Definition 1 (`total = amount * 0.05`) is immediately killed by definition 2 — no def-use path from def 1 to a use is ever reachable, so def 1 cannot be covered by any test.', isStrong: true },
      { id: 'p2', text: 'All-defs coverage requires at least one du-path per definition to reach a use. Def 1 has zero reachable uses.', isStrong: true },
      { id: 'p3', text: 'The tests do not vary the input enough to expose data flow issues.', isStrong: false },
    ],
    defenseArguments: [
      { id: 'd1', text: 'Both tests reach the return statement, exercising the live value of total.', isStrong: false },
      { id: 'd2', text: 'All-defs coverage is satisfied because def 2 reaches the use in `return total`.', isStrong: false },
      { id: 'd3', text: 'Killed definitions are still considered "covered" if the variable is later used.', isStrong: false },
    ],
    correctVerdict: 'not_satisfied',
    answerExplanation:
      'All-Definitions coverage requires that **every definition reaches at least one use via a definition-clear path**. Definition 1 (`total = amount * 0.05`) is killed by definition 2 on the very next line, before any use of `total`. There is no path from def 1 to a use without an intervening redefinition — so def 1 is **unreachable** for coverage purposes. This is a classic dead-store / killed-definition pattern. The claim is false because def 1 cannot be covered by any test (it is a code-smell that should be removed).',
    pitfallTag: 'Killed definition coverage',
  },
]
```

- [ ] **Step 2: Compile-check**

Run: `cd app/server && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/server/src/mockTrial/cases.ts
git commit -m "feat(mock-trial): initial 5 court cases across the coverage hierarchy"
```

---

## Task 3: courtManager — TDD

**Files:**
- Create: `app/server/src/mockTrial/courtManager.ts`
- Create: `app/server/src/mockTrial/courtManager.test.ts`

The court manager owns in-memory mock-trial room state: create room, add court, claim/release slot, validate readiness to start, handle disconnects, and resolve socket→room lookups (mirrors `roomManager.ts` for Speed Trial but with the Court structure).

- [ ] **Step 1: Write the failing tests**

Create `app/server/src/mockTrial/courtManager.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test — verify it fails**

Run: `cd app/server && pnpm test`
Expected: all tests fail with "module not found" / `CM is undefined`.

- [ ] **Step 3: Implement courtManager**

Create `app/server/src/mockTrial/courtManager.ts`:
```ts
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
  // Keep socketToCourt — reconnection by playerId could rebind (out of scope for MVP)
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
```

- [ ] **Step 4: Run tests — verify all pass**

Run: `cd app/server && pnpm test`
Expected: all courtManager tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/server/src/mockTrial/courtManager.ts app/server/src/mockTrial/courtManager.test.ts
git commit -m "feat(mock-trial): courtManager with slot/court lifecycle (TDD)"
```

---

## Task 4: mockTrialScoring — TDD

**Files:**
- Create: `app/server/src/mockTrial/mockTrialScoring.ts`
- Create: `app/server/src/mockTrial/mockTrialScoring.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/server/src/mockTrial/mockTrialScoring.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { computeCaseScore, buildLeaderboard } from './mockTrialScoring.js'
import type { Court, MockTrialCase, CourtSubmission } from './types.js'
import { EMPTY_SUBMISSION } from './types.js'

const FIXTURE_CASE: MockTrialCase = {
  id: 'fx-1',
  technique: 'BCC',
  difficulty: 'medium',
  title: 'Fixture',
  codeSnippet: '',
  testSet: [],
  claim: { coverage: 'BCC', text: '' },
  lawCardRef: 'law-bcc',
  prosecutorArguments: [
    { id: 'p1', text: '', isStrong: true },
    { id: 'p2', text: '', isStrong: false },
  ],
  defenseArguments: [
    { id: 'd1', text: '', isStrong: true },
    { id: 'd2', text: '', isStrong: false },
  ],
  correctVerdict: 'satisfied',
  answerExplanation: '',
}

function submission(overrides: Partial<CourtSubmission> = {}): CourtSubmission {
  return { ...EMPTY_SUBMISSION, ...overrides }
}

describe('computeCaseScore', () => {
  it('awards +2 for correct verdict', () => {
    const sub = submission({ verdict: 'satisfied' })
    const r = computeCaseScore(FIXTURE_CASE, sub)
    expect(r.verdictScore).toBe(2)
  })

  it('awards 0 for wrong verdict', () => {
    const sub = submission({ verdict: 'not_satisfied' })
    const r = computeCaseScore(FIXTURE_CASE, sub)
    expect(r.verdictScore).toBe(0)
  })

  it('awards +1 prosecutor bonus for strong argument', () => {
    const sub = submission({ prosecutorArgId: 'p1' })
    const r = computeCaseScore(FIXTURE_CASE, sub)
    expect(r.prosecutorBonus).toBe(1)
  })

  it('awards 0 prosecutor bonus for weak argument', () => {
    const sub = submission({ prosecutorArgId: 'p2' })
    const r = computeCaseScore(FIXTURE_CASE, sub)
    expect(r.prosecutorBonus).toBe(0)
  })

  it('awards 0 prosecutor bonus when no argument picked', () => {
    const r = computeCaseScore(FIXTURE_CASE, submission())
    expect(r.prosecutorBonus).toBe(0)
  })

  it('awards defense bonus the same way', () => {
    expect(computeCaseScore(FIXTURE_CASE, submission({ defenseArgId: 'd1' })).defenseBonus).toBe(1)
    expect(computeCaseScore(FIXTURE_CASE, submission({ defenseArgId: 'd2' })).defenseBonus).toBe(0)
  })

  it('passes through Jury self-score as juryBonus', () => {
    expect(computeCaseScore(FIXTURE_CASE, submission({ selfScore: 1 })).juryBonus).toBe(1)
    expect(computeCaseScore(FIXTURE_CASE, submission({ selfScore: 0.5 })).juryBonus).toBe(0.5)
    expect(computeCaseScore(FIXTURE_CASE, submission({ selfScore: 0 })).juryBonus).toBe(0)
    expect(computeCaseScore(FIXTURE_CASE, submission({ selfScore: null })).juryBonus).toBe(0)
  })

  it('sums to caseTotal (max 5)', () => {
    const sub = submission({
      verdict: 'satisfied',
      prosecutorArgId: 'p1',
      defenseArgId: 'd1',
      selfScore: 1,
    })
    const r = computeCaseScore(FIXTURE_CASE, sub)
    expect(r.caseTotal).toBe(5)
  })
})

describe('buildLeaderboard', () => {
  function court(id: string, name: string, totalScore: number, lastDelta: number): Court {
    return {
      id,
      name,
      slots: { prosecutor: null, defense: null, jury1: null, jury2: null, scribe: null },
      currentSubmission: { ...EMPTY_SUBMISSION },
      caseHistory: [
        // last entry's caseTotal == lastDelta for simplicity
        ...(lastDelta !== 0 ? [{
          caseId: 'x', submission: { ...EMPTY_SUBMISSION },
          verdictScore: 0 as const, prosecutorBonus: 0 as const, defenseBonus: 0 as const,
          juryBonus: 0 as const, hostOverride: 0, caseTotal: lastDelta,
        }] : []),
      ],
      totalScore,
    }
  }

  it('sorts by totalScore desc, breaks ties by name', () => {
    const courts = new Map<string, Court>()
    courts.set('court-1', court('court-1', 'Court 1', 5, 2))
    courts.set('court-2', court('court-2', 'Court 2', 8, 3))
    courts.set('court-3', court('court-3', 'Court 3', 5, 1))

    const lb = buildLeaderboard(courts)
    expect(lb.map((e) => e.id)).toEqual(['court-2', 'court-1', 'court-3'])
    expect(lb.map((e) => e.rank)).toEqual([1, 2, 3])
  })

  it('reports lastCaseDelta from latest history entry, 0 if none', () => {
    const courts = new Map<string, Court>()
    courts.set('court-1', court('court-1', 'Court 1', 3, 3))
    const lb = buildLeaderboard(courts)
    expect(lb[0].lastCaseDelta).toBe(3)

    courts.clear()
    courts.set('court-1', court('court-1', 'Court 1', 0, 0))
    expect(buildLeaderboard(courts)[0].lastCaseDelta).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd app/server && pnpm test`
Expected: all scoring tests fail (module not found).

- [ ] **Step 3: Implement scoring**

Create `app/server/src/mockTrial/mockTrialScoring.ts`:
```ts
import type { CaseResult, Court, CourtSubmission, MockTrialCase, SelfScore } from './types.js'

export function computeCaseScore(
  caseData: MockTrialCase,
  sub: CourtSubmission,
): CaseResult {
  const verdictScore: 0 | 2 = sub.verdict === caseData.correctVerdict ? 2 : 0

  const prosArg = caseData.prosecutorArguments.find((a) => a.id === sub.prosecutorArgId)
  const prosecutorBonus: 0 | 1 = prosArg?.isStrong ? 1 : 0

  const defArg = caseData.defenseArguments.find((a) => a.id === sub.defenseArgId)
  const defenseBonus: 0 | 1 = defArg?.isStrong ? 1 : 0

  const juryBonus: SelfScore | 0 = sub.selfScore ?? 0

  const caseTotal = verdictScore + prosecutorBonus + defenseBonus + juryBonus

  return {
    caseId: caseData.id,
    submission: sub,
    verdictScore,
    prosecutorBonus,
    defenseBonus,
    juryBonus,
    hostOverride: 0,
    caseTotal,
  }
}

export function applyHostOverride(result: CaseResult, delta: number): CaseResult {
  return { ...result, hostOverride: result.hostOverride + delta, caseTotal: result.caseTotal + delta }
}

export interface LeaderboardEntry {
  id: string
  name: string
  totalScore: number
  lastCaseDelta: number
  rank: number
}

export function buildLeaderboard(courts: Map<string, Court>): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = Array.from(courts.values()).map((c) => {
    const lastEntry = c.caseHistory[c.caseHistory.length - 1]
    return {
      id: c.id,
      name: c.name,
      totalScore: c.totalScore,
      lastCaseDelta: lastEntry?.caseTotal ?? 0,
      rank: 0,
    }
  })
  entries.sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name))
  entries.forEach((e, i) => { e.rank = i + 1 })
  return entries
}
```

- [ ] **Step 4: Run tests — verify all pass**

Run: `cd app/server && pnpm test`
Expected: scoring + courtManager tests all pass.

- [ ] **Step 5: Commit**

```bash
git add app/server/src/mockTrial/mockTrialScoring.ts app/server/src/mockTrial/mockTrialScoring.test.ts
git commit -m "feat(mock-trial): per-case scoring and leaderboard builder (TDD)"
```

---

## Task 5: mockTrialServer — socket event registration

**Files:**
- Create: `app/server/src/mockTrial/mockTrialServer.ts`

This is the biggest server file. It wires socket events to the courtManager + scoring, and runs the phase timer state machine. There are no unit tests here — Task 7 covers it with an integration test.

- [ ] **Step 1: Create the file**

Create `app/server/src/mockTrial/mockTrialServer.ts`:
```ts
import type { Server, Namespace } from 'socket.io'
import * as CM from './courtManager.js'
import { computeCaseScore, applyHostOverride, buildLeaderboard } from './mockTrialScoring.js'
import { MOCK_TRIAL_CASES } from './cases.js'
import {
  MT_EV, BRIEFING_SEC, REVEAL_SEC, PHASE_GRACE_MS, EMPTY_SUBMISSION,
} from './types.js'
import type {
  MockTrialRoom, MockTrialCase, CasePublic, RoomStatePayload, CourtPublic,
  C2S_MTCreateRoom, C2S_MTJoinRoom, C2S_MTClaimSlot,
  C2S_MTSubmitArgument, C2S_MTSubmitVote, C2S_MTSubmitVerdict,
  C2S_MTSubmitSelfScore, C2S_MTHostOverride,
} from './types.js'

const activeRooms = new Map<string, MockTrialRoom>()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toCasePublic(c: MockTrialCase, defaultArgSec: number, defaultDelibSec: number): CasePublic {
  return {
    id: c.id,
    technique: c.technique,
    difficulty: c.difficulty,
    title: c.title,
    codeSnippet: c.codeSnippet,
    testSet: c.testSet,
    claim: c.claim,
    lawCardRef: c.lawCardRef,
    prosecutorArguments: c.prosecutorArguments.map(({ id, text }) => ({ id, text })),
    defenseArguments: c.defenseArguments.map(({ id, text }) => ({ id, text })),
    argumentSeconds: c.argumentSeconds ?? defaultArgSec,
    deliberationSeconds: c.deliberationSeconds ?? defaultDelibSec,
  }
}

function toCourtPublic(room: MockTrialRoom): CourtPublic[] {
  return Array.from(room.courts.values()).map((c) => {
    const last = c.caseHistory[c.caseHistory.length - 1]
    return {
      id: c.id,
      name: c.name,
      slots: c.slots,
      totalScore: c.totalScore,
      lastCaseDelta: last?.caseTotal ?? 0,
    }
  })
}

function toRoomState(room: MockTrialRoom): RoomStatePayload {
  return {
    code: room.code,
    status: room.status,
    config: room.config,
    courts: toCourtPublic(room),
    spectators: Array.from(room.spectators.values()),
    hostNickname: room.hostNickname,
    caseCount: room.config.caseCount,
    currentCaseIdx: room.currentCaseIdx,
    currentPhase: room.currentPhase,
    phaseEndsAt: room.phaseEndsAt,
  }
}

function broadcastRoomState(nsp: Namespace, room: MockTrialRoom): void {
  nsp.to(room.code).emit(MT_EV.ROOM_STATE, toRoomState(room))
}

function clearPhaseTimer(room: MockTrialRoom): void {
  if (room.phaseTimer) { clearTimeout(room.phaseTimer); room.phaseTimer = null }
}

// ─── Phase transitions (state machine) ───────────────────────────────────────

function startBriefing(nsp: Namespace, room: MockTrialRoom): void {
  clearPhaseTimer(room)
  const c = room.cases[room.currentCaseIdx]
  if (!c) return

  // Reset per-case submissions for active courts only
  for (const court of room.courts.values()) {
    if (court.slots.prosecutor && court.slots.defense && court.slots.scribe) {
      court.currentSubmission = { ...EMPTY_SUBMISSION }
    }
  }

  room.currentPhase = 'briefing'
  const endsAt = Date.now() + BRIEFING_SEC * 1000
  room.phaseEndsAt = endsAt
  nsp.to(room.code).emit(MT_EV.CASE_START, {
    case: toCasePublic(c, room.config.defaultArgumentSec, room.config.defaultDeliberationSec),
    caseIdx: room.currentCaseIdx,
    phase: 'briefing',
    endsAt,
  })
  room.phaseTimer = setTimeout(() => startArguing(nsp, room), BRIEFING_SEC * 1000)
}

function startArguing(nsp: Namespace, room: MockTrialRoom): void {
  clearPhaseTimer(room)
  const c = room.cases[room.currentCaseIdx]
  if (!c) return
  room.currentPhase = 'arguing'
  const sec = c.argumentSeconds ?? room.config.defaultArgumentSec
  const endsAt = Date.now() + sec * 1000
  room.phaseEndsAt = endsAt
  nsp.to(room.code).emit(MT_EV.PHASE_CHANGE, { phase: 'arguing', endsAt })
  room.phaseTimer = setTimeout(() => startDeliberating(nsp, room), sec * 1000 + PHASE_GRACE_MS)
}

function startDeliberating(nsp: Namespace, room: MockTrialRoom): void {
  clearPhaseTimer(room)
  const c = room.cases[room.currentCaseIdx]
  if (!c) return
  room.currentPhase = 'deliberating'
  const sec = c.deliberationSeconds ?? room.config.defaultDeliberationSec
  const endsAt = Date.now() + sec * 1000
  room.phaseEndsAt = endsAt
  nsp.to(room.code).emit(MT_EV.PHASE_CHANGE, { phase: 'deliberating', endsAt })
  room.phaseTimer = setTimeout(() => startReveal(nsp, room), sec * 1000 + PHASE_GRACE_MS)
}

function startReveal(nsp: Namespace, room: MockTrialRoom): void {
  clearPhaseTimer(room)
  const c = room.cases[room.currentCaseIdx]
  if (!c) return

  // Compute case results for every court with a valid baseline lineup
  const courtResults = []
  for (const court of room.courts.values()) {
    if (!court.slots.prosecutor || !court.slots.defense || !court.slots.scribe) continue
    const result = computeCaseScore(c, court.currentSubmission)
    court.caseHistory.push(result)
    court.totalScore += result.caseTotal
    courtResults.push({
      courtId: court.id,
      courtName: court.name,
      submission: result.submission,
      verdictScore: result.verdictScore,
      prosecutorBonus: result.prosecutorBonus,
      defenseBonus: result.defenseBonus,
      juryBonus: result.juryBonus,
      caseTotal: result.caseTotal,
    })
  }

  room.currentPhase = 'reveal'
  room.status = 'reveal'
  const endsAt = Date.now() + REVEAL_SEC * 1000
  room.phaseEndsAt = endsAt

  nsp.to(room.code).emit(MT_EV.CASE_REVEAL, {
    correctVerdict: c.correctVerdict,
    answerExplanation: c.answerExplanation,
    pitfallTag: c.pitfallTag,
    courtResults,
  })

  // Reveal does not auto-advance — host clicks "Next Case"
}

function tryEarlyAdvance(nsp: Namespace, room: MockTrialRoom): void {
  if (room.currentPhase === 'arguing') {
    const allSubmitted = Array.from(room.courts.values())
      .filter((c) => c.slots.prosecutor && c.slots.defense && c.slots.scribe)
      .every((c) =>
        c.currentSubmission.prosecutorArgId !== null &&
        c.currentSubmission.defenseArgId !== null,
      )
    if (allSubmitted) startDeliberating(nsp, room)
  } else if (room.currentPhase === 'deliberating') {
    const allDone = Array.from(room.courts.values())
      .filter((c) => c.slots.prosecutor && c.slots.defense && c.slots.scribe)
      .every((c) => c.currentSubmission.verdict !== null)
    if (allDone) startReveal(nsp, room)
  }
}

// ─── Public registration ─────────────────────────────────────────────────────

export function registerMockTrial(io: Server): void {
  const nsp = io.of('/mock-trial')

  nsp.on('connection', (socket) => {
    console.log(`[mt+] ${socket.id} connected`)

    socket.on(MT_EV.CREATE_ROOM, ({ nickname, avatar, config }: C2S_MTCreateRoom) => {
      if (!nickname?.trim()) { socket.emit(MT_EV.ERROR, { message: 'Nickname required' }); return }
      const { room, playerId } = CM.createRoom(socket.id, nickname.trim(), avatar || 'new_judge', config)
      activeRooms.set(room.code, room)
      socket.join(room.code)
      socket.emit(MT_EV.ROOM_CREATED, { code: room.code, playerId })
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.JOIN_ROOM, ({ code, nickname, avatar }: C2S_MTJoinRoom) => {
      if (!nickname?.trim() || !code?.trim()) { socket.emit(MT_EV.ERROR, { message: 'Nickname and code required' }); return }
      const result = CM.joinRoom(socket.id, code, nickname.trim(), avatar || 'new_defense')
      if ('error' in result) { socket.emit(MT_EV.ERROR, { message: result.error }); return }
      activeRooms.set(result.room.code, result.room)
      socket.join(result.room.code)
      socket.emit(MT_EV.ROOM_JOINED, { code: result.room.code, playerId: result.playerId, isSpectator: result.isSpectator })
      broadcastRoomState(nsp, result.room)
    })

    socket.on(MT_EV.CLAIM_SLOT, ({ courtId, role }: C2S_MTClaimSlot) => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room) return
      const r = CM.claimSlot(socket.id, courtId, role)
      if (!r.ok) { socket.emit(MT_EV.ERROR, { message: r.error ?? 'Cannot claim slot' }); return }
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.RELEASE_SLOT, () => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room) return
      CM.releaseSlot(socket.id)
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.ADD_COURT, () => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room || !CM.isHost(socket.id)) return
      const r = CM.addCourt(room)
      if (!r.ok) { socket.emit(MT_EV.ERROR, { message: 'Max courts reached' }); return }
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.START_GAME, () => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room || !CM.isHost(socket.id)) return
      if (room.status !== 'lobby') { socket.emit(MT_EV.ERROR, { message: 'Already started' }); return }
      const v = CM.validateStart(room)
      if (!v.ok) { socket.emit(MT_EV.ERROR, { message: v.error ?? 'Not ready' }); return }

      // Pick cases (first N from the pool; could be shuffled in future)
      room.cases = MOCK_TRIAL_CASES.slice(0, room.config.caseCount)
      room.currentCaseIdx = 0
      room.status = 'in_case'
      startBriefing(nsp, room)
    })

    socket.on(MT_EV.SUBMIT_ARGUMENT, ({ argId, sentence }: C2S_MTSubmitArgument) => {
      const room = CM.getRoomForSocket(socket.id)
      const slot = CM.getCourtRoleForSocket(socket.id)
      if (!room || !slot || room.currentPhase !== 'arguing') return
      if (slot.role !== 'prosecutor' && slot.role !== 'defense') return
      const court = room.courts.get(slot.courtId)
      if (!court) return

      const sub = court.currentSubmission
      const truncated = (sentence ?? '').slice(0, 140)
      if (slot.role === 'prosecutor') {
        sub.prosecutorArgId = argId
        sub.prosecutorSentence = truncated
      } else {
        sub.defenseArgId = argId
        sub.defenseSentence = truncated
      }
      nsp.to(room.code).emit(MT_EV.ARGUMENT_RECEIVED, {
        courtId: court.id,
        role: slot.role,
        argId,
        sentence: truncated,
      })
      tryEarlyAdvance(nsp, room)
    })

    socket.on(MT_EV.SUBMIT_VOTE, ({ side }: C2S_MTSubmitVote) => {
      const room = CM.getRoomForSocket(socket.id)
      const slot = CM.getCourtRoleForSocket(socket.id)
      if (!room || !slot || room.currentPhase !== 'deliberating') return
      if (slot.role !== 'jury1' && slot.role !== 'jury2') return
      const court = room.courts.get(slot.courtId)
      if (!court) return
      if (court.currentSubmission.juryVote) return  // first-to-vote wins
      court.currentSubmission.juryVote = side
      nsp.to(room.code).emit(MT_EV.VOTE_RECEIVED, { courtId: court.id, side })
    })

    socket.on(MT_EV.SUBMIT_VERDICT, ({ verdict, justification }: C2S_MTSubmitVerdict) => {
      const room = CM.getRoomForSocket(socket.id)
      const slot = CM.getCourtRoleForSocket(socket.id)
      if (!room || !slot || room.currentPhase !== 'deliberating') return
      if (slot.role !== 'scribe') return
      const court = room.courts.get(slot.courtId)
      if (!court) return
      court.currentSubmission.verdict = verdict
      court.currentSubmission.justification = (justification ?? '').slice(0, 200)
      tryEarlyAdvance(nsp, room)
    })

    socket.on(MT_EV.SUBMIT_SELFSCORE, ({ score }: C2S_MTSubmitSelfScore) => {
      const room = CM.getRoomForSocket(socket.id)
      const slot = CM.getCourtRoleForSocket(socket.id)
      if (!room || !slot || room.currentPhase !== 'reveal') return
      // Jury OR Scribe (fallback when no jury)
      if (!['jury1', 'jury2', 'scribe'].includes(slot.role)) return
      const court = room.courts.get(slot.courtId)
      if (!court) return
      // Only allow first self-score submission
      const last = court.caseHistory[court.caseHistory.length - 1]
      if (!last || last.juryBonus !== 0) return
      // Recompute with the new selfScore
      court.currentSubmission.selfScore = score
      const c = room.cases[room.currentCaseIdx]
      if (!c) return
      // Subtract prior result, add new
      court.totalScore -= last.caseTotal
      const fresh = computeCaseScore(c, court.currentSubmission)
      court.caseHistory[court.caseHistory.length - 1] = fresh
      court.totalScore += fresh.caseTotal
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.HOST_OVERRIDE, ({ courtId, delta }: C2S_MTHostOverride) => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room || !CM.isHost(socket.id) || room.currentPhase !== 'reveal') return
      const court = room.courts.get(courtId)
      if (!court) return
      const last = court.caseHistory[court.caseHistory.length - 1]
      if (!last) return
      court.totalScore -= last.caseTotal
      const updated = applyHostOverride(last, delta)
      court.caseHistory[court.caseHistory.length - 1] = updated
      court.totalScore += updated.caseTotal
      broadcastRoomState(nsp, room)
    })

    socket.on(MT_EV.NEXT_CASE, () => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room || !CM.isHost(socket.id)) return
      if (room.status !== 'reveal') return

      // Send leaderboard before next case starts
      const lb = buildLeaderboard(room.courts)
      const isLastCase = room.currentCaseIdx >= room.cases.length - 1
      nsp.to(room.code).emit(MT_EV.LEADERBOARD, {
        courts: lb,
        caseIdx: room.currentCaseIdx,
        isLastCase,
      })

      if (isLastCase) {
        room.status = 'finished'
        room.currentPhase = null
        nsp.to(room.code).emit(MT_EV.GAME_FINISHED, { finalLeaderboard: lb })
        return
      }
      room.currentCaseIdx += 1
      room.status = 'in_case'
      startBriefing(nsp, room)
    })

    socket.on(MT_EV.FINISH_GAME, () => {
      const room = CM.getRoomForSocket(socket.id)
      if (!room || !CM.isHost(socket.id)) return
      clearPhaseTimer(room)
      room.status = 'finished'
      room.currentPhase = null
      const lb = buildLeaderboard(room.courts)
      nsp.to(room.code).emit(MT_EV.GAME_FINISHED, { finalLeaderboard: lb })
    })

    socket.on('disconnect', () => {
      console.log(`[mt-] ${socket.id} disconnected`)
      const result = CM.disconnectSocket(socket.id)
      if (result) broadcastRoomState(nsp, result.room)
    })
  })

  // Periodic room cleanup (rooms finished for 5+ minutes get deleted)
  setInterval(() => {
    const now = Date.now()
    for (const [code, room] of activeRooms.entries()) {
      if (room.status === 'finished' && room.phaseEndsAt && now - room.phaseEndsAt > 5 * 60 * 1000) {
        CM.deleteRoom(code)
        activeRooms.delete(code)
      }
    }
  }, 60 * 1000).unref()
}
```

- [ ] **Step 2: Compile-check**

Run: `cd app/server && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/server/src/mockTrial/mockTrialServer.ts
git commit -m "feat(mock-trial): socket event handlers and phase state machine"
```

---

## Task 6: Wire Mock Trial into main socketServer.ts

**Files:**
- Modify: `app/server/src/socketServer.ts`

- [ ] **Step 1: Add the import and registration**

In `app/server/src/socketServer.ts`, add an import near the top (after the existing imports, around line 7):
```ts
import { registerMockTrial } from './mockTrial/mockTrialServer.js'
```

Then after the `io` is constructed (after line 30) and before `// ─── Helpers`, add:
```ts
// ─── Mock Trial mode (separate namespace) ─────────────────────────────────────
registerMockTrial(io)
```

- [ ] **Step 2: Smoke-test the server starts**

Run from `app/server/`:
```bash
pnpm dev
```
Expected: `[Speed Trial Server] listening on http://localhost:3001` (no errors). Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add app/server/src/socketServer.ts
git commit -m "feat(mock-trial): register /mock-trial namespace on main server"
```

---

## Task 7: Server-side integration smoke test

**Files:**
- Create: `app/server/src/mockTrial/mockTrialServer.integration.test.ts`

A single end-to-end test that spins up the namespace with 4 mock clients and runs one case from lobby → reveal, asserting state transitions.

- [ ] **Step 1: Add socket.io-client as dev dep if not already**

Already present per `app/server/package.json`. Skip if installed.

- [ ] **Step 2: Write the integration test**

Create `app/server/src/mockTrial/mockTrialServer.integration.test.ts`:
```ts
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

    // Wait for briefing → arguing transition (briefing is 30s default; we set arg/delib small via config but briefing is fixed)
    // To avoid 30s waits, end-to-end test triggers early advance once arguments are in.
    // First wait until 'arguing' phase begins (server-driven after 30s briefing).
    // For speed: monkey-patch BRIEFING_SEC is not exposed; instead test relies on the
    // smaller arguing/deliberating early-advance path. We patch by waiting for phase_change.
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
```

- [ ] **Step 3: Run integration test**

Run: `cd app/server && pnpm test`
Expected: integration test passes (may take ~30s due to briefing wait).

- [ ] **Step 4: Commit**

```bash
git add app/server/src/mockTrial/mockTrialServer.integration.test.ts
git commit -m "test(mock-trial): server end-to-end integration smoke (1 court, 1 case)"
```

---

## Task 8: Client-side types + socket factory

**Files:**
- Create: `app/src/mock-trial/types.ts`
- Create: `app/src/mock-trial/socket.ts`

- [ ] **Step 1: Create client types (mirror of server's public types)**

Create `app/src/mock-trial/types.ts`:
```ts
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
```

- [ ] **Step 2: Create the namespaced socket factory**

Create `app/src/mock-trial/socket.ts`:
```ts
import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? 'http://localhost:3001'

let _socket: Socket | null = null

export function getMockTrialSocket(): Socket {
  if (!_socket) {
    _socket = io(`${SOCKET_URL}/mock-trial`, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    })
  }
  return _socket
}

export function destroyMockTrialSocket(): void {
  if (_socket) {
    _socket.disconnect()
    _socket = null
  }
}
```

- [ ] **Step 3: Compile-check**

Run from `app/`: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/mock-trial/
git commit -m "feat(mock-trial): client types and namespaced socket factory"
```

---

## Task 9: Client Zustand store

**Files:**
- Create: `app/src/stores/mockTrialStore.ts`

- [ ] **Step 1: Create the store**

Create `app/src/stores/mockTrialStore.ts`:
```ts
import { create } from 'zustand'
import { getMockTrialSocket, destroyMockTrialSocket } from '../mock-trial/socket'
import { MT_EV } from '../mock-trial/types'
import type {
  AvatarId, RoomState, CourtPublic, CasePublic, MockTrialConfig, MockTrialRole,
  MockTrialPhase, Verdict, Side, SelfScore, CourtResult, LeaderboardCourt,
} from '../mock-trial/types'

export type MockTrialRoleScope = 'host' | 'player' | null

export interface MockTrialState {
  // Connection
  connected: boolean
  error: string | null

  // Identity
  roleScope: MockTrialRoleScope
  playerId: string | null
  nickname: string | null
  myAvatar: AvatarId | null

  // Room
  roomState: RoomState | null

  // Active case
  currentCase: CasePublic | null
  myCourtId: string | null
  myRole: MockTrialRole | null

  // Live argument feed (per court)
  liveArguments: Record<string, { prosecutor?: { argId: string; sentence: string }; defense?: { argId: string; sentence: string } }>

  // Reveal phase data
  revealData: {
    correctVerdict: Verdict
    answerExplanation: string
    pitfallTag?: string
    courtResults: CourtResult[]
  } | null

  // Final
  finalLeaderboard: LeaderboardCourt[]

  // Actions
  connect: () => void
  disconnect: () => void
  createRoom: (nickname: string, avatar: AvatarId, config: MockTrialConfig) => void
  joinRoom: (code: string, nickname: string, avatar: AvatarId) => void
  claimSlot: (courtId: string, role: MockTrialRole) => void
  releaseSlot: () => void
  addCourt: () => void
  startGame: () => void
  submitArgument: (argId: string, sentence: string) => void
  submitVote: (side: Side) => void
  submitVerdict: (verdict: Verdict, justification: string) => void
  submitSelfScore: (score: SelfScore) => void
  hostOverride: (courtId: string, delta: number) => void
  nextCase: () => void
  finishGame: () => void
  clearError: () => void
  reset: () => void
}

const INITIAL = {
  connected: false,
  error: null,
  roleScope: null as MockTrialRoleScope,
  playerId: null as string | null,
  nickname: null as string | null,
  myAvatar: null as AvatarId | null,
  roomState: null as RoomState | null,
  currentCase: null as CasePublic | null,
  myCourtId: null as string | null,
  myRole: null as MockTrialRole | null,
  liveArguments: {} as MockTrialState['liveArguments'],
  revealData: null as MockTrialState['revealData'],
  finalLeaderboard: [] as LeaderboardCourt[],
}

function deriveMyCourtRole(state: RoomState | null, playerId: string | null): { myCourtId: string | null; myRole: MockTrialRole | null } {
  if (!state || !playerId) return { myCourtId: null, myRole: null }
  for (const court of state.courts) {
    for (const role of Object.keys(court.slots) as MockTrialRole[]) {
      if (court.slots[role]?.id === playerId) return { myCourtId: court.id, myRole: role }
    }
  }
  return { myCourtId: null, myRole: null }
}

export const useMockTrialStore = create<MockTrialState>()((set, get) => {
  function wire(): void {
    const s = getMockTrialSocket()
    s.on('connect', () => set({ connected: true, error: null }))
    s.on('disconnect', () => set({ connected: false }))
    s.on('connect_error', (e) => set({ error: `Connection failed: ${e.message}` }))

    s.on(MT_EV.ROOM_CREATED, ({ code: _code, playerId }: { code: string; playerId: string }) => {
      set({ playerId })
    })
    s.on(MT_EV.ROOM_JOINED, ({ playerId }: { playerId: string; isSpectator: boolean }) => {
      set({ playerId })
    })
    s.on(MT_EV.ROOM_STATE, (state: RoomState) => {
      const { playerId } = get()
      const derived = deriveMyCourtRole(state, playerId)
      set({ roomState: state, ...derived })
    })
    s.on(MT_EV.CASE_START, ({ case: c }: { case: CasePublic; caseIdx: number; phase: MockTrialPhase; endsAt: number }) => {
      set({ currentCase: c, liveArguments: {}, revealData: null })
    })
    s.on(MT_EV.ARGUMENT_RECEIVED, ({ courtId, role, argId, sentence }: { courtId: string; role: 'prosecutor' | 'defense'; argId: string; sentence: string }) => {
      set((st) => ({
        liveArguments: {
          ...st.liveArguments,
          [courtId]: { ...(st.liveArguments[courtId] ?? {}), [role]: { argId, sentence } },
        },
      }))
    })
    s.on(MT_EV.CASE_REVEAL, (payload: MockTrialState['revealData']) => {
      set({ revealData: payload })
    })
    s.on(MT_EV.LEADERBOARD, ({ courts }: { courts: LeaderboardCourt[] }) => {
      set({ finalLeaderboard: courts })
    })
    s.on(MT_EV.GAME_FINISHED, ({ finalLeaderboard }: { finalLeaderboard: LeaderboardCourt[] }) => {
      set({ finalLeaderboard })
    })
    s.on(MT_EV.ERROR, ({ message }: { message: string }) => set({ error: message }))
  }

  return {
    ...INITIAL,
    connect() {
      const s = getMockTrialSocket()
      if (!s.connected) { wire(); s.connect() }
    },
    disconnect() {
      destroyMockTrialSocket()
      set({ ...INITIAL })
    },
    createRoom(nickname, avatar, config) {
      set({ roleScope: 'host', nickname, myAvatar: avatar, error: null })
      getMockTrialSocket().emit(MT_EV.CREATE_ROOM, { nickname, avatar, config })
    },
    joinRoom(code, nickname, avatar) {
      set({ roleScope: 'player', nickname, myAvatar: avatar, error: null })
      getMockTrialSocket().emit(MT_EV.JOIN_ROOM, { code, nickname, avatar })
    },
    claimSlot(courtId, role)      { getMockTrialSocket().emit(MT_EV.CLAIM_SLOT, { courtId, role }) },
    releaseSlot()                  { getMockTrialSocket().emit(MT_EV.RELEASE_SLOT) },
    addCourt()                     { getMockTrialSocket().emit(MT_EV.ADD_COURT) },
    startGame()                    { getMockTrialSocket().emit(MT_EV.START_GAME) },
    submitArgument(argId, sentence){ getMockTrialSocket().emit(MT_EV.SUBMIT_ARGUMENT, { argId, sentence }) },
    submitVote(side)               { getMockTrialSocket().emit(MT_EV.SUBMIT_VOTE, { side }) },
    submitVerdict(verdict, justification) {
      getMockTrialSocket().emit(MT_EV.SUBMIT_VERDICT, { verdict, justification })
    },
    submitSelfScore(score)         { getMockTrialSocket().emit(MT_EV.SUBMIT_SELFSCORE, { score }) },
    hostOverride(courtId, delta)   { getMockTrialSocket().emit(MT_EV.HOST_OVERRIDE, { courtId, delta }) },
    nextCase()                     { getMockTrialSocket().emit(MT_EV.NEXT_CASE) },
    finishGame()                   { getMockTrialSocket().emit(MT_EV.FINISH_GAME) },
    clearError()                   { set({ error: null }) },
    reset() {
      destroyMockTrialSocket()
      set({ ...INITIAL })
    },
  }
})

export function getMyCourt(state: MockTrialState): CourtPublic | null {
  if (!state.roomState || !state.myCourtId) return null
  return state.roomState.courts.find((c) => c.id === state.myCourtId) ?? null
}
```

- [ ] **Step 2: Compile-check**

Run from `app/`: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/stores/mockTrialStore.ts
git commit -m "feat(mock-trial): zustand store mirroring server state"
```

---

## Task 10: gameStore screen enum + MainMenu entry

**Files:**
- Modify: `app/src/stores/gameStore.ts`
- Modify: `app/src/screens/MainMenuScreen.tsx`

- [ ] **Step 1: Extend the Screen union**

In `app/src/stores/gameStore.ts`, find the `Screen` type around line 53 and replace it with:
```ts
export type Screen =
  | 'menu'
  | 'how-to-play'
  | 'campaign'
  | 'play'
  | 'design-system'
  | 'achievements'
  | 'law-library'
  // Speed Trial multiplayer screens
  | 'speed-trial-lobby'
  | 'speed-trial-host'
  | 'speed-trial-player'
  | 'speed-trial-winner'
  // Mock Trial multiplayer screens
  | 'mock-trial-lobby'
  | 'mock-trial-court-select'
  | 'mock-trial-host'
  | 'mock-trial-case'
  | 'mock-trial-reveal'
  | 'mock-trial-final'
```

- [ ] **Step 2: Add Mock Trial button on MainMenuScreen**

Read `app/src/screens/MainMenuScreen.tsx` to see the existing button layout, then add a button next to the Speed Trial entry with label "Mock Trial" that calls `onNavigate('mock-trial-lobby')`. Mirror the styling of the existing Speed Trial button (same `PixelButton` variant, similar wording: e.g. label "Mock Trial" with subtitle "Role-based group play").

If the file structure uses an array of button defs, add an entry; if individual JSX, add a sibling.

- [ ] **Step 3: Compile-check**

Run from `app/`: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/stores/gameStore.ts app/src/screens/MainMenuScreen.tsx
git commit -m "feat(mock-trial): add screen routes and main menu entry"
```

---

## Task 11: MockTrialLobbyScreen (entry: create or join)

**Files:**
- Create: `app/src/screens/MockTrialLobbyScreen.tsx`

Mirrors `SpeedTrialLobbyScreen.tsx` but with config sliders (case count, argument sec, deliberation sec) on the create path.

- [ ] **Step 1: Create the screen**

Create `app/src/screens/MockTrialLobbyScreen.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore } from '../stores/mockTrialStore'
import type { AvatarId } from '../mock-trial/types'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const AVATARS: { id: AvatarId; label: string }[] = [
  { id: 'new_judge', label: 'Judge' },
  { id: 'new_prosecutor', label: 'Prosecutor' },
  { id: 'new_defense', label: 'Defense' },
  { id: 'bug-defendant', label: 'Bug' },
]

export default function MockTrialLobbyScreen({ onNavigate, onBack }: Props) {
  const { connect, createRoom, joinRoom, error, clearError, roleScope, playerId, reset } = useMockTrialStore()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState<AvatarId>('new_judge')
  const [code, setCode] = useState('')
  const [caseCount, setCaseCount] = useState<3 | 5 | 7>(5)
  const [argSec, setArgSec] = useState<60 | 90 | 120>(90)
  const [delibSec, setDelibSec] = useState<30 | 45 | 60>(45)

  useEffect(() => { connect() }, [connect])

  // Auto-navigate after server confirms our identity
  useEffect(() => {
    if (!playerId || !roleScope) return
    if (roleScope === 'host') onNavigate('mock-trial-host')
    else onNavigate('mock-trial-court-select')
  }, [playerId, roleScope, onNavigate])

  const handleBack = () => { reset(); onBack() }

  const handleCreate = () => {
    if (!nickname.trim()) return
    createRoom(nickname.trim(), avatar, { caseCount, defaultArgumentSec: argSec, defaultDeliberationSec: delibSec })
  }
  const handleJoin = () => {
    if (!nickname.trim() || !code.trim()) return
    joinRoom(code.trim().toUpperCase(), nickname.trim(), avatar)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, gap: 16, zIndex: 1, position: 'relative' }}>
      <h1 style={{ fontFamily: PIXEL_FONT, fontSize: 32, color: TC.ink, margin: 0 }}>Mock Trial</h1>
      <p style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 16, maxWidth: 480, textAlign: 'center' }}>
        Role-based group play: form courts of 4-5, assign Prosecutor / Defense / Jury / Scribe, and argue coverage cases together.
      </p>

      {error && (
        <div style={{ background: TC.magenta, color: TC.cream, padding: 8, borderRadius: 4, fontFamily: HAND_FONT }}>
          {error} <button onClick={clearError} style={{ marginLeft: 8 }}>×</button>
        </div>
      )}

      {mode === 'choose' && (
        <div style={{ display: 'flex', gap: 16 }}>
          <PixelButton onClick={() => setMode('create')}>Host a Room</PixelButton>
          <PixelButton onClick={() => setMode('join')}>Join a Room</PixelButton>
          <PixelButton onClick={handleBack} variant="ghost">Back</PixelButton>
        </div>
      )}

      {mode !== 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360, width: '100%' }}>
          <label style={{ fontFamily: HAND_FONT, color: TC.ink }}>
            Nickname
            <input value={nickname} onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              style={{ width: '100%', padding: 8, fontFamily: HAND_FONT, fontSize: 16, border: `2px solid ${TC.ink}` }} />
          </label>

          <div>
            <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginBottom: 4 }}>Avatar</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {AVATARS.map((a) => (
                <button key={a.id} onClick={() => setAvatar(a.id)}
                  style={{
                    padding: '4px 10px',
                    fontFamily: HAND_FONT,
                    background: avatar === a.id ? TC.blue : TC.cream,
                    color: avatar === a.id ? TC.cream : TC.ink,
                    border: `2px solid ${TC.ink}`, cursor: 'pointer',
                  }}>{a.label}</button>
              ))}
            </div>
          </div>

          {mode === 'create' && (
            <>
              <ConfigRow label="Case count" value={caseCount} options={[3, 5, 7]} onChange={(v) => setCaseCount(v as 3 | 5 | 7)} />
              <ConfigRow label="Argument time (sec)" value={argSec} options={[60, 90, 120]} onChange={(v) => setArgSec(v as 60 | 90 | 120)} />
              <ConfigRow label="Deliberation time (sec)" value={delibSec} options={[30, 45, 60]} onChange={(v) => setDelibSec(v as 30 | 45 | 60)} />
              <PixelButton onClick={handleCreate} disabled={!nickname.trim()}>Create Room</PixelButton>
            </>
          )}
          {mode === 'join' && (
            <>
              <label style={{ fontFamily: HAND_FONT, color: TC.ink }}>
                Room code
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6} placeholder="ABCDEF"
                  style={{ width: '100%', padding: 8, fontFamily: 'monospace', fontSize: 22, letterSpacing: 4, border: `2px solid ${TC.ink}` }} />
              </label>
              <PixelButton onClick={handleJoin} disabled={!nickname.trim() || !code.trim()}>Join Room</PixelButton>
            </>
          )}
          <PixelButton onClick={() => setMode('choose')} variant="ghost">Back</PixelButton>
        </div>
      )}
    </div>
  )
}

function ConfigRow({ label, value, options, onChange }: {
  label: string; value: number; options: number[]; onChange: (v: number) => void
}) {
  return (
    <div>
      <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)}
            style={{
              padding: '4px 12px',
              fontFamily: 'monospace',
              background: value === o ? TC.blue : TC.cream,
              color: value === o ? TC.cream : TC.ink,
              border: `2px solid ${TC.ink}`, cursor: 'pointer',
            }}>{o}</button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Compile-check**

Run from `app/`: `pnpm exec tsc --noEmit`
Expected: errors only because `App.tsx` doesn't render this screen yet — that's wired in Task 18. If new errors mention `PixelButton` props (`variant`, `disabled`), open `app/src/ui/PixelButton.tsx` and confirm the prop names match — adjust the JSX to whatever the component actually accepts.

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/MockTrialLobbyScreen.tsx
git commit -m "feat(mock-trial): lobby entry screen with host config"
```

---

## Task 12: MockTrialCourtSelectionScreen (slot picker)

**Files:**
- Create: `app/src/screens/MockTrialCourtSelectionScreen.tsx`

- [ ] **Step 1: Create the screen**

Create `app/src/screens/MockTrialCourtSelectionScreen.tsx`:
```tsx
import { useEffect } from 'react'
import { TC, PIXEL_FONT, HAND_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore } from '../stores/mockTrialStore'
import type { MockTrialRole } from '../mock-trial/types'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const ROLE_LABEL: Record<MockTrialRole, string> = {
  prosecutor: 'Prosecutor',
  defense: 'Defense',
  jury1: 'Jury 1',
  jury2: 'Jury 2',
  scribe: 'Scribe',
}

export default function MockTrialCourtSelectionScreen({ onNavigate, onBack }: Props) {
  const { roomState, claimSlot, releaseSlot, myCourtId, myRole, nickname, playerId, reset, error, clearError } = useMockTrialStore()

  // Once status flips to in_case, transition to the case screen
  useEffect(() => {
    if (roomState?.status === 'in_case') onNavigate('mock-trial-case')
    if (roomState?.status === 'reveal')  onNavigate('mock-trial-reveal')
    if (roomState?.status === 'finished') onNavigate('mock-trial-final')
  }, [roomState?.status, onNavigate])

  const handleBack = () => { reset(); onBack() }

  if (!roomState) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontFamily: HAND_FONT }}>Connecting…</p>
        <PixelButton onClick={handleBack}>Back</PixelButton>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', zIndex: 1, position: 'relative' }}>
      <h1 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 26, margin: 0 }}>Pick Your Court & Role</h1>
      <p style={{ fontFamily: HAND_FONT, color: TC.ink }}>
        Room <strong style={{ fontFamily: 'monospace', fontSize: 22 }}>{roomState.code}</strong> · You: <strong>{nickname}</strong>
      </p>

      {error && (
        <div style={{ background: TC.magenta, color: TC.cream, padding: 8 }}>
          {error} <button onClick={clearError}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 720 }}>
        {roomState.courts.map((court) => {
          const ready = court.slots.prosecutor && court.slots.defense && court.slots.scribe
          return (
            <div key={court.id}
              style={{ border: `2px solid ${TC.ink}`, padding: 12, background: TC.cream }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 18, color: TC.ink, margin: 0 }}>{court.name}</h2>
                <span style={{ fontFamily: HAND_FONT, color: ready ? TC.green : TC.magenta, fontSize: 14 }}>
                  {ready ? '● Ready' : '○ Needs Prosecutor + Defense + Scribe'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {(Object.keys(court.slots) as MockTrialRole[]).map((role) => {
                  const occupant = court.slots[role]
                  const isMe = occupant?.id === playerId
                  const taken = occupant !== null
                  return (
                    <button key={role}
                      onClick={() => isMe ? releaseSlot() : claimSlot(court.id, role)}
                      disabled={taken && !isMe}
                      style={{
                        padding: '8px 4px',
                        fontFamily: HAND_FONT,
                        background: isMe ? TC.blue : taken ? '#ddd' : TC.cream,
                        color: isMe ? TC.cream : TC.ink,
                        border: `2px solid ${TC.ink}`,
                        cursor: taken && !isMe ? 'not-allowed' : 'pointer',
                        minHeight: 50,
                      }}>
                      <div style={{ fontWeight: 'bold' }}>{ROLE_LABEL[role]}</div>
                      <div style={{ fontSize: 11 }}>{occupant ? occupant.nickname : '(empty)'}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16, fontFamily: HAND_FONT, color: TC.ink, fontSize: 14 }}>
        {myCourtId && myRole
          ? <>You're in <strong>{roomState.courts.find(c => c.id === myCourtId)?.name}</strong> as <strong>{ROLE_LABEL[myRole]}</strong>. Waiting for host to start…</>
          : <>Pick a slot above to join a court.</>}
      </div>

      <PixelButton onClick={handleBack} variant="ghost">Leave</PixelButton>
    </div>
  )
}
```

- [ ] **Step 2: Compile-check**

Run: `pnpm exec tsc --noEmit` (from `app/`)
Expected: no errors specific to this file.

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/MockTrialCourtSelectionScreen.tsx
git commit -m "feat(mock-trial): court + role slot selection screen"
```

---

## Task 13: MockTrialHostScreen (host control panel)

**Files:**
- Create: `app/src/screens/MockTrialHostScreen.tsx`

- [ ] **Step 1: Create the screen**

Create `app/src/screens/MockTrialHostScreen.tsx`:
```tsx
import { useEffect } from 'react'
import { TC, PIXEL_FONT, HAND_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore } from '../stores/mockTrialStore'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function MockTrialHostScreen({ onNavigate, onBack }: Props) {
  const {
    roomState, addCourt, startGame, nextCase, finishGame, hostOverride,
    revealData, finalLeaderboard, reset, error, clearError,
  } = useMockTrialStore()

  useEffect(() => {
    if (roomState?.status === 'finished') onNavigate('mock-trial-final')
  }, [roomState?.status, onNavigate])

  const handleBack = () => { reset(); onBack() }

  if (!roomState) {
    return <div style={{ padding: 24 }}><p style={{ fontFamily: HAND_FONT }}>Connecting…</p></div>
  }

  const allReady = roomState.courts.some(
    (c) => c.slots.prosecutor && c.slots.defense && c.slots.scribe,
  )

  return (
    <div style={{ minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 1, position: 'relative' }}>
      <h1 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 26, margin: 0 }}>Host Console</h1>
      <p style={{ fontFamily: HAND_FONT, color: TC.ink }}>
        Room <strong style={{ fontFamily: 'monospace', fontSize: 22 }}>{roomState.code}</strong>
        {' · '}Status: <strong>{roomState.status}</strong>
        {roomState.currentPhase ? <> · Phase: <strong>{roomState.currentPhase}</strong></> : null}
      </p>

      {error && (
        <div style={{ background: TC.magenta, color: TC.cream, padding: 8 }}>
          {error} <button onClick={clearError}>×</button>
        </div>
      )}

      {/* Courts overview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {roomState.courts.map((c) => (
          <div key={c.id} style={{ border: `2px solid ${TC.ink}`, padding: 8, background: TC.cream }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontFamily: PIXEL_FONT }}>{c.name}</strong>
              <span style={{ fontFamily: 'monospace' }}>Score: {c.totalScore}</span>
            </div>
            <div style={{ fontFamily: HAND_FONT, fontSize: 13, color: TC.ink }}>
              P: {c.slots.prosecutor?.nickname ?? '—'} ·
              D: {c.slots.defense?.nickname ?? '—'} ·
              J1: {c.slots.jury1?.nickname ?? '—'} ·
              J2: {c.slots.jury2?.nickname ?? '—'} ·
              S: {c.slots.scribe?.nickname ?? '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Lobby controls */}
      {roomState.status === 'lobby' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <PixelButton onClick={addCourt} disabled={roomState.courts.length >= 12}>+ Add Court</PixelButton>
          <PixelButton onClick={startGame} disabled={!allReady}>Start Game</PixelButton>
        </div>
      )}

      {/* Reveal-phase controls */}
      {roomState.status === 'reveal' && revealData && (
        <div style={{ border: `2px solid ${TC.ink}`, padding: 12, background: TC.cream }}>
          <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 18, margin: '0 0 8px 0', color: TC.ink }}>
            Answer: {revealData.correctVerdict === 'satisfied' ? 'Satisfied ✓' : 'Not Satisfied ✗'}
          </h2>
          <p style={{ fontFamily: HAND_FONT, color: TC.ink, whiteSpace: 'pre-wrap' }}>{revealData.answerExplanation}</p>
          <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 14, margin: '12px 0 4px 0' }}>Court Justifications (override scores if needed):</h3>
          {revealData.courtResults.map((cr) => (
            <div key={cr.courtId} style={{ borderTop: `1px dashed ${TC.ink}`, padding: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, fontFamily: HAND_FONT, fontSize: 13 }}>
                <strong>{cr.courtName}</strong> ({cr.caseTotal} pts):
                <em> "{cr.submission.justification || '(no justification)'}"</em>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => hostOverride(cr.courtId, -1)} style={{ padding: '2px 6px' }}>-1</button>
                <button onClick={() => hostOverride(cr.courtId, +1)} style={{ padding: '2px 6px' }}>+1</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <PixelButton onClick={nextCase}>Next Case →</PixelButton>
            <PixelButton onClick={finishGame} variant="ghost">End Game</PixelButton>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <PixelButton onClick={handleBack} variant="ghost">Close Room</PixelButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Compile-check**

Run: `pnpm exec tsc --noEmit` (from `app/`)
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/MockTrialHostScreen.tsx
git commit -m "feat(mock-trial): host control panel with reveal-phase overrides"
```

---

## Task 14: MockTrialCaseScreen + Prosecutor/Defense panels

**Files:**
- Create: `app/src/screens/MockTrialCaseScreen.tsx`
- Create: `app/src/screens/mock-trial-panels/ProsecutorPanel.tsx`
- Create: `app/src/screens/mock-trial-panels/DefensePanel.tsx`
- Create: `app/src/screens/mock-trial-panels/CaseUpperPanel.tsx`

The case screen is the shell; phase-conditional rendering swaps lower panel.

- [ ] **Step 1: Create the upper panel (shared across all roles)**

Create `app/src/screens/mock-trial-panels/CaseUpperPanel.tsx`:
```tsx
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../../ui/tokens'
import type { CasePublic, MockTrialPhase } from '../../mock-trial/types'
import { useEffect, useState } from 'react'

export default function CaseUpperPanel({
  caseData, phase, endsAt, courtName, caseIdx, caseCount,
}: {
  caseData: CasePublic; phase: MockTrialPhase; endsAt: number | null
  courtName: string; caseIdx: number; caseCount: number
}) {
  const remaining = useCountdown(endsAt)
  return (
    <div style={{ border: `2px solid ${TC.ink}`, background: TC.cream, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: PIXEL_FONT, color: TC.ink }}>
          Case {caseIdx + 1} / {caseCount} · {courtName}
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: 22, color: phase === 'arguing' ? TC.orange : TC.ink }}>
          {phase} · {remaining}s
        </span>
      </div>
      <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 18, margin: '0 0 6px 0', color: TC.ink }}>{caseData.title}</h2>
      <div style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 13, marginBottom: 8 }}>
        <strong>Claim:</strong> {caseData.claim.text}
      </div>
      <pre style={{ fontFamily: MONO_FONT ?? 'monospace', fontSize: 12, background: '#fff', padding: 8, border: `1px solid ${TC.ink}`, overflow: 'auto' }}>
        {caseData.codeSnippet}
      </pre>
      {caseData.testSet.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 12, marginTop: 6 }}>
          <thead>
            <tr>
              <th style={cell}>Test</th>
              <th style={cell}>Inputs</th>
              <th style={cell}>Expected</th>
            </tr>
          </thead>
          <tbody>
            {caseData.testSet.map((t) => (
              <tr key={t.label}>
                <td style={cell}>{t.label}</td>
                <td style={cell}>{Object.entries(t.inputs).map(([k, v]) => `${k}=${v}`).join(', ')}</td>
                <td style={cell}>{t.expected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const cell: React.CSSProperties = { border: `1px solid ${TC.ink}`, padding: '4px 6px' }

function useCountdown(endsAt: number | null): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!endsAt) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endsAt])
  if (!endsAt) return 0
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}
```

(If `MONO_FONT` doesn't exist in `tokens.ts`, replace with `'monospace'`.)

- [ ] **Step 2: Create the Prosecutor panel**

Create `app/src/screens/mock-trial-panels/ProsecutorPanel.tsx`:
```tsx
import { useState } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import { useMockTrialStore } from '../../stores/mockTrialStore'
import type { CasePublic } from '../../mock-trial/types'

export default function ProsecutorPanel({ caseData, courtId }: { caseData: CasePublic; courtId: string }) {
  const submitArgument = useMockTrialStore((s) => s.submitArgument)
  const liveArgs = useMockTrialStore((s) => s.liveArguments[courtId])
  const [argId, setArgId] = useState<string | null>(null)
  const [sentence, setSentence] = useState('')

  const submitted = !!liveArgs?.prosecutor

  const handleSend = () => {
    if (!argId) return
    submitArgument(argId, sentence.trim())
  }

  return (
    <div style={{ marginTop: 12, border: `2px solid ${TC.magenta}`, padding: 12, background: TC.cream }}>
      <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.magenta, margin: '0 0 8px 0' }}>
        You are the PROSECUTOR — argue the claim is NOT satisfied.
      </h3>
      {submitted ? (
        <div style={{ fontFamily: HAND_FONT, color: TC.ink }}>
          Argument submitted. Waiting for Defense and Jury…
          <div style={{ marginTop: 8, padding: 8, background: '#fff', border: `1px dashed ${TC.ink}` }}>
            <strong>Card:</strong> {caseData.prosecutorArguments.find((a) => a.id === liveArgs!.prosecutor!.argId)?.text}<br />
            <strong>Note:</strong> "{liveArgs!.prosecutor!.sentence}"
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {caseData.prosecutorArguments.map((a) => (
              <label key={a.id} style={{ fontFamily: HAND_FONT, color: TC.ink, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <input type="radio" name="prosArg" checked={argId === a.id} onChange={() => setArgId(a.id)} />
                <span>{a.text}</span>
              </label>
            ))}
          </div>
          <textarea
            value={sentence} onChange={(e) => setSentence(e.target.value.slice(0, 140))}
            placeholder="Write one sentence to back this up (≤140 chars)…"
            rows={2}
            style={{ width: '100%', fontFamily: HAND_FONT, fontSize: 14, padding: 6, border: `2px solid ${TC.ink}` }}
          />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <PixelButton onClick={handleSend} disabled={!argId}>Submit Argument</PixelButton>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create the Defense panel**

Create `app/src/screens/mock-trial-panels/DefensePanel.tsx`:
```tsx
import { useState } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import { useMockTrialStore } from '../../stores/mockTrialStore'
import type { CasePublic } from '../../mock-trial/types'

export default function DefensePanel({ caseData, courtId }: { caseData: CasePublic; courtId: string }) {
  const submitArgument = useMockTrialStore((s) => s.submitArgument)
  const liveArgs = useMockTrialStore((s) => s.liveArguments[courtId])
  const [argId, setArgId] = useState<string | null>(null)
  const [sentence, setSentence] = useState('')

  const submitted = !!liveArgs?.defense

  return (
    <div style={{ marginTop: 12, border: `2px solid ${TC.green}`, padding: 12, background: TC.cream }}>
      <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.green, margin: '0 0 8px 0' }}>
        You are the DEFENSE — argue the claim IS satisfied.
      </h3>
      {submitted ? (
        <div style={{ fontFamily: HAND_FONT, color: TC.ink }}>
          Argument submitted. Waiting for Prosecutor and Jury…
          <div style={{ marginTop: 8, padding: 8, background: '#fff', border: `1px dashed ${TC.ink}` }}>
            <strong>Card:</strong> {caseData.defenseArguments.find((a) => a.id === liveArgs!.defense!.argId)?.text}<br />
            <strong>Note:</strong> "{liveArgs!.defense!.sentence}"
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {caseData.defenseArguments.map((a) => (
              <label key={a.id} style={{ fontFamily: HAND_FONT, color: TC.ink, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <input type="radio" name="defArg" checked={argId === a.id} onChange={() => setArgId(a.id)} />
                <span>{a.text}</span>
              </label>
            ))}
          </div>
          <textarea
            value={sentence} onChange={(e) => setSentence(e.target.value.slice(0, 140))}
            placeholder="Write one sentence to back this up (≤140 chars)…"
            rows={2}
            style={{ width: '100%', fontFamily: HAND_FONT, fontSize: 14, padding: 6, border: `2px solid ${TC.ink}` }}
          />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <PixelButton onClick={() => argId && submitArgument(argId, sentence.trim())} disabled={!argId}>Submit Argument</PixelButton>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create the case-screen shell**

Create `app/src/screens/MockTrialCaseScreen.tsx`:
```tsx
import { useEffect } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore, getMyCourt } from '../stores/mockTrialStore'
import CaseUpperPanel from './mock-trial-panels/CaseUpperPanel'
import ProsecutorPanel from './mock-trial-panels/ProsecutorPanel'
import DefensePanel from './mock-trial-panels/DefensePanel'
import JuryPanel from './mock-trial-panels/JuryPanel'
import ScribePanel from './mock-trial-panels/ScribePanel'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function MockTrialCaseScreen({ onNavigate, onBack }: Props) {
  const state = useMockTrialStore()
  const { roomState, currentCase, myRole, myCourtId, reset } = state

  useEffect(() => {
    if (roomState?.status === 'reveal')   onNavigate('mock-trial-reveal')
    if (roomState?.status === 'finished') onNavigate('mock-trial-final')
  }, [roomState?.status, onNavigate])

  const myCourt = getMyCourt(state)
  if (!roomState || !currentCase) {
    return <div style={{ padding: 24, fontFamily: HAND_FONT }}>Loading case…</div>
  }
  if (!myCourt || !myRole) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontFamily: HAND_FONT }}>You're a Spectator. Wait for the next case to claim a slot.</p>
        <PixelButton onClick={() => { reset(); onBack() }} variant="ghost">Leave</PixelButton>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720, margin: '0 auto', zIndex: 1, position: 'relative' }}>
      <CaseUpperPanel
        caseData={currentCase}
        phase={roomState.currentPhase ?? 'briefing'}
        endsAt={roomState.phaseEndsAt}
        courtName={myCourt.name}
        caseIdx={roomState.currentCaseIdx}
        caseCount={roomState.caseCount}
      />

      {roomState.currentPhase === 'briefing' && (
        <div style={{ padding: 16, background: TC.cream, border: `2px solid ${TC.ink}`, fontFamily: HAND_FONT, color: TC.ink, textAlign: 'center' }}>
          <h3 style={{ fontFamily: PIXEL_FONT, color: TC.ink, margin: '0 0 8px 0' }}>Read the case carefully.</h3>
          <p>Argument phase begins when the timer runs out.</p>
        </div>
      )}

      {roomState.currentPhase === 'arguing' && (
        <>
          {myRole === 'prosecutor' && <ProsecutorPanel caseData={currentCase} courtId={myCourt.id} />}
          {myRole === 'defense'    && <DefensePanel    caseData={currentCase} courtId={myCourt.id} />}
          {(myRole === 'jury1' || myRole === 'jury2' || myRole === 'scribe') && (
            <WaitingForArguments courtId={myCourt.id} caseData={currentCase} role={myRole} />
          )}
        </>
      )}

      {roomState.currentPhase === 'deliberating' && (
        <>
          {(myRole === 'jury1' || myRole === 'jury2') && <JuryPanel caseData={currentCase} courtId={myCourt.id} />}
          {myRole === 'scribe' && <ScribePanel caseData={currentCase} courtId={myCourt.id} hasJury={!!myCourt.slots.jury1 || !!myCourt.slots.jury2} />}
          {(myRole === 'prosecutor' || myRole === 'defense') && (
            <div style={{ padding: 16, background: TC.cream, border: `2px solid ${TC.ink}`, fontFamily: HAND_FONT, color: TC.ink, textAlign: 'center' }}>
              Arguments are in. Jury is voting and Scribe is writing the verdict…
            </div>
          )}
        </>
      )}
    </div>
  )
}

function WaitingForArguments({ courtId, caseData, role }: { courtId: string; caseData: import('../mock-trial/types').CasePublic; role: string }) {
  const liveArgs = useMockTrialStore((s) => s.liveArguments[courtId])
  return (
    <div style={{ padding: 12, background: TC.cream, border: `2px solid ${TC.ink}`, fontFamily: HAND_FONT, color: TC.ink }}>
      <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 14, margin: '0 0 8px 0' }}>You are the {role.toUpperCase()} — wait for arguments.</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <SideBox title="Prosecutor" color={TC.magenta} card={liveArgs?.prosecutor && caseData.prosecutorArguments.find((a) => a.id === liveArgs.prosecutor!.argId)?.text} note={liveArgs?.prosecutor?.sentence} />
        <SideBox title="Defense"    color={TC.green}   card={liveArgs?.defense    && caseData.defenseArguments.find((a) => a.id === liveArgs.defense!.argId)?.text}    note={liveArgs?.defense?.sentence} />
      </div>
    </div>
  )
}

function SideBox({ title, color, card, note }: { title: string; color: string; card?: string; note?: string }) {
  return (
    <div style={{ border: `2px solid ${color}`, padding: 8, background: '#fff', minHeight: 80 }}>
      <strong style={{ color }}>{title}</strong>
      {card ? <div style={{ fontSize: 12, marginTop: 4 }}>{card}</div> : <div style={{ fontStyle: 'italic', fontSize: 12, color: '#999', marginTop: 4 }}>(waiting…)</div>}
      {note ? <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>"{note}"</div> : null}
    </div>
  )
}
```

- [ ] **Step 5: Compile-check (will reference JuryPanel/ScribePanel — implemented next task)**

Run: `pnpm exec tsc --noEmit`
Expected: errors only for missing `JuryPanel` and `ScribePanel`. Proceed to Task 15.

- [ ] **Step 6: Commit**

```bash
git add app/src/screens/MockTrialCaseScreen.tsx app/src/screens/mock-trial-panels/
git commit -m "feat(mock-trial): case screen shell + Prosecutor/Defense panels"
```

---

## Task 15: Jury + Scribe panels

**Files:**
- Create: `app/src/screens/mock-trial-panels/JuryPanel.tsx`
- Create: `app/src/screens/mock-trial-panels/ScribePanel.tsx`

- [ ] **Step 1: Create Jury panel**

Create `app/src/screens/mock-trial-panels/JuryPanel.tsx`:
```tsx
import { useState } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import { useMockTrialStore } from '../../stores/mockTrialStore'
import type { CasePublic, Side } from '../../mock-trial/types'

export default function JuryPanel({ caseData, courtId }: { caseData: CasePublic; courtId: string }) {
  const submitVote = useMockTrialStore((s) => s.submitVote)
  const liveArgs = useMockTrialStore((s) => s.liveArguments[courtId])
  const [voted, setVoted] = useState<Side | null>(null)

  const handle = (side: Side) => { if (voted) return; setVoted(side); submitVote(side) }

  const prosCardText = liveArgs?.prosecutor ? caseData.prosecutorArguments.find((a) => a.id === liveArgs.prosecutor!.argId)?.text : ''
  const defCardText  = liveArgs?.defense    ? caseData.defenseArguments   .find((a) => a.id === liveArgs.defense!.argId)?.text     : ''

  return (
    <div style={{ marginTop: 12, border: `2px solid ${TC.orange}`, padding: 12, background: TC.cream }}>
      <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.orange, margin: '0 0 8px 0' }}>
        You are the JURY — pick the stronger argument.
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <button onClick={() => handle('prosecutor')} disabled={!!voted}
          style={{ ...btn, borderColor: TC.magenta, background: voted === 'prosecutor' ? TC.magenta : '#fff', color: voted === 'prosecutor' ? TC.cream : TC.ink }}>
          <strong style={{ color: TC.magenta }}>Prosecutor</strong>
          <div style={{ fontSize: 12, marginTop: 4 }}>{prosCardText ?? '(no argument)'}</div>
          {liveArgs?.prosecutor?.sentence ? <div style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>"{liveArgs.prosecutor.sentence}"</div> : null}
        </button>
        <button onClick={() => handle('defense')} disabled={!!voted}
          style={{ ...btn, borderColor: TC.green, background: voted === 'defense' ? TC.green : '#fff', color: voted === 'defense' ? TC.cream : TC.ink }}>
          <strong style={{ color: TC.green }}>Defense</strong>
          <div style={{ fontSize: 12, marginTop: 4 }}>{defCardText ?? '(no argument)'}</div>
          {liveArgs?.defense?.sentence ? <div style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>"{liveArgs.defense.sentence}"</div> : null}
        </button>
      </div>
      {voted && (
        <div style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 13 }}>
          Vote sent. Scribe is writing the verdict…
        </div>
      )}
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: 12,
  border: '2px solid',
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  textAlign: 'left',
}
```

- [ ] **Step 2: Create Scribe panel**

Create `app/src/screens/mock-trial-panels/ScribePanel.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import { useMockTrialStore } from '../../stores/mockTrialStore'
import type { CasePublic, Verdict } from '../../mock-trial/types'

export default function ScribePanel({ caseData, courtId, hasJury }: { caseData: CasePublic; courtId: string; hasJury: boolean }) {
  const submitVerdict = useMockTrialStore((s) => s.submitVerdict)
  // We rely on the server-side first-jury-vote being broadcast via room_state,
  // but for snappier UX, check live store for vote presence. For MVP we just
  // enable the form once arguments are in (deliberation phase always means
  // both arguments submitted, so the form is ready immediately).
  const [verdict, setVerdict] = useState<Verdict | ''>('')
  const [justification, setJustification] = useState('')
  const [sent, setSent] = useState(false)

  // Suppress unused var when no jury (fallback path)
  useEffect(() => { void hasJury }, [hasJury])

  const handleSubmit = () => {
    if (!verdict) return
    submitVerdict(verdict, justification.trim())
    setSent(true)
  }

  return (
    <div style={{ marginTop: 12, border: `2px solid ${TC.blue}`, padding: 12, background: TC.cream }}>
      <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.blue, margin: '0 0 8px 0' }}>
        You are the SCRIBE — submit your court's verdict.
      </h3>
      {sent ? (
        <div style={{ fontFamily: HAND_FONT, color: TC.ink }}>
          Verdict submitted. Waiting for reveal…
        </div>
      ) : (
        <>
          <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginBottom: 8 }}>
            Verdict on the claim: <em>"{caseData.claim.text}"</em>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setVerdict('satisfied')}
              style={{ ...btn, background: verdict === 'satisfied' ? TC.green : '#fff', color: verdict === 'satisfied' ? TC.cream : TC.ink }}>
              Satisfied
            </button>
            <button onClick={() => setVerdict('not_satisfied')}
              style={{ ...btn, background: verdict === 'not_satisfied' ? TC.magenta : '#fff', color: verdict === 'not_satisfied' ? TC.cream : TC.ink }}>
              Not Satisfied
            </button>
          </div>
          <textarea value={justification} onChange={(e) => setJustification(e.target.value.slice(0, 200))}
            placeholder="One-sentence justification (≤200 chars)…" rows={3}
            style={{ width: '100%', fontFamily: HAND_FONT, fontSize: 14, padding: 6, border: `2px solid ${TC.ink}` }} />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <PixelButton onClick={handleSubmit} disabled={!verdict}>Submit Verdict</PixelButton>
          </div>
        </>
      )}
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: '8px 16px', border: `2px solid ${TC.ink}`, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}
```

- [ ] **Step 3: Compile-check**

Run: `pnpm exec tsc --noEmit` (from `app/`)
Expected: no errors in mock-trial panels (other unrelated errors OK).

- [ ] **Step 4: Commit**

```bash
git add app/src/screens/mock-trial-panels/JuryPanel.tsx app/src/screens/mock-trial-panels/ScribePanel.tsx
git commit -m "feat(mock-trial): Jury vote panel and Scribe verdict form"
```

---

## Task 16: MockTrialRevealScreen + Jury self-score widget

**Files:**
- Create: `app/src/screens/MockTrialRevealScreen.tsx`

- [ ] **Step 1: Create the screen**

Create `app/src/screens/MockTrialRevealScreen.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore, getMyCourt } from '../stores/mockTrialStore'
import type { Screen } from '../stores/gameStore'
import type { SelfScore } from '../mock-trial/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function MockTrialRevealScreen({ onNavigate, onBack }: Props) {
  const state = useMockTrialStore()
  const { revealData, roomState, myRole, submitSelfScore, reset } = state
  const myCourt = getMyCourt(state)
  const [scored, setScored] = useState(false)

  useEffect(() => {
    if (roomState?.status === 'in_case')  onNavigate('mock-trial-case')
    if (roomState?.status === 'finished') onNavigate('mock-trial-final')
  }, [roomState?.status, onNavigate])

  if (!revealData) {
    return <div style={{ padding: 24, fontFamily: HAND_FONT }}>Loading reveal…</div>
  }

  const myResult = myCourt ? revealData.courtResults.find((r) => r.courtId === myCourt.id) : null
  const canSelfScore = myRole === 'jury1' || myRole === 'jury2' || (myRole === 'scribe' && !myCourt?.slots.jury1 && !myCourt?.slots.jury2)

  const handleScore = (score: SelfScore) => {
    setScored(true)
    submitSelfScore(score)
  }

  return (
    <div style={{ minHeight: '100vh', padding: 16, maxWidth: 760, margin: '0 auto', zIndex: 1, position: 'relative' }}>
      <div style={{ border: `2px solid ${TC.ink}`, padding: 16, background: TC.cream, marginBottom: 12 }}>
        <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 22, margin: '0 0 8px 0', color: revealData.correctVerdict === 'satisfied' ? TC.green : TC.magenta }}>
          Official Verdict: {revealData.correctVerdict === 'satisfied' ? 'SATISFIED ✓' : 'NOT SATISFIED ✗'}
        </h2>
        {revealData.pitfallTag && (
          <div style={{ display: 'inline-block', background: TC.orange, color: TC.cream, padding: '2px 8px', fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }}>
            {revealData.pitfallTag}
          </div>
        )}
        <p style={{ fontFamily: HAND_FONT, color: TC.ink, whiteSpace: 'pre-wrap', margin: 0 }}>
          {revealData.answerExplanation}
        </p>
      </div>

      {myResult && (
        <div style={{ border: `2px solid ${TC.ink}`, padding: 12, background: TC.cream, marginBottom: 12 }}>
          <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 16, margin: '0 0 8px 0' }}>Your court's result</h3>
          <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
            Verdict: {myResult.submission.verdict ?? '—'} → <strong>{myResult.verdictScore}</strong> pts<br />
            Prosecutor card bonus: <strong>{myResult.prosecutorBonus}</strong><br />
            Defense card bonus: <strong>{myResult.defenseBonus}</strong><br />
            Jury bonus: <strong>{myResult.juryBonus}</strong><br />
            <strong>Total: {myResult.caseTotal}</strong>
          </div>
          <div style={{ marginTop: 8, fontFamily: HAND_FONT, color: TC.ink }}>
            Your justification: <em>"{myResult.submission.justification || '(none)'}"</em>
          </div>
        </div>
      )}

      {canSelfScore && !scored && myResult && myResult.juryBonus === 0 && (
        <div style={{ border: `2px solid ${TC.orange}`, padding: 12, background: TC.cream, marginBottom: 12 }}>
          <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 14, margin: '0 0 6px 0', color: TC.orange }}>
            Self-score your justification
          </h3>
          <p style={{ fontFamily: HAND_FONT, fontSize: 13, margin: '0 0 8px 0', color: TC.ink }}>
            How aligned is your written justification with the official learning note above?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <PixelButton onClick={() => handleScore(1)}>Aligned (+1)</PixelButton>
            <PixelButton onClick={() => handleScore(0.5)}>Partial (+0.5)</PixelButton>
            <PixelButton onClick={() => handleScore(0)} variant="ghost">Not aligned (0)</PixelButton>
          </div>
        </div>
      )}

      <div style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 13, textAlign: 'center' }}>
        Waiting for host to start the next case…
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <PixelButton onClick={() => { reset(); onBack() }} variant="ghost">Leave</PixelButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Compile-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/MockTrialRevealScreen.tsx
git commit -m "feat(mock-trial): reveal screen with answer note and self-score widget"
```

---

## Task 17: MockTrialFinalScreen (final leaderboard)

**Files:**
- Create: `app/src/screens/MockTrialFinalScreen.tsx`

- [ ] **Step 1: Create the screen**

Create `app/src/screens/MockTrialFinalScreen.tsx`:
```tsx
import { TC, PIXEL_FONT, HAND_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore } from '../stores/mockTrialStore'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function MockTrialFinalScreen({ onNavigate: _onNavigate, onBack }: Props) {
  const { finalLeaderboard, reset } = useMockTrialStore()

  const handleBack = () => { reset(); onBack() }

  return (
    <div style={{ minHeight: '100vh', padding: 24, maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, zIndex: 1, position: 'relative' }}>
      <h1 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 28, margin: 0, textAlign: 'center' }}>
        Final Verdict
      </h1>

      {finalLeaderboard.length === 0 ? (
        <p style={{ fontFamily: HAND_FONT, textAlign: 'center', color: TC.ink }}>No results recorded.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {finalLeaderboard.map((c) => {
            const isTopThree = c.rank <= 3
            const color = c.rank === 1 ? TC.green : c.rank === 2 ? TC.blue : c.rank === 3 ? TC.orange : TC.ink
            return (
              <div key={c.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 12, border: `${isTopThree ? 3 : 2}px solid ${color}`, background: TC.cream,
              }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 18, color: TC.ink }}>
                  <span style={{ color, marginRight: 12 }}>#{c.rank}</span>
                  {c.name}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 20, color: TC.ink }}>
                  {c.totalScore} pts
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <PixelButton onClick={handleBack}>Back to Menu</PixelButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Compile-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/screens/MockTrialFinalScreen.tsx
git commit -m "feat(mock-trial): final group leaderboard screen"
```

---

## Task 18: Wire all Mock Trial screens into App.tsx

**Files:**
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Add imports + switch cases**

Open `app/src/App.tsx`. Add these imports after the existing Speed Trial imports:
```ts
import MockTrialLobbyScreen          from './screens/MockTrialLobbyScreen'
import MockTrialCourtSelectionScreen from './screens/MockTrialCourtSelectionScreen'
import MockTrialHostScreen           from './screens/MockTrialHostScreen'
import MockTrialCaseScreen           from './screens/MockTrialCaseScreen'
import MockTrialRevealScreen         from './screens/MockTrialRevealScreen'
import MockTrialFinalScreen          from './screens/MockTrialFinalScreen'
```

Then in the `switch (screen)` block, after the existing `'speed-trial-winner'` case, add:
```tsx
      case 'mock-trial-lobby':
        return <MockTrialLobbyScreen onNavigate={navigate} onBack={goBack} />
      case 'mock-trial-court-select':
        return <MockTrialCourtSelectionScreen onNavigate={navigate} onBack={goBack} />
      case 'mock-trial-host':
        return <MockTrialHostScreen onNavigate={navigate} onBack={goBack} />
      case 'mock-trial-case':
        return <MockTrialCaseScreen onNavigate={navigate} onBack={goBack} />
      case 'mock-trial-reveal':
        return <MockTrialRevealScreen onNavigate={navigate} onBack={goBack} />
      case 'mock-trial-final':
        return <MockTrialFinalScreen onNavigate={navigate} onBack={goBack} />
```

- [ ] **Step 2: Compile-check whole app**

Run from `app/`: `pnpm exec tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: zero lint errors in new files. Fix any reported issues inline.

- [ ] **Step 4: Commit**

```bash
git add app/src/App.tsx
git commit -m "feat(mock-trial): wire all 6 screens into router"
```

---

## Task 19: End-to-end manual smoke test

**Files:** none (manual verification + bug-fix commits as needed)

- [ ] **Step 1: Start server**

In one terminal:
```bash
cd app/server && pnpm dev
```
Expected: `[Speed Trial Server] listening on http://localhost:3001`

- [ ] **Step 2: Start client**

In another terminal:
```bash
cd app && pnpm dev
```
Expected: Vite dev server URL printed.

- [ ] **Step 3: Open 4 browser tabs**

Open the Vite URL in 4 separate tabs/windows (or use a regular tab + 3 incognito windows).

- [ ] **Step 4: Run a full mock trial**

In each tab:
1. Main menu → Mock Trial.
2. Tab 1: Host a Room → nickname "Hoca", avatar Judge, config 5/90/45 → "Create Room". Note the 6-char room code.
3. Tabs 2-4: Join a Room → enter the code, nicknames "Ali", "Veli", "Ayse", various avatars.
4. Tab 2: click `Court 1 > Prosecutor`. Tab 3: `Court 1 > Defense`. Tab 4: `Court 1 > Scribe`.
5. Tab 1 (host): Should see "Court 1 · Ready". Click **Start Game**.
6. **Briefing phase (30s)**: All player tabs show case 1 title, code, test set, claim. Timer counts down.
7. **Arguing phase**: Prosecutor tab picks an argument card + writes a sentence → Submit. Defense tab same. Scribe tab shows "wait for arguments".
8. **Deliberating phase**: (Should auto-advance because both args submitted.) Scribe sees verdict form. Picks verdict + writes justification → Submit.
9. **Reveal phase**: All tabs show official answer + learning note. Scribe (no jury) can self-score → click Aligned (+1).
10. **Host tab**: sees court's justification; click `Next Case →`.
11. Repeat through all 5 cases.
12. **Final screen**: all tabs see final leaderboard with #1 highlighted.

Expected: every transition works; no console errors; scores match formula.

- [ ] **Step 5: Verify Speed Trial still works**

Open one more tab → Main menu → Speed Trial → create a room, join, run one question. Confirm no regression.

- [ ] **Step 6: If any bugs found, fix and re-commit per bug**

For each bug discovered, write a focused commit:
```bash
git add <files>
git commit -m "fix(mock-trial): <describe the bug>"
```

- [ ] **Step 7: Final summary commit (if no bugs)**

If everything passed, no extra commit needed. The branch is ready for review.
