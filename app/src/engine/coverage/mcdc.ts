import type { TruthTableRow, IndependencePair, McdcSubmission } from '../types'

function evaluateExpression(expr: string, values: Record<string, boolean>): boolean {
  let pos = 0

  const skipSpaces = () => {
    while (pos < expr.length && expr[pos] === ' ') pos++
  }

  const parseExpr = (): boolean => parseOr()

  const parseOr = (): boolean => {
    let left = parseAnd()
    skipSpaces()
    while (pos + 1 < expr.length && expr[pos] === '|' && expr[pos + 1] === '|') {
      pos += 2
      left = left || parseAnd()
      skipSpaces()
    }
    return left
  }

  const parseAnd = (): boolean => {
    let left = parseNot()
    skipSpaces()
    while (pos + 1 < expr.length && expr[pos] === '&' && expr[pos + 1] === '&') {
      pos += 2
      left = left && parseNot()
      skipSpaces()
    }
    return left
  }

  const parseNot = (): boolean => {
    skipSpaces()
    if (expr[pos] === '!') {
      pos++
      return !parsePrimary()
    }
    return parsePrimary()
  }

  const parsePrimary = (): boolean => {
    skipSpaces()
    if (expr[pos] === '(') {
      pos++
      const val = parseExpr()
      skipSpaces()
      pos++
      return val
    }
    let id = ''
    while (pos < expr.length && /\w/.test(expr[pos] ?? '')) {
      id += expr[pos] ?? ''
      pos++
    }
    if (!(id in values)) throw new Error(`Unknown identifier: ${id}`)
    return values[id] ?? false
  }

  return parseExpr()
}

export function generateTruthTable(
  conditions: Array<{ id: string; label: string }>,
  decisionExpression: string,
): TruthTableRow[] {
  const n = conditions.length
  if (n === 0 || decisionExpression.trim() === '') return []
  const rowCount = Math.pow(2, n)
  const rows: TruthTableRow[] = []

  for (let i = 0; i < rowCount; i++) {
    const values: Record<string, boolean> = {}
    conditions.forEach((cond, idx) => {
      values[cond.id] = Boolean((i >> (n - 1 - idx)) & 1)
    })
    const decision = evaluateExpression(decisionExpression, values)
    rows.push({ index: i, values, decision })
  }

  return rows
}

type CoverageResult = {
  coveredConditions: string[]
  uncoveredConditions: string[]
  coverageRatio: number
  validPairs: IndependencePair[]
  invalidPairs: IndependencePair[]
}

function _validateMcdcCoverageCore(
  submission: McdcSubmission,
  truthTable: TruthTableRow[],
  conditions: Array<{ id: string }>,
): CoverageResult {
  const conditionIds = conditions.map((c) => c.id)
  const coveredConditions = new Set<string>()
  const validPairs: IndependencePair[] = []
  const invalidPairs: IndependencePair[] = []

  for (const pair of submission) {
    const row1 = truthTable[pair.row1]
    const row2 = truthTable[pair.row2]

    if (!row1 || !row2) {
      invalidPairs.push(pair)
      continue
    }

    const changedConditions = conditionIds.filter((id) => row1.values[id] !== row2.values[id])
    const decisionFlipped = row1.decision !== row2.decision

    if (changedConditions.length === 1 && decisionFlipped) {
      validPairs.push(pair)
      coveredConditions.add(changedConditions[0]!)
    } else {
      invalidPairs.push(pair)
    }
  }

  const covered = [...coveredConditions]
  const uncovered = conditionIds.filter((id) => !coveredConditions.has(id))

  return {
    coveredConditions: covered,
    uncoveredConditions: uncovered,
    coverageRatio: conditionIds.length > 0 ? covered.length / conditionIds.length : 0,
    validPairs,
    invalidPairs,
  }
}

// ── B-UI compat exports ──────────────────────────────────────────────────────

export type McRow = { id: number; A: boolean; B: boolean; C: boolean; D: boolean }

const _altConds = [
  { id: 'A', label: 'verticalSpeed > LIMIT' },
  { id: 'B', label: 'autopilotEngaged' },
  { id: 'C', label: 'pilotOverride' },
]

export const TRUTH_TABLE: McRow[] = generateTruthTable(_altConds, 'A && (B || C)').map((row) => ({
  id: row.index,
  A: row.values['A'] ?? false,
  B: row.values['B'] ?? false,
  C: row.values['C'] ?? false,
  D: row.decision,
}))

export function isValidIndependencePair(
  row1Id: number,
  row2Id: number,
  condition: string,
): boolean {
  const row1 = TRUTH_TABLE.find((r) => r.id === row1Id)
  const row2 = TRUTH_TABLE.find((r) => r.id === row2Id)
  if (!row1 || !row2) return false

  const condKeys = ['A', 'B', 'C'] as const
  const changed = condKeys.filter((c) => row1[c] !== row2[c])
  const decisionFlipped = row1.D !== row2.D

  return changed.length === 1 && changed[0] === condition && decisionFlipped
}

type McdcBPair = { condition: string; row1: number; row2: number }
type BCoverageResult = {
  coverageAchieved: boolean
  coveragePercent: number
  conditionsCovered: string[]
}

export function validateMcdcCoverage(
  input: { selectedRows: number[]; independencePairs: McdcBPair[] },
): BCoverageResult
export function validateMcdcCoverage(
  submission: McdcSubmission,
  truthTable: TruthTableRow[],
  conditions: Array<{ id: string }>,
): CoverageResult
export function validateMcdcCoverage(
  submissionOrInput: McdcSubmission | { selectedRows: number[]; independencePairs: McdcBPair[] },
  truthTable?: TruthTableRow[],
  conditions?: Array<{ id: string }>,
): CoverageResult | BCoverageResult {
  if (!Array.isArray(submissionOrInput)) {
    const { independencePairs } = submissionOrInput
    const allConditions = ['A', 'B', 'C']
    const covered = new Set<string>()

    for (const pair of independencePairs) {
      if (isValidIndependencePair(pair.row1, pair.row2, pair.condition)) {
        covered.add(pair.condition)
      }
    }

    const conditionsCovered = [...covered]
    return {
      coverageAchieved: conditionsCovered.length === allConditions.length,
      coveragePercent: Math.round((conditionsCovered.length / allConditions.length) * 100),
      conditionsCovered,
    }
  }

  return _validateMcdcCoverageCore(submissionOrInput, truthTable!, conditions!)
}
