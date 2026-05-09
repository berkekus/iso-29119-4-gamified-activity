import { describe, test, expect } from 'vitest'
import { loadCase, type CaseFile } from '../../src/engine/caseLoader'
import { CASE_ORDER } from '../../src/content/caseOrder'

import stmtTutorial from '../../src/content/cases/stmt-tutorial-01.json'
import stmtHiddenBranch from '../../src/content/cases/stmt-hidden-branch-01.json'
import branchLoopTrap from '../../src/content/cases/branch-loop-trap-01.json'
import decisionAndTrap from '../../src/content/cases/decision-and-trap-01.json'
import bcOrThreeCond from '../../src/content/cases/bc-or-three-cond-01.json'
import bcNegationMask from '../../src/content/cases/bc-negation-mask-01.json'
import bccThreeAnd from '../../src/content/cases/bcc-three-and-01.json'
import bccCostIntuition from '../../src/content/cases/bcc-cost-intuition-01.json'
import mcdcTutorial from '../../src/content/cases/mcdc-tutorial-01.json'
import mcdcAltitude from '../../src/content/cases/mcdc-altitude-disengage-01.json'
import mcdcTrapIso from '../../src/content/cases/mcdc-trap-isolation-01.json'
import mcdcVaultBoss from '../../src/content/cases/mcdc-vault-boss-01.json'

const ALL: Record<string, unknown> = {
  'stmt-tutorial-01': stmtTutorial,
  'stmt-hidden-branch-01': stmtHiddenBranch,
  'branch-loop-trap-01': branchLoopTrap,
  'decision-and-trap-01': decisionAndTrap,
  'bc-or-three-cond-01': bcOrThreeCond,
  'bc-negation-mask-01': bcNegationMask,
  'bcc-three-and-01': bccThreeAnd,
  'bcc-cost-intuition-01': bccCostIntuition,
  'mcdc-tutorial-01': mcdcTutorial,
  'mcdc-altitude-disengage-01': mcdcAltitude,
  'mcdc-trap-isolation-01': mcdcTrapIso,
  'mcdc-vault-boss-01': mcdcVaultBoss,
}

describe('case correctness data is parseable for every campaign case', () => {
  test('CASE_ORDER and ALL agree on the 12 cases', () => {
    expect(CASE_ORDER.length).toBe(12)
    for (const id of CASE_ORDER) expect(ALL[id]).toBeDefined()
  })

  for (const [id, raw] of Object.entries(ALL)) {
    test(`${id} parses + carries the correctness key for its question_type`, () => {
      let parsed: CaseFile | null = null
      expect(() => {
        parsed = loadCase(raw)
      }).not.toThrow()
      expect(parsed).not.toBeNull()
      const c = parsed as unknown as CaseFile
      const q = c.question_type ?? 'pair_selector'

      switch (q) {
        case 'binary_verdict':
        case 'level_picker': {
          const opts = c.options ?? []
          expect(opts.length).toBeGreaterThanOrEqual(2)
          expect(opts.some((o) => o.is_correct)).toBe(true)
          break
        }
        case 'coverage_table': {
          const rows = c.coverage_table ?? []
          expect(rows.length).toBeGreaterThan(0)
          expect(rows.some((r) => r.required)).toBe(true)
          break
        }
        case 'numeric_input': {
          const prompts = c.numeric_prompts ?? []
          expect(prompts.length).toBeGreaterThan(0)
          for (const p of prompts) expect(typeof p.answer).toBe('number')
          break
        }
        case 'test_designer': {
          const rows = c.coverage_table ?? []
          expect(rows.length).toBeGreaterThanOrEqual(8)
          expect(rows.some((r) => r.required)).toBe(true)
          expect(c.required_pick_count ?? 0).toBeGreaterThan(0)
          break
        }
        case 'pair_selector': {
          // Existing MC/DC pair-selector flow consumes scenario.conditions
          // and decision_expression — those are required by the schema, so
          // this branch passes without extra checks.
          expect(c.scenario.conditions.length).toBeGreaterThan(0)
          expect(c.scenario.decision_expression.length).toBeGreaterThan(0)
          break
        }
      }
    })
  }
})
