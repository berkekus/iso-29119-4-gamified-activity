import { describe, test, expect, beforeEach } from 'vitest'
import { useGameStore, evaluateAnswer } from '../../src/stores/gameStore'
import { loadCase } from '../../src/engine/caseLoader'

import stmtTutorial from '../../src/content/cases/stmt-tutorial-01.json'
import branchLoopTrap from '../../src/content/cases/branch-loop-trap-01.json'
import bcOrThreeCond from '../../src/content/cases/bc-or-three-cond-01.json'
import bccCostIntuition from '../../src/content/cases/bcc-cost-intuition-01.json'
import mcdcVaultBoss from '../../src/content/cases/mcdc-vault-boss-01.json'

beforeEach(() => {
  useGameStore.getState().resetGame()
  // Persisted state can leak across tests via localStorage in jsdom; clear it.
  useGameStore.setState({ completedCases: [] })
})

describe('submitAnswer + evaluateAnswer — correct answers mark the case complete', () => {
  test('binary_verdict: correct option passes', () => {
    const c = loadCase(stmtTutorial)
    useGameStore.getState().loadCase(c)
    const correctOpt = (c.options ?? []).find((o) => o.is_correct)!
    const passed = useGameStore.getState().submitAnswer({
      kind: 'binary_verdict',
      optionId: correctOpt.id,
    })
    expect(passed).toBe(true)
    // markCaseCompleted is called by the Debrief screen, but submitAnswer
    // wires verdictResult.coverageAchieved → true so isGuilty resolves true.
    expect(useGameStore.getState().mcdc.verdictResult?.coverageAchieved).toBe(true)
  })

  test('binary_verdict: wrong option fails (no completion recorded)', () => {
    const c = loadCase(stmtTutorial)
    useGameStore.getState().loadCase(c)
    const wrongOpt = (c.options ?? []).find((o) => !o.is_correct)!
    const passed = useGameStore.getState().submitAnswer({
      kind: 'binary_verdict',
      optionId: wrongOpt.id,
    })
    expect(passed).toBe(false)
    expect(useGameStore.getState().completedCases).not.toContain(c.id)
  })

  test('level_picker: correct option passes (branch-loop-trap)', () => {
    const c = loadCase(branchLoopTrap)
    useGameStore.getState().loadCase(c)
    const correctOpt = (c.options ?? []).find((o) => o.is_correct)!
    const passed = useGameStore.getState().submitAnswer({
      kind: 'level_picker',
      optionId: correctOpt.id,
    })
    expect(passed).toBe(true)
  })

  test('coverage_table: includes-all-required passes; missing-required fails', () => {
    const c = loadCase(bcOrThreeCond)
    useGameStore.getState().loadCase(c)
    const required = (c.coverage_table ?? []).filter((r) => r.required).map((r) => r.id)

    expect(
      useGameStore.getState().submitAnswer({ kind: 'coverage_table', selectedRowIds: required }),
    ).toBe(true)

    expect(
      useGameStore
        .getState()
        .submitAnswer({ kind: 'coverage_table', selectedRowIds: required.slice(1) }),
    ).toBe(false)
  })

  test('numeric_input: exact answers pass; off-by-one fails', () => {
    const c = loadCase(bccCostIntuition)
    useGameStore.getState().loadCase(c)
    const correct = (c.numeric_prompts ?? []).map((p) => p.answer)

    expect(
      useGameStore.getState().submitAnswer({ kind: 'numeric_input', answers: correct }),
    ).toBe(true)

    expect(
      useGameStore.getState().submitAnswer({
        kind: 'numeric_input',
        answers: correct.map((n, i) => (i === 0 ? n + 1 : n)),
      }),
    ).toBe(false)
  })

  test('test_designer: canonical 5-row set passes; 6 rows or wrong rows fail', () => {
    const c = loadCase(mcdcVaultBoss)
    useGameStore.getState().loadCase(c)
    const required = (c.coverage_table ?? []).filter((r) => r.required).map((r) => r.id)
    expect(required.length).toBe(5)

    expect(
      useGameStore.getState().submitAnswer({ kind: 'test_designer', selectedRowIds: required }),
    ).toBe(true)

    // Six rows — too many.
    expect(
      useGameStore.getState().submitAnswer({
        kind: 'test_designer',
        selectedRowIds: [...required, 'R6'],
      }),
    ).toBe(false)

    // Five rows but with R6 swapped in for R2 — wrong canonical set.
    expect(
      useGameStore.getState().submitAnswer({
        kind: 'test_designer',
        selectedRowIds: [required[0]!, 'R6', required[2]!, required[3]!, required[4]!],
      }),
    ).toBe(false)
  })
})

describe('evaluateAnswer pure function — direct correctness check', () => {
  test('rejects unknown option id as not correct', () => {
    const c = loadCase(branchLoopTrap)
    expect(evaluateAnswer(c, { kind: 'level_picker', optionId: 'opt-does-not-exist' })).toBe(false)
  })

  test('rejects coverage_table selections that contain unknown row ids', () => {
    const c = loadCase(bcOrThreeCond)
    const required = (c.coverage_table ?? []).filter((r) => r.required).map((r) => r.id)
    expect(
      evaluateAnswer(c, { kind: 'coverage_table', selectedRowIds: [...required, 'BOGUS'] }),
    ).toBe(false)
  })
})
