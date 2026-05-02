import { describe, test, expect } from 'vitest'
import { CaseFileSchema, loadCase } from '../src/engine/caseLoader'
import validCaseJson from '../src/content/cases/mcdc-altitude-disengage-01.json'
import stmtTutorialJson from '../src/content/cases/stmt-tutorial-01.json'
import stmtHiddenBranchJson from '../src/content/cases/stmt-hidden-branch-01.json'
import branchLoopTrapJson from '../src/content/cases/branch-loop-trap-01.json'
import mcdcTutorialJson from '../src/content/cases/mcdc-tutorial-01.json'
import mcdcTrapIsolationJson from '../src/content/cases/mcdc-trap-isolation-01.json'

const validCase = validCaseJson as Record<string, unknown>

describe('CaseFile schema', () => {
  test('geçerli MCDC case dosyasını parse eder', () => {
    expect(() => loadCase(validCase)).not.toThrow()
  })

  test('eksik zorunlu alan reddedilir', () => {
    const { act: _act, ...withoutAct } = validCase
    const result = CaseFileSchema.safeParse(withoutAct)
    expect(result.success).toBe(false)
  })

  test('geçersiz act enum değeri reddedilir', () => {
    const result = CaseFileSchema.safeParse({ ...validCase, act: 'Unknown' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const actIssue = result.error.issues.find((i) => i.path.includes('act'))
      expect(actIssue).toBeDefined()
    }
  })

  test('seeded_fault trigger alanı zorunludur', () => {
    const faultWithoutTrigger = {
      ...validCase,
      seeded_faults: [{ id: 'F1', description: 'test' }],
    }
    const result = CaseFileSchema.safeParse(faultWithoutTrigger)
    expect(result.success).toBe(false)
  })

  test('Layer 1 Statement & Branch case dosyalarını parse eder', () => {
    expect(() => loadCase(stmtTutorialJson)).not.toThrow()
    expect(() => loadCase(stmtHiddenBranchJson)).not.toThrow()
    expect(() => loadCase(branchLoopTrapJson)).not.toThrow()
  })

  test('zenginleştirilmiş MCDC case dosyaları hala parse edilir', () => {
    expect(() => loadCase(mcdcTutorialJson)).not.toThrow()
    expect(() => loadCase(mcdcTrapIsolationJson)).not.toThrow()
  })
})
