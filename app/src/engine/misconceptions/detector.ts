import type { McdcSubmission, TruthTableRow } from '../types'
import { TRUTH_TABLE } from '../coverage/mcdc'
import altitudeCase from '../../content/cases/mcdc-altitude-disengage-01.json'

type BMisconception = { id: string; triggered: boolean; explanation: string }
type BInput = { selectedRows: number[]; independencePairs: Array<{ condition: string; row1: number; row2: number }> }

export function detectMisconceptions(input: BInput): BMisconception[]
export function detectMisconceptions(
  submission: McdcSubmission,
  truthTable: TruthTableRow[],
): string[]
export function detectMisconceptions(
  submissionOrInput: McdcSubmission | BInput,
  truthTable?: TruthTableRow[],
): string[] | BMisconception[] {
  if (!Array.isArray(submissionOrInput)) {
    const { independencePairs } = submissionOrInput
    const submission: McdcSubmission = independencePairs.map((p) => ({ row1: p.row1, row2: p.row2 }))
    const tableForCore: TruthTableRow[] = TRUTH_TABLE.map((r) => ({
      index: r.id,
      values: { A: r.A, B: r.B, C: r.C },
      decision: r.D,
    }))
    const triggeredIds = _detectMisconceptionsCore(submission, tableForCore)
    return altitudeCase.misconceptions.map((m) => ({
      id: m.id,
      triggered: triggeredIds.includes(m.id),
      explanation: m.explanation_md,
    }))
  }
  return _detectMisconceptionsCore(submissionOrInput, truthTable!)
}

function _detectMisconceptionsCore(
  submission: McdcSubmission,
  truthTable: TruthTableRow[],
): string[] {
  const triggered: string[] = []

  const hasIsolationPattern = submission.some((pair) => {
    const row1 = truthTable[pair.row1]
    const row2 = truthTable[pair.row2]
    if (!row1 || !row2) return false

    const changedCount = Object.keys(row1.values).filter(
      (id) => row1.values[id] !== row2.values[id],
    ).length
    const decisionFlipped = row1.decision !== row2.decision

    return changedCount !== 1 || !decisionFlipped
  })

  if (hasIsolationPattern) triggered.push('MCDC-INDEP-AS-ISOLATION')

  const pairKeys = submission.map((p) =>
    [Math.min(p.row1, p.row2), Math.max(p.row1, p.row2)].join('-'),
  )
  const hasDuplicate = pairKeys.length !== new Set(pairKeys).size

  if (hasDuplicate) triggered.push('MCDC-DUPLICATE-PAIR')

  return triggered
}
