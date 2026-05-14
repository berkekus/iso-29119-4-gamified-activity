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
import { CASE_TO_LAW } from '../content/lawCards'
import { unlockedAchievementIds } from '../content/achievements'

// ── Case content registry — all 12 cases keyed by id ─────────────────────────
import stmtTutorial01      from '../content/cases/stmt-tutorial-01.json'
import stmtHiddenBranch01  from '../content/cases/stmt-hidden-branch-01.json'
import branchLoopTrap01    from '../content/cases/branch-loop-trap-01.json'
import decisionAndTrap01   from '../content/cases/decision-and-trap-01.json'
import bcOrThreeCond01     from '../content/cases/bc-or-three-cond-01.json'
import bcNegationMask01    from '../content/cases/bc-negation-mask-01.json'
import bccIntro01        from '../content/cases/bcc-intro-01.json'
import bccVsBc01         from '../content/cases/bcc-vs-bc-01.json'
import bccExplosion01    from '../content/cases/bcc-explosion-01.json'
import mcdcTutorial01      from '../content/cases/mcdc-tutorial-01.json'
import mcdcTrapIsolation01 from '../content/cases/mcdc-trap-isolation-01.json'
import mcdcVaultBoss01     from '../content/cases/mcdc-vault-boss-01.json'
import coverageMix01         from '../content/cases/coverage-mix-01.json'
import coverageMix02         from '../content/cases/coverage-mix-02.json'
import coverageMix03         from '../content/cases/coverage-mix-03.json'
const CASE_REGISTRY: Record<string, unknown> = {
  'stmt-tutorial-01':           stmtTutorial01,
  'stmt-hidden-branch-01':      stmtHiddenBranch01,
  'branch-loop-trap-01':        branchLoopTrap01,
  'decision-and-trap-01':       decisionAndTrap01,
  'bc-or-three-cond-01':        bcOrThreeCond01,
  'bc-negation-mask-01':        bcNegationMask01,
  'bcc-intro-01':               bccIntro01,
  'bcc-vs-bc-01':               bccVsBc01,
  'bcc-explosion-01':           bccExplosion01,
  'mcdc-tutorial-01':           mcdcTutorial01,
  'mcdc-trap-isolation-01':     mcdcTrapIsolation01,
  'mcdc-vault-boss-01':         mcdcVaultBoss01,
  'coverage-mix-01':            coverageMix01,
  'coverage-mix-02':            coverageMix02,
  'coverage-mix-03':            coverageMix03,
}

// ── Screen type — all navigable screens ──────────────────────────────────────

export type Screen =
  | 'menu'
  | 'how-to-play'
  | 'campaign'
  | 'play'
  | 'briefing'
  | 'investigation'
  | 'evidence'
  | 'trial'
  | 'debrief'
  | 'design-system'
  | 'multiplayer'
  | 'achievements'
  | 'law-library'
  // Speed Trial multiplayer screens
  | 'speed-trial-lobby'
  | 'speed-trial-host'
  | 'speed-trial-player'
  | 'speed-trial-winner'

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
  collectedLawCards: string[]
  unlockedAchievements: string[]
  /** Set on a passing submitAnswer when a new achievement was just unlocked
   *  by the case-completion side-effect. Read by DebriefScreen to show the
   *  one-line "🏆 Achievement unlocked" notice. Cleared on every load/reset. */
  newlyUnlockedAchievement: string | null
  /** Set when a dialogue_objection answer passes; index into dialogue_valid_sequences / dialogue_correct_explanations. Cleared on load/reset. */
  lastDialogueMatchIndex: number | null
  /** After a passing budget_strategy submit: whether the pick included a high-risk row (obstacle+speed). Cleared on load/reset. */
  lastBudgetStrategyIncludedHighRisk: boolean | null
  /** Vault boss evaluation result. Cleared on load/reset. */
  lastVaultEvaluation: { m_ok: boolean; k_ok: boolean; t_ok: boolean; all_ok: boolean } | null

  loadCase: (caseData: CaseFile) => void
  loadCaseById: (caseId: string) => void
  addSubmissionPair: (pair: IndependencePair) => void
  removePair: (row1: number, row2: number) => void
  submitForVerdict: () => void
  advancePhase: () => void
  resetGame: () => void
  markCaseCompleted: (caseId: string) => void
  resetMcdc: () => void
  clearNewlyUnlockedAchievement: () => void

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
  | { kind: 'dialogue_objection'; selectedFragments: string[] }
  | { kind: 'evidence_board'; connectedEvidence: [string, string] }
  | { kind: 'budget_strategy'; selectedRowIds: string[] }
  | { kind: 'mcdc_pair_builder'; selectedRowIds: string[] }

const PHASES: GamePhase[] = ['briefing', 'investigation', 'evidence', 'trial', 'debrief']

