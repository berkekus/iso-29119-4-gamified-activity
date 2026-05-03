import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CaseFile } from '../engine/caseLoader'
import { loadCase as parseCaseFile } from '../engine/caseLoader'
import type {
  TruthTableRow,
  IndependencePair,
  McdcSubmission,
  VerdictResult,
  GamePhase,
} from '../engine/types'
import { generateTruthTable } from '../engine/coverage/mcdc'
import { computeVerdict } from '../engine/verdict/index'

// ── Case content registry — all 12 cases keyed by id ─────────────────────────
import stmtTutorial01      from '../content/cases/stmt-tutorial-01.json'
import stmtHiddenBranch01  from '../content/cases/stmt-hidden-branch-01.json'
import branchLoopTrap01    from '../content/cases/branch-loop-trap-01.json'
import decisionAndTrap01   from '../content/cases/decision-and-trap-01.json'
import bcOrThreeCond01     from '../content/cases/bc-or-three-cond-01.json'
import bcNegationMask01    from '../content/cases/bc-negation-mask-01.json'
import bccThreeAnd01       from '../content/cases/bcc-three-and-01.json'
import bccCostIntuition01  from '../content/cases/bcc-cost-intuition-01.json'
import mcdcTutorial01      from '../content/cases/mcdc-tutorial-01.json'
import mcdcAltitude01      from '../content/cases/mcdc-altitude-disengage-01.json'
import mcdcTrapIsolation01 from '../content/cases/mcdc-trap-isolation-01.json'
import mcdcVaultBoss01     from '../content/cases/mcdc-vault-boss-01.json'

const CASE_REGISTRY: Record<string, unknown> = {
  'stmt-tutorial-01':           stmtTutorial01,
  'stmt-hidden-branch-01':      stmtHiddenBranch01,
  'branch-loop-trap-01':        branchLoopTrap01,
  'decision-and-trap-01':       decisionAndTrap01,
  'bc-or-three-cond-01':        bcOrThreeCond01,
  'bc-negation-mask-01':        bcNegationMask01,
  'bcc-three-and-01':           bccThreeAnd01,
  'bcc-cost-intuition-01':      bccCostIntuition01,
  'mcdc-tutorial-01':           mcdcTutorial01,
  'mcdc-altitude-disengage-01': mcdcAltitude01,
  'mcdc-trap-isolation-01':     mcdcTrapIsolation01,
  'mcdc-vault-boss-01':         mcdcVaultBoss01,
}

// ── Screen type — all navigable screens ──────────────────────────────────────

export type Screen =
  | 'menu'
  | 'how-to-play'
  | 'campaign'
  | 'briefing'
  | 'investigation'
  | 'evidence'
  | 'trial'
  | 'debrief'
  | 'design-system'
  | 'multiplayer'
  | 'achievements'

// ── MCDC namespace types ──────────────────────────────────────────────────────

type McdcPair = { condition: string; row1: number; row2: number }

type McdcVerdictResult = {
  coverageAchieved: boolean
  coveragePercent: number
  conditionsCovered: string[]
}

type McdcFaultResult = { id: string; detected: boolean }

type McdcMisconception = { id: string; triggered: boolean; explanation: string }

interface McdcState {
  selectedRows: number[]
  independencePairs: McdcPair[]
  verdictResult: McdcVerdictResult | null
  faultResults: McdcFaultResult[]
  misconceptions: McdcMisconception[]
}

// ── Main GameState ────────────────────────────────────────────────────────────

interface GameState {
  // Navigation
  screen: Screen
  screenHistory: Screen[]
  navigate: (screen: Screen) => void
  goBack: () => void

  // Week 3 state — kept intact
  phase: GamePhase
  caseFile: CaseFile | null
  truthTable: TruthTableRow[]
  submission: McdcSubmission
  verdict: VerdictResult | null
  completedCases: string[]

  loadCase: (caseData: CaseFile) => void
  loadCaseById: (caseId: string) => void
  addSubmissionPair: (pair: IndependencePair) => void
  removePair: (row1: number, row2: number) => void
  submitForVerdict: () => void
  advancePhase: () => void
  resetGame: () => void
  markCaseCompleted: (caseId: string) => void
  resetMcdc: () => void

