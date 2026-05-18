import { describe, it, expect } from 'vitest'
import { computeCaseScore, buildLeaderboard } from './mockTrialScoring.js'
import type { Court, MockTrialCase, CourtSubmission } from './types.js'
import { EMPTY_SUBMISSION } from './types.js'

const FIXTURE_CASE: MockTrialCase = {
  id: 'fx-1',
  technique: 'BCC',
  difficulty: 'medium',
  title: 'Fixture',
  codeSnippet: '',
  testSet: [],
  claim: { coverage: 'BCC', text: '' },
  lawCardRef: 'law-bcc',
  prosecutorArguments: [
    { id: 'p1', text: '', isStrong: true },
    { id: 'p2', text: '', isStrong: false },
  ],
  defenseArguments: [
    { id: 'd1', text: '', isStrong: true },
    { id: 'd2', text: '', isStrong: false },
  ],
  correctVerdict: 'satisfied',
  answerExplanation: '',
}

function submission(overrides: Partial<CourtSubmission> = {}): CourtSubmission {
  return { ...EMPTY_SUBMISSION, ...overrides }
}

describe('computeCaseScore', () => {
  it('awards +2 for correct verdict', () => {
    const sub = submission({ verdict: 'satisfied' })
    const r = computeCaseScore(FIXTURE_CASE, sub)
    expect(r.verdictScore).toBe(2)
  })

  it('awards 0 for wrong verdict', () => {
    const sub = submission({ verdict: 'not_satisfied' })
    const r = computeCaseScore(FIXTURE_CASE, sub)
    expect(r.verdictScore).toBe(0)
  })

  it('awards +1 prosecutor bonus for strong argument', () => {
    const sub = submission({ prosecutorArgId: 'p1' })
    const r = computeCaseScore(FIXTURE_CASE, sub)
    expect(r.prosecutorBonus).toBe(1)
  })

  it('awards 0 prosecutor bonus for weak argument', () => {
    const sub = submission({ prosecutorArgId: 'p2' })
    const r = computeCaseScore(FIXTURE_CASE, sub)
    expect(r.prosecutorBonus).toBe(0)
  })

  it('awards 0 prosecutor bonus when no argument picked', () => {
    const r = computeCaseScore(FIXTURE_CASE, submission())
    expect(r.prosecutorBonus).toBe(0)
  })

  it('awards defense bonus the same way', () => {
    expect(computeCaseScore(FIXTURE_CASE, submission({ defenseArgId: 'd1' })).defenseBonus).toBe(1)
    expect(computeCaseScore(FIXTURE_CASE, submission({ defenseArgId: 'd2' })).defenseBonus).toBe(0)
  })

  it('passes through Jury self-score as juryBonus', () => {
    expect(computeCaseScore(FIXTURE_CASE, submission({ selfScore: 1 })).juryBonus).toBe(1)
    expect(computeCaseScore(FIXTURE_CASE, submission({ selfScore: 0.5 })).juryBonus).toBe(0.5)
    expect(computeCaseScore(FIXTURE_CASE, submission({ selfScore: 0 })).juryBonus).toBe(0)
    expect(computeCaseScore(FIXTURE_CASE, submission({ selfScore: null })).juryBonus).toBe(0)
  })

  it('sums to caseTotal (max 5)', () => {
    const sub = submission({
      verdict: 'satisfied',
      prosecutorArgId: 'p1',
      defenseArgId: 'd1',
      selfScore: 1,
    })
    const r = computeCaseScore(FIXTURE_CASE, sub)
    expect(r.caseTotal).toBe(5)
  })
})

describe('buildLeaderboard', () => {
  function court(id: string, name: string, totalScore: number, lastDelta: number): Court {
    return {
      id,
      name,
      slots: { prosecutor: null, defense: null, jury1: null, jury2: null, scribe: null },
      currentSubmission: { ...EMPTY_SUBMISSION },
      caseHistory: [
        // last entry's caseTotal == lastDelta for simplicity
        ...(lastDelta !== 0 ? [{
          caseId: 'x', submission: { ...EMPTY_SUBMISSION },
          verdictScore: 0 as const, prosecutorBonus: 0 as const, defenseBonus: 0 as const,
          juryBonus: 0 as const, hostOverride: 0, caseTotal: lastDelta,
        }] : []),
      ],
      totalScore,
    }
  }

  it('sorts by totalScore desc, breaks ties by name', () => {
    const courts = new Map<string, Court>()
    courts.set('court-1', court('court-1', 'Court 1', 5, 2))
    courts.set('court-2', court('court-2', 'Court 2', 8, 3))
    courts.set('court-3', court('court-3', 'Court 3', 5, 1))

    const lb = buildLeaderboard(courts)
    expect(lb.map((e) => e.id)).toEqual(['court-2', 'court-1', 'court-3'])
    expect(lb.map((e) => e.rank)).toEqual([1, 2, 3])
  })

  it('reports lastCaseDelta from latest history entry, 0 if none', () => {
    const courts = new Map<string, Court>()
    courts.set('court-1', court('court-1', 'Court 1', 3, 3))
    const lb = buildLeaderboard(courts)
    expect(lb[0].lastCaseDelta).toBe(3)

    courts.clear()
    courts.set('court-1', court('court-1', 'Court 1', 0, 0))
    expect(buildLeaderboard(courts)[0].lastCaseDelta).toBe(0)
  })
})
