import { describe, test, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../src/stores/gameStore'

const ALL_CASE_IDS = [
  'stmt-tutorial-01',
  'stmt-hidden-branch-01',
  'branch-loop-trap-01',
  'decision-and-trap-01',
  'bc-or-three-cond-01',
  'bc-negation-mask-01',
  'bcc-three-and-01',
  'bcc-cost-intuition-01',
  'mcdc-tutorial-01',
  'mcdc-altitude-disengage-01',
  'mcdc-trap-isolation-01',
  'mcdc-vault-boss-01',
] as const

beforeEach(() => {
  useGameStore.getState().resetGame()
})

describe('loadCaseById — registered case JSONs', () => {
  test.each(ALL_CASE_IDS)('loadCaseById(%s) Zod parse + truthTable üretimi hata fırlatmaz', (id) => {
    expect(() => useGameStore.getState().loadCaseById(id)).not.toThrow()
    const { caseFile, truthTable, phase } = useGameStore.getState()
    expect(caseFile?.id).toBe(id)
    expect(phase).toBe('briefing')
    const expectedRows =
      caseFile && caseFile.scenario.conditions.length > 0 && caseFile.scenario.decision_expression.trim() !== ''
        ? Math.pow(2, caseFile.scenario.conditions.length)
        : 0
    expect(truthTable.length).toBe(expectedRows)
  })

  test('bilinmeyen case id açık hata fırlatır', () => {
    expect(() => useGameStore.getState().loadCaseById('nonexistent-case')).toThrow(/Unknown case id/)
  })
})