  // MCDC namespace — B-UI actions
  mcdc: McdcState
  toggleRow: (rowId: number) => void
  addPair: (pair: McdcPair) => void
  clearPairs: () => void
  setVerdict: (
    result: McdcVerdictResult,
    faults: McdcFaultResult[],
    misconceptions: McdcMisconception[],
  ) => void

  // Generic single-answer submission for non-pair_selector question types.
  // Returns true on a passing answer (caller can navigate to debrief). Wires
  // through setVerdict so DebriefScreen renders its banner unchanged.
  submitAnswer: (payload: AnswerPayload) => boolean
}

// ── submitAnswer payload union — one variant per question_type ──────────────
export type AnswerPayload =
  | { kind: 'binary_verdict'; optionId: string }
  | { kind: 'level_picker';   optionId: string }
  | { kind: 'coverage_table'; selectedRowIds: string[] }
  | { kind: 'numeric_input';  answers: number[] }
  | { kind: 'test_designer';  selectedRowIds: string[] }

const PHASES: GamePhase[] = ['briefing', 'investigation', 'evidence', 'trial', 'debrief']

// ── Answer evaluation — pure, exported for tests ────────────────────────────
//
// Each branch resolves the case's correctness key for its question_type:
//  • binary_verdict / level_picker  → caseFile.options[].is_correct
//  • test_designer                  → caseFile.coverage_table[].required (set
//                                     of required row ids) + required_pick_count
//  • coverage_table                 → caseFile.coverage_table[].required
//                                     (player must include all required rows;
//                                     extras allowed)
//  • numeric_input                  → caseFile.numeric_prompts[].answer
//                                     (exact match; no tolerance)
export function evaluateAnswer(caseData: CaseFile, payload: AnswerPayload): boolean {
  switch (payload.kind) {
    case 'binary_verdict':
    case 'level_picker': {
      const opt = (caseData.options ?? []).find((o) => o.id === payload.optionId)
      return Boolean(opt?.is_correct)
    }
    case 'coverage_table': {
      const rows = caseData.coverage_table ?? []
      const requiredIds = new Set(rows.filter((r) => r.required).map((r) => r.id))
      const selected = new Set(payload.selectedRowIds)
      // Must include every required row; extras are allowed.
      for (const id of requiredIds) if (!selected.has(id)) return false
      // Must not select any unknown row id (defensive).
      for (const id of selected) if (!rows.some((r) => r.id === id)) return false
      return true
    }
    case 'numeric_input': {
      const prompts = caseData.numeric_prompts ?? []
      if (payload.answers.length !== prompts.length) return false
      return prompts.every((p, i) => payload.answers[i] === p.answer)
    }
    case 'test_designer': {
      const rows = caseData.coverage_table ?? []
      const requiredIds = new Set(rows.filter((r) => r.required).map((r) => r.id))
      const selected = new Set(payload.selectedRowIds)
      const expectedCount = caseData.required_pick_count ?? requiredIds.size
      if (selected.size !== expectedCount) return false
      // Selection must equal the required-id set exactly.
      if (selected.size !== requiredIds.size) return false
      for (const id of requiredIds) if (!selected.has(id)) return false
      return true
    }
  }
}

