import { create } from 'zustand'
import type { CaseFile } from '../engine/caseLoader'
import type {
  TruthTableRow,
  IndependencePair,
  McdcSubmission,
  VerdictResult,
  GamePhase,
} from '../engine/types'
import { generateTruthTable } from '../engine/coverage/mcdc'
import { computeVerdict } from '../engine/verdict/index'

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
  addSubmissionPair: (pair: IndependencePair) => void
  removePair: (row1: number, row2: number) => void
  submitForVerdict: () => void
  advancePhase: () => void
  resetGame: () => void
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
}

const PHASES: GamePhase[] = ['briefing', 'investigation', 'evidence', 'trial', 'debrief']

const initialMcdc: McdcState = {
  selectedRows: [],
  independencePairs: [],
  verdictResult: null,
  faultResults: [],
  misconceptions: [],
}

export const useGameStore = create<GameState>((set, get) => ({
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

  resetMcdc: () => {
    set({ mcdc: initialMcdc })
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
}))
