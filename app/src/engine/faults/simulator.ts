import type { McdcSubmission, TruthTableRow } from '../types'
import type { CaseFile } from '../caseLoader'
import { TRUTH_TABLE } from '../coverage/mcdc'
import altitudeCase from '../../content/cases/mcdc-altitude-disengage-01.json'

type FaultSimulationResult = {
  detected: string[]
  missed: string[]
}

type BFaultResult = Array<{ id: string; detected: boolean }>
type BInput = { selectedRows: number[]; independencePairs: Array<{ condition: string; row1: number; row2: number }> }

export function simulateFaults(input: BInput): BFaultResult
export function simulateFaults(
  submission: McdcSubmission,
  truthTable: TruthTableRow[],
  caseFile: CaseFile,
): FaultSimulationResult
export function simulateFaults(
  submissionOrInput: McdcSubmission | BInput,
  truthTable?: TruthTableRow[],
  caseFile?: CaseFile,
): FaultSimulationResult | BFaultResult {
  if (!Array.isArray(submissionOrInput)) {
    const { independencePairs } = submissionOrInput
    return altitudeCase.seeded_faults.map((fault) => {
      const detected = independencePairs.some((pair) => {
        if (pair.condition !== fault.trigger.condition) return false
        const row1 = TRUTH_TABLE.find((r) => r.id === pair.row1)
        const row2 = TRUTH_TABLE.find((r) => r.id === pair.row2)
        if (!row1 || !row2) return false
        const decisionFlipped = row1.D !== row2.D
        return !fault.trigger.requiredDecisionFlip || decisionFlipped
      })
      return { id: fault.id, detected }
    })
  }
  return _simulateFaultsCore(submissionOrInput, truthTable!, caseFile!)
}

function _simulateFaultsCore(
  submission: McdcSubmission,
  truthTable: TruthTableRow[],
  caseFile: CaseFile,
): FaultSimulationResult {
  const detected: string[] = []
  const missed: string[] = []
  const conditionIds = caseFile.scenario.conditions.map((c) => c.id)

  for (const fault of caseFile.seeded_faults) {
    const { condition, requiredDecisionFlip } = fault.trigger

    const faultCaught = submission.some((pair) => {
      const row1 = truthTable[pair.row1]
      const row2 = truthTable[pair.row2]
      if (!row1 || !row2) return false

      const changedConditions = conditionIds.filter((id) => row1.values[id] !== row2.values[id])
      const testsTargetCondition =
        changedConditions.length === 1 && changedConditions[0] === condition
      const decisionFlipped = row1.decision !== row2.decision

      return testsTargetCondition && (!requiredDecisionFlip || decisionFlipped)
    })

    if (faultCaught) {
      detected.push(fault.id)
    } else {
      missed.push(fault.id)
    }
  }

  return { detected, missed }
}
