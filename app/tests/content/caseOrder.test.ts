import { describe, test, expect, beforeEach } from 'vitest'
import { CASE_ORDER, nextCaseId } from '../../src/content/caseOrder'
import { useGameStore } from '../../src/stores/gameStore'

beforeEach(() => {
  useGameStore.getState().resetGame()
  useGameStore.setState({ completedCases: [] })
})

describe('CASE_ORDER', () => {
  test('lists all 12 cases in canonical play order', () => {
    expect(CASE_ORDER).toEqual([
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
    ])
  })
})

describe('nextCaseId', () => {
  test('returns the next case id for stmt-tutorial-01', () => {
    expect(nextCaseId('stmt-tutorial-01')).toBe('stmt-hidden-branch-01')
  })

  test('returns null for the final boss (last case)', () => {
    expect(nextCaseId('mcdc-vault-boss-01')).toBeNull()
  })

  test('returns null for unknown ids', () => {
    expect(nextCaseId('does-not-exist')).toBeNull()
  })

  test('returns null for nullish input', () => {
    expect(nextCaseId(null)).toBeNull()
    expect(nextCaseId(undefined)).toBeNull()
  })

  test('walks the full chain end-to-end', () => {
    let cur: string | null = CASE_ORDER[0]!
    const visited: string[] = [cur]
    while (cur) {
      const next: string | null = nextCaseId(cur)
      if (!next) break
      visited.push(next)
      cur = next
    }
    expect(visited).toEqual([...CASE_ORDER])
  })
})

describe('gameStore.markCaseCompleted', () => {
  test('records the case id once (idempotent)', () => {
    const { markCaseCompleted } = useGameStore.getState()
    markCaseCompleted('stmt-tutorial-01')
    markCaseCompleted('stmt-tutorial-01')
    markCaseCompleted('bc-or-three-cond-01')
    expect(useGameStore.getState().completedCases).toEqual([
      'stmt-tutorial-01',
      'bc-or-three-cond-01',
    ])
  })

  test('a passing verdict adds the case to completedCases; a MISTRIAL does not', () => {
    // Policy: DebriefScreen calls markCaseCompleted(caseId) only when isGuilty
    // (coverageAchieved && all faults detected). MISTRIAL never marks. The
    // store itself is policy-free — this test asserts the rule by exercising
    // markCaseCompleted only in the passing branch, mirroring the screen.
    const store = useGameStore.getState()

    const passingCaseId = 'stmt-tutorial-01'
    const failingCaseId = 'stmt-hidden-branch-01'

    const simulateDebrief = (caseId: string, isGuilty: boolean) => {
      if (isGuilty) store.markCaseCompleted(caseId)
    }

    simulateDebrief(passingCaseId, true)
    simulateDebrief(failingCaseId, false)

    const completed = useGameStore.getState().completedCases
    expect(completed).toContain(passingCaseId)
    expect(completed).not.toContain(failingCaseId)
  })
})

describe('gameStore.resetMcdc', () => {
  test('clears per-case run state but preserves completedCases and caseFile', () => {
    const store = useGameStore.getState()
    store.loadCaseById('stmt-tutorial-01')
    store.markCaseCompleted('stmt-tutorial-01')
    store.addPair({ condition: 'A', row1: 1, row2: 2 })

    store.resetMcdc()

    const after = useGameStore.getState()
    expect(after.completedCases).toEqual(['stmt-tutorial-01'])
    expect(after.caseFile?.id).toBe('stmt-tutorial-01')
    expect(after.mcdc.independencePairs).toEqual([])
    expect(after.phase).toBe('briefing')
  })
})
