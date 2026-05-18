import { describe, test, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../src/stores/gameStore'
import { CASE_ORDER } from '../../src/content/caseOrder'

const ALL_CASE_IDS = CASE_ORDER

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
