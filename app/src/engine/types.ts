export type TruthTableRow = {
  index: number
  values: Record<string, boolean>
  decision: boolean
}

export type IndependencePair = {
  row1: number
  row2: number
}

export type McdcSubmission = IndependencePair[]

export type VerdictResult = {
  coverageAchieved: number
  coveredConditions: string[]
  uncoveredConditions: string[]
  faultsDetected: string[]
  faultsMissed: string[]
  misconceptions: string[]
  passed: boolean
}

export type GamePhase =
  | 'briefing'
  | 'investigation'
  | 'evidence'
  | 'trial'
  | 'debrief'

// ─── Coverage Hierarchy (Concept Analysis §2) ───────────────────────────────
// Six white-box techniques mapped to ISO 29119-4 clauses.
// Each technique exposes a weakness corrected by the next one in the chain.
export type Technique =
  | 'STATEMENT' // §5.3.1 — executed nodes (CFG)
  | 'BRANCH'    // §5.3.2 — traversed edges (CFG)
  | 'DECISION'  // §5.3.3 — true/false outcomes
  | 'BC'        // §5.3.4 — each condition T/F
  | 'BCC'       // §5.3.5 — all 2^N combinations
  | 'MCDC'      // §5.3.6 — independence pairs

// ─── Learning Layer (Concept Analysis §4 progression) ───────────────────────
// Layer 1: Recognition (Statement & Branch)
// Layer 2: Discrimination (Branch ↔ Decision)
// Layer 3: Decomposition (Decision → BC)
// Layer 4: Synthesis & Independence (BCC ↔ MCDC)
export type LearningLayer = 1 | 2 | 3 | 4

// ─── Single-player question interaction types ───────────────────────────────
export type QuestionType =
  | 'binary_verdict'   // L1: claim valid / invalid
  | 'level_picker'     // L2: which max coverage level is satisfied?
  | 'coverage_table'   // L3: mark T/F per condition per test
  | 'pair_selector'    // L4: pick MCDC independence pair
  | 'test_designer'    // L4 boss: design minimum test set
  | 'numeric_input'    // bridge quizzes (e.g. 'BCC tests for N=4?')

// ─── Test set row (used by single-player verdict cases) ─────────────────────
export type TestSetRow = {
  id: string
  inputs: Record<string, boolean>
  outcome: boolean
}

// ─── Misconception identifiers (Concept Analysis §3) ───────────────────────
export type MisconceptionId =
  | 'STMT-BLIND-TO-BRANCH'        // 100% statement = fully tested
  | 'STMT-GUARANTEES-BRANCH'      // statement coverage implies branch coverage
  | 'DECISION-EQUALS-BC'          // decision coverage = branch condition coverage
  | 'BCC-EQUALS-MCDC'             // BCC and MCDC are the same technique
  | 'MCDC-INDEP-AS-ISOLATION'     // one test per condition is enough for MCDC