/** Index of the first matching valid dialogue sequence, or null. */
export function dialogueObjectionMatchIndex(caseData: CaseFile, selected: string[]): number | null {
  const multi = caseData.dialogue_valid_sequences
  if (multi && multi.length > 0) {
    for (let i = 0; i < multi.length; i++) {
      const seq = multi[i]
      if (!seq) continue
      if (seq.length === selected.length && seq.every((f, j) => f === selected[j])) return i
    }
    return null
  }
  const required = caseData.required_fragments ?? []
  if (required.length !== selected.length) return null
  if (!required.every((f, j) => f === selected[j])) return null
  return 0
}

/** Success copy for a correct dialogue_objection submission (per-path when configured). */
export function getDialogueObjectionSuccessExplanation(
  caseData: CaseFile,
  selectedFragments: string[],
): string | null {
  const idx = dialogueObjectionMatchIndex(caseData, selectedFragments)
  if (idx === null) return null
  const perPath = caseData.dialogue_correct_explanations?.[idx]
  if (perPath) return perPath
  return caseData.correct_answer_explanation ?? null
}

/**
 * For brake / budget cases: true if any selected row has obstacle ahead AND speed > 50
 * (internal condition keys `obstacle` and `spd50` on coverage_table rows).
 */
export function budgetSelectionIncludesHighRisk(caseData: CaseFile, selectedRowIds: string[]): boolean {
  const rows = caseData.coverage_table ?? []
  const byId = new Map(rows.map((r) => [r.id, r]))
  for (const id of selectedRowIds) {
    const row = byId.get(id)
    if (!row) continue
    const inp = row.inputs as Record<string, unknown>
    if (inp.obstacle === true && inp.spd50 === true) return true
  }
  return false
}

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
    case 'budget_strategy': {
      const expectedCount = caseData.required_pick_count ?? 0;
      return payload.selectedRowIds.length === expectedCount;
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
    case 'dialogue_objection': {
      return dialogueObjectionMatchIndex(caseData, payload.selectedFragments) !== null
    }
    case 'evidence_board': {
      const required = caseData.required_connection;
      if (!required) return false;
      const [r1, r2] = required;
      const [s1, s2] = payload.connectedEvidence;
      return (s1 === r1 && s2 === r2) || (s1 === r2 && s2 === r1);
    }
    case 'mcdc_pair_builder': {
      if (caseData.id === 'mcdc-vault-boss-01') {
        const result = computeVaultBossMcdc(caseData, payload.selectedRowIds)
        return result.all_ok
      }
      const rows = caseData.coverage_table ?? []
      const requiredRows = rows.filter((r) => r.required).map((r) => r.id)
      const selected = payload.selectedRowIds
      return (
        selected.length === requiredRows.length &&
        requiredRows.every((id) => selected.includes(id))
      )
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

export function computeVaultBossMcdc(caseData: CaseFile, selectedIds: string[]) {
  const rows = caseData.coverage_table ?? []
  const selectedRows = selectedIds.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as any[]
  
  if (selectedRows.length !== 4) return { m_ok: false, k_ok: false, t_ok: false, all_ok: false }

  const checkPair = (cond: 'M' | 'K' | 'T') => {
    for (let i = 0; i < selectedRows.length; i++) {
      for (let j = i + 1; j < selectedRows.length; j++) {
        const r1 = selectedRows[i]
        const r2 = selectedRows[j]
        
        if (r1.outcome !== r2.outcome) {
          if (r1.inputs[cond] !== r2.inputs[cond]) {
            const others = ['M', 'K', 'T'].filter((c) => c !== cond)
            const sameOthers = others.every((c) => r1.inputs[c] === r2.inputs[c])
            if (sameOthers) return true
          }
        }
      }
    }
    return false
  }

  const m_ok = checkPair('M')
  const k_ok = checkPair('K')
  const t_ok = checkPair('T')
  const all_ok = m_ok && k_ok && t_ok

  return { m_ok, k_ok, t_ok, all_ok }
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
  collectedLawCards: [],
  unlockedAchievements: [],
  newlyUnlockedAchievement: null,
  lastDialogueMatchIndex: null,
  lastBudgetStrategyIncludedHighRisk: null,
  lastVaultEvaluation: null,

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
      lastDialogueMatchIndex: null,
      lastBudgetStrategyIncludedHighRisk: null,
      lastVaultEvaluation: null,
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
      lastDialogueMatchIndex: null,
      lastBudgetStrategyIncludedHighRisk: null,
      lastVaultEvaluation: null,
    })
  },

  // Idempotent: a case id is added to completedCases at most once. On the
  // first add, also (a) push the case's mapped law-card id into
  // collectedLawCards if not already present, and (b) recompute
  // unlockedAchievements from the new completedCases set, recording the
  // *first* newly-unlocked achievement id in newlyUnlockedAchievement so
  // DebriefScreen can render its one-line notice. Callers
  // (currently DebriefScreen on a passing verdict) own the policy of when to
  // mark — this action simply records the fact.
  markCaseCompleted: (caseId) => {
    set((state) => {
      if (state.completedCases.includes(caseId)) return state
      const completedCases = [...state.completedCases, caseId]

      const lawId = CASE_TO_LAW[caseId]
      const collectedLawCards =
        lawId && !state.collectedLawCards.includes(lawId)
          ? [...state.collectedLawCards, lawId]
          : state.collectedLawCards

      const nextUnlocked = unlockedAchievementIds(completedCases)
      const prev = new Set(state.unlockedAchievements)
      const newlyUnlocked = nextUnlocked.find((id) => !prev.has(id)) ?? null

      return {
        completedCases,
        collectedLawCards,
        unlockedAchievements: nextUnlocked,
        newlyUnlockedAchievement: newlyUnlocked ?? state.newlyUnlockedAchievement,
      }
    })
  },

  clearNewlyUnlockedAchievement: () => {
    set({ newlyUnlockedAchievement: null })
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
      lastDialogueMatchIndex: null,
      lastBudgetStrategyIncludedHighRisk: null,
      lastVaultEvaluation: null,
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
    const dialogueIdx =
      correct && payload.kind === 'dialogue_objection'
        ? dialogueObjectionMatchIndex(caseFile, payload.selectedFragments)
        : null
    const lastBudgetHighRisk =
      payload.kind === 'budget_strategy'
        ? correct
          ? budgetSelectionIncludesHighRisk(caseFile, payload.selectedRowIds)
          : null
        : null
    const lastVaultEvaluation =
      caseFile.id === 'mcdc-vault-boss-01' && payload.kind === 'mcdc_pair_builder'
        ? computeVaultBossMcdc(caseFile, payload.selectedRowIds)
        : null

    let coveragePercent = correct ? 100 : 0
    let misconceptions = (caseFile.misconceptions ?? []).map((m) => ({
      id: m.id,
      triggered: !correct,
      explanation: m.explanation_md,
    }))

    if (lastVaultEvaluation && !lastVaultEvaluation.all_ok) {
      const okCount = [lastVaultEvaluation.m_ok, lastVaultEvaluation.k_ok, lastVaultEvaluation.t_ok].filter(Boolean).length;
      coveragePercent = Math.round((okCount / 3) * 100);
      
      misconceptions = []; // override default N+1 misconception with specifics
      
      if (okCount > 0) {
        misconceptions.push({
          id: "PARTIAL_MCDC",
          triggered: true,
          explanation: `You successfully proved independent effect for ${okCount} out of 3 conditions. However, the remaining conditions lack valid pairs. Remember: to prove independence for X, you must find two rows where ONLY X changes and the outcome flips.`,
        });
      } else {
        misconceptions.push({
          id: "NO_MCDC_ACHIEVED",
          triggered: true,
          explanation: `None of the selected rows form a valid independence pair. You either picked rows where the decision never flips, or where multiple inputs change simultaneously. Re-examine the truth table and find pairs that differ by EXACTLY one input.`,
        });
      }
    }

    writeVerdict(
      {
        coverageAchieved: correct,
        coveragePercent: coveragePercent,
        conditionsCovered: [],
      },
      (caseFile.seeded_faults ?? []).map((f) => ({ id: f.id, detected: correct })),
      misconceptions,
    )
    set({
      lastDialogueMatchIndex: dialogueIdx,
      lastBudgetStrategyIncludedHighRisk: lastBudgetHighRisk,
      lastVaultEvaluation: lastVaultEvaluation,
    })
    return correct
  },
    }),
    {
      name: 'iso29119-game-progress',
      storage: createJSONStorage(() => localStorage),
      // Persist only campaign-level progress. Transient per-run state
      // (caseFile, truthTable, submission, verdict, mcdc, screen, phase)
      // must be rehydrated fresh on each session.
      partialize: (state) => ({
        completedCases: state.completedCases,
        collectedLawCards: state.collectedLawCards,
        unlockedAchievements: state.unlockedAchievements,
      }),
      version: 1,
      // On rehydrate, recompute unlockedAchievements and backfill
      // collectedLawCards from completedCases. This lets older saves (which
      // only persisted completedCases) start showing achievements & laws
      // immediately, and self-heals if the mapping ever evolves.
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const lawIds = new Set(state.collectedLawCards ?? [])
        for (const caseId of state.completedCases) {
          const lawId = CASE_TO_LAW[caseId]
          if (lawId) lawIds.add(lawId)
        }
        state.collectedLawCards = Array.from(lawIds)
        state.unlockedAchievements = unlockedAchievementIds(state.completedCases)
        state.newlyUnlockedAchievement = null
      },
    },
  ),
)
