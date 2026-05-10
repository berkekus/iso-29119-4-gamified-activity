import { describe, test, expect, beforeEach } from 'vitest'
import { useGameStore, evaluateAnswer } from '../../src/stores/gameStore'
import { loadCase } from '../../src/engine/caseLoader'

import stmtTutorial from '../../src/content/cases/stmt-tutorial-01.json'
import branchLoopTrap from '../../src/content/cases/branch-loop-trap-01.json'
import bcOrThreeCond from '../../src/content/cases/bc-or-three-cond-01.json'
import bccVsBc from '../../src/content/cases/bcc-vs-bc-01.json'
import mcdcVaultBoss from '../../src/content/cases/mcdc-vault-boss-01.json'
import mcdcShowdown from '../../src/content/cases/mcdc-showdown-01.json'
import bccExplosion from '../../src/content/cases/bcc-explosion-01.json'

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

  test('evidence_board: required pair passes; wrong pair fails (bcc-vs-bc-01)', () => {
    const c = loadCase(bccVsBc)
    useGameStore.getState().loadCase(c)
    const required = (c.required_connection ?? []) as readonly string[]
    expect(required.length).toBe(2)

    expect(
      useGameStore.getState().submitAnswer({
        kind: 'evidence_board',
        connectedEvidence: [required[0]!, required[1]!],
      }),
    ).toBe(true)

    expect(
      useGameStore.getState().submitAnswer({
        kind: 'evidence_board',
        connectedEvidence: [required[0]!, 't1_age'],
      }),
    ).toBe(false)
  })

  test('budget_strategy: any 3-row pick passes (bcc-explosion-01)', () => {
    const c = loadCase(bccExplosion)
    useGameStore.getState().loadCase(c)
    const allRows = (c.coverage_table ?? []).map((r) => r.id)
    const threeRows = allRows.slice(0, 3)

    expect(
      useGameStore.getState().submitAnswer({ kind: 'budget_strategy', selectedRowIds: threeRows }),
    ).toBe(true)

    // Two rows — under budget cap.
    expect(
      useGameStore.getState().submitAnswer({
        kind: 'budget_strategy',
        selectedRowIds: threeRows.slice(0, 2),
      }),
    ).toBe(false)
  })

  test('mcdc_pair_builder: canonical 4-row set passes (vault-boss); wrong row fails', () => {
    const c = loadCase(mcdcVaultBoss)
    useGameStore.getState().loadCase(c)
    const required = (c.coverage_table ?? []).filter((r) => r.required).map((r) => r.id)
    expect(required.length).toBe(4)

    expect(
      useGameStore.getState().submitAnswer({ kind: 'mcdc_pair_builder', selectedRowIds: required }),
    ).toBe(true)

    // Wrong row swapped in.
    expect(
      useGameStore.getState().submitAnswer({
        kind: 'mcdc_pair_builder',
        selectedRowIds: [required[0]!, required[1]!, required[2]!, 'R6'],
      }),
    ).toBe(false)
  })

  test('mcdc_pair_builder: showdown 5-row canonical set passes', () => {
    const c = loadCase(mcdcShowdown)
    useGameStore.getState().loadCase(c)
    const required = (c.coverage_table ?? []).filter((r) => r.required).map((r) => r.id)
    expect(required.length).toBe(5)

    expect(
      useGameStore.getState().submitAnswer({ kind: 'mcdc_pair_builder', selectedRowIds: required }),
    ).toBe(true)
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