const initialMcdc: McdcState = {
  selectedRows: [],
  independencePairs: [],
  verdictResult: null,
  faultResults: [],
  misconceptions: [],
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
  // Navigation
  screen: 'menu',
  screenHistory: [],
  navigate: (screen) => {
    set((state) => ({
      screenHistory: [...state.screenHistory, state.screen],
      screen,
    }))
  },
  goBack: () => {
    set((state) => {
      const history = [...state.screenHistory]
      const prev = history.pop() ?? 'menu'
      return { screen: prev, screenHistory: history }
    })
  },

  // Week 3 state
  phase: 'briefing',
  caseFile: null,
  truthTable: [],
  submission: [],
  verdict: null,
  completedCases: [],

  loadCase: (caseData) => {
    const truthTable = generateTruthTable(
      caseData.scenario.conditions,
      caseData.scenario.decision_expression,
    )
    set({
      caseFile: caseData,
      truthTable,
      phase: 'briefing',
      submission: [],
      verdict: null,
      mcdc: initialMcdc,
    })
  },

  loadCaseById: (caseId) => {
    const raw = CASE_REGISTRY[caseId]
    if (!raw) {
      console.error(`[gameStore] Unknown case id: ${caseId}`)
      throw new Error(`Unknown case id: ${caseId}`)
    }
    const caseData = parseCaseFile(raw)
    get().loadCase(caseData)
  },

  addSubmissionPair: (pair) => {
    set((state) => ({ submission: [...state.submission, pair] }))
  },

  removePair: (row1, row2) => {
    set((state) => ({
      submission: state.submission.filter(
        (p) =>
          !(
            (p.row1 === row1 && p.row2 === row2) ||
            (p.row1 === row2 && p.row2 === row1)
          ),
      ),
    }))
  },

  submitForVerdict: () => {
    const { submission, truthTable, caseFile } = get()
    if (!caseFile) return
    const verdict = computeVerdict(submission, truthTable, caseFile)
    set({ verdict, phase: 'trial' })
  },

  advancePhase: () => {
    set((state) => {
      const current = PHASES.indexOf(state.phase)
      const next = PHASES[current + 1] ?? state.phase
      return { phase: next }
    })
  },

  resetGame: () => {
    set({
      phase: 'briefing',
      caseFile: null,
      truthTable: [],
      submission: [],
      verdict: null,
      mcdc: initialMcdc,
    })
  },

  // Idempotent: a case id is added to completedCases at most once. Callers
  // (currently DebriefScreen on a passing verdict) own the policy of when to
  // mark — this action simply records the fact.
  markCaseCompleted: (caseId) => {
    set((state) =>
      state.completedCases.includes(caseId)
        ? state
        : { completedCases: [...state.completedCases, caseId] },
    )
  },

  // Resets just the per-case run state so RETRY CASE can reuse the same
  // CaseFile without losing campaign-level progress (completedCases).
  resetMcdc: () => {
    set((state) => ({
      phase: 'briefing',
      submission: [],
      verdict: null,
      mcdc: initialMcdc,
      truthTable: state.truthTable,
      caseFile: state.caseFile,
    }))
  },

  // MCDC namespace
  mcdc: initialMcdc,

  toggleRow: (rowId) => {
    set((state) => {
      const rows = state.mcdc.selectedRows
      const updated = rows.includes(rowId) ? rows.filter((r) => r !== rowId) : [...rows, rowId]
      return { mcdc: { ...state.mcdc, selectedRows: updated } }
    })
  },

  addPair: (pair) => {
    set((state) => ({
      mcdc: { ...state.mcdc, independencePairs: [...state.mcdc.independencePairs, pair] },
    }))
  },

  clearPairs: () => {
    set((state) => ({ mcdc: { ...state.mcdc, independencePairs: [] } }))
  },

  setVerdict: (result, faults, miscList) => {
    set((state) => ({
      mcdc: {
        ...state.mcdc,
        verdictResult: result,
        faultResults: faults,
        misconceptions: miscList,
      },
    }))
  },

  // Validates the player's answer against the case's correctness key, writes
  // a McdcVerdictResult so DebriefScreen renders unchanged, and returns true
  // on pass. Idempotent: calling twice with the same payload yields the same
  // result. Caller is responsible for navigating to debrief.
  submitAnswer: (payload) => {
    const { caseFile, setVerdict: writeVerdict } = get()
    if (!caseFile) return false

    const correct = evaluateAnswer(caseFile, payload)
    writeVerdict(
      {
        coverageAchieved: correct,
        coveragePercent: correct ? 100 : 0,
        conditionsCovered: [],
      },
      (caseFile.seeded_faults ?? []).map((f) => ({ id: f.id, detected: correct })),
      (caseFile.misconceptions ?? []).map((m) => ({
        id: m.id,
        triggered: !correct,
        explanation: m.explanation_md,
      })),
    )
    return correct
  },
    }),
    {
      name: 'iso29119-game-progress',
      storage: createJSONStorage(() => localStorage),
      // Persist only campaign-level progress. Transient per-run state
      // (caseFile, truthTable, submission, verdict, mcdc, screen, phase)
      // must be rehydrated fresh on each session.
      partialize: (state) => ({ completedCases: state.completedCases }),
      version: 1,
    },
  ),
)
