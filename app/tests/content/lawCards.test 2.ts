import { describe, test, expect } from 'vitest'
import { LAW_CARDS, CASE_TO_LAW, lawCardForCase } from '../../src/content/lawCards'
import { CASE_ORDER } from '../../src/content/caseOrder'

describe('Law Cards content', () => {
  test('exactly 6 law cards exist', () => {
    expect(LAW_CARDS.length).toBe(6)
  })

  test('every law card carries the required fields', () => {
    for (const c of LAW_CARDS) {
      expect(c.id).toMatch(/^law-/)
      expect(c.title.length).toBeGreaterThan(0)
      expect(c.iso_clause).toMatch(/^§5\.3\./)
      expect(c.short_definition.length).toBeGreaterThan(20)
      expect(c.long_description.length).toBeGreaterThan(40)
      expect(c.pitfall.length).toBeGreaterThan(10)
      expect(c.example_note.length).toBeGreaterThan(10)
    }
  })

  test('one law card per technique (STATEMENT/BRANCH/DECISION/BC/BCC/MCDC)', () => {
    const techs = LAW_CARDS.map((c) => c.technique).sort()
    expect(techs).toEqual(['BC', 'BCC', 'BRANCH', 'DECISION', 'MCDC', 'STATEMENT'])
  })

  test('every campaign case maps to a real law card', () => {
    for (const caseId of CASE_ORDER) {
      const card = lawCardForCase(caseId)
      expect(card, `no law card for ${caseId}`).not.toBeNull()
      expect(LAW_CARDS.some((c) => c.id === CASE_TO_LAW[caseId])).toBe(true)
    }
  })

  test('the 6 spec-mandated mappings are correct', () => {
    expect(CASE_TO_LAW['stmt-tutorial-01']).toBe('law-statement')
    expect(CASE_TO_LAW['stmt-hidden-branch-01']).toBe('law-branch')
    expect(CASE_TO_LAW['branch-loop-trap-01']).toBe('law-branch')
    expect(CASE_TO_LAW['decision-and-trap-01']).toBe('law-decision')
    expect(CASE_TO_LAW['bc-or-three-cond-01']).toBe('law-bc')
    expect(CASE_TO_LAW['bc-negation-mask-01']).toBe('law-bc')
    expect(CASE_TO_LAW['bcc-intro-01']).toBe('law-bcc')
    expect(CASE_TO_LAW['bcc-vs-bc-01']).toBe('law-bcc')
    expect(CASE_TO_LAW['bcc-explosion-01']).toBe('law-bcc')
    expect(CASE_TO_LAW['mcdc-tutorial-01']).toBe('law-mcdc')
    expect(CASE_TO_LAW['mcdc-trap-isolation-01']).toBe('law-mcdc')
    expect(CASE_TO_LAW['mcdc-vault-boss-01']).toBe('law-mcdc')
    expect(CASE_TO_LAW['mcdc-showdown-01']).toBe('law-mcdc')
  })
})
