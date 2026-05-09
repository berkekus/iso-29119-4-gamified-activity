import { describe, test, expect } from 'vitest'
import {
  TRUTH_TABLE,
  isValidIndependencePair,
  validateMcdcCoverage,
} from '../../src/engine/coverage/mcdc'
import { simulateFaults } from '../../src/engine/faults/simulator'
import { detectMisconceptions } from '../../src/engine/misconceptions/detector'

// A && (B || C) truth table:
// id=0: A=F B=F C=F → D=F
// id=1: A=F B=F C=T → D=F
// id=2: A=F B=T C=F → D=F
// id=3: A=F B=T C=T → D=F
// id=4: A=T B=F C=F → D=F
// id=5: A=T B=F C=T → D=T
// id=6: A=T B=T C=F → D=T
// id=7: A=T B=T C=T → D=T

describe('TRUTH_TABLE', () => {
  test('8 satır üretir (3 koşul → 2^3)', () => {
    expect(TRUTH_TABLE).toHaveLength(8)
  })

  test('her satırda id, A, B, C, D alanları var', () => {
    for (const row of TRUTH_TABLE) {
      expect(typeof row.id).toBe('number')
      expect(typeof row.A).toBe('boolean')
      expect(typeof row.B).toBe('boolean')
      expect(typeof row.C).toBe('boolean')
      expect(typeof row.D).toBe('boolean')
    }
  })

  test('id=4 A=T B=F C=F D=F, id=5 A=T B=F C=T D=T', () => {
    expect(TRUTH_TABLE[4]).toMatchObject({ id: 4, A: true, B: false, C: false, D: false })
    expect(TRUTH_TABLE[5]).toMatchObject({ id: 5, A: true, B: false, C: true, D: true })
  })
})

describe('isValidIndependencePair', () => {
  test('geçerli C pair: row4↔row5 (C flips, A/B fixed, D flips) → true', () => {
    // row4: A=T B=F C=F D=F | row5: A=T B=F C=T D=T → C changes, D flips
    expect(isValidIndependencePair(4, 5, 'C')).toBe(true)
  })

  test('geçerli A pair: row4↔row6 (A changes? No — row4 A=T, row6 A=T — use row0↔row6)', () => {
    // row0: A=F B=T? No. Let me find a valid A pair.
    // A changes from F→T, others fixed, D flips:
    // row2: A=F B=T C=F D=F | row6: A=T B=T C=F D=T → A flips, D flips
    expect(isValidIndependencePair(2, 6, 'A')).toBe(true)
  })

  test('iki koşul değişen pair → false', () => {
    // row0: A=F B=F C=F D=F | row7: A=T B=T C=T D=T → A,B,C all change
    expect(isValidIndependencePair(0, 7, 'A')).toBe(false)
  })

  test('decision değişmeyen pair → false', () => {
    // row0: A=F B=F C=F D=F | row1: A=F B=F C=T D=F → only C changes, but D stays F
    expect(isValidIndependencePair(0, 1, 'C')).toBe(false)
  })

  test('koşul eşleşmiyorsa → false', () => {
    // row4↔row5 C changes — asking for 'A' should be false
    expect(isValidIndependencePair(4, 5, 'A')).toBe(false)
  })
})

describe('validateMcdcCoverage — B signature', () => {
  const fullPairs = [
    { condition: 'A', row1: 2, row2: 6 }, // A flips, B=T C=F fixed, D flips
    { condition: 'B', row1: 4, row2: 6 }, // B flips (F→T), A=T C=F fixed, D flips
    { condition: 'C', row1: 4, row2: 5 }, // C flips (F→T), A=T B=F fixed, D flips
  ]

  test('tam coverage → coverageAchieved: true, coveragePercent: 100', () => {
    const result = validateMcdcCoverage({ selectedRows: [2, 4, 5, 6], independencePairs: fullPairs })
    expect(result.coverageAchieved).toBe(true)
    expect(result.coveragePercent).toBe(100)
    expect(result.conditionsCovered).toContain('A')
    expect(result.conditionsCovered).toContain('B')
    expect(result.conditionsCovered).toContain('C')
  })

  test('eksik pair → coverageAchieved: false', () => {
    const partial = [{ condition: 'A', row1: 2, row2: 6 }]
    const result = validateMcdcCoverage({ selectedRows: [2, 6], independencePairs: partial })
    expect(result.coverageAchieved).toBe(false)
    expect(result.coveragePercent).toBeLessThan(100)
  })
})

describe('simulateFaults — B signature', () => {
  // The altitude case's seeded F1 is keyed on the pilotOverride condition,
  // so the B-signature simulator looks for an independence pair on that id.
  test('geçerli pilotOverride pair → F1 detected', () => {
    const pairs = [{ condition: 'pilotOverride', row1: 4, row2: 5 }]
    const result = simulateFaults({ selectedRows: [4, 5], independencePairs: pairs })
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('F1')
    expect(result[0]?.detected).toBe(true)
  })

  test('pilotOverride pair yoksa → F1 missed', () => {
    const pairs = [{ condition: 'verticalSpeedExceedsLimit', row1: 2, row2: 6 }]
    const result = simulateFaults({ selectedRows: [2, 6], independencePairs: pairs })
    expect(result[0]?.detected).toBe(false)
  })
})

describe('detectMisconceptions — B signature', () => {
  test('geçerli pair → hiç misconception triggered değil', () => {
    const pairs = [
      { condition: 'A', row1: 2, row2: 6 },
      { condition: 'B', row1: 4, row2: 6 },
      { condition: 'C', row1: 4, row2: 5 },
    ]
    const result = detectMisconceptions({ selectedRows: [2, 4, 5, 6], independencePairs: pairs })
    expect(result.every((m) => !m.triggered)).toBe(true)
  })

  test('geçersiz pair → MCDC-INDEP-AS-ISOLATION triggered', () => {
    // row0↔row7: multiple conditions change — isolation pattern
    const pairs = [{ condition: 'A', row1: 0, row2: 7 }]
    const result = detectMisconceptions({ selectedRows: [0, 7], independencePairs: pairs })
    const isolation = result.find((m) => m.id === 'MCDC-INDEP-AS-ISOLATION')
    expect(isolation?.triggered).toBe(true)
    expect(typeof isolation?.explanation).toBe('string')
  })
})
