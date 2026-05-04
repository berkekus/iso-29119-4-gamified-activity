import { describe, test, expect } from 'vitest'
import { ACHIEVEMENTS, unlockedAchievementIds } from '../../src/content/achievements'

describe('Achievements content', () => {
  test('exactly 4 ACT-based achievements', () => {
    expect(ACHIEVEMENTS.length).toBe(4)
    expect(ACHIEVEMENTS.map((a) => a.id).sort()).toEqual([
      'ach-act-1',
      'ach-act-2',
      'ach-act-3',
      'ach-act-4',
    ])
  })

  test('each achievement names its act and required cases', () => {
    const byId = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
    expect(byId['ach-act-1']?.required_cases).toEqual([
      'stmt-tutorial-01',
      'stmt-hidden-branch-01',
      'branch-loop-trap-01',
    ])
    expect(byId['ach-act-2']?.required_cases).toEqual([
      'decision-and-trap-01',
      'bc-or-three-cond-01',
      'bc-negation-mask-01',
    ])
    expect(byId['ach-act-3']?.required_cases).toEqual([
      'bcc-three-and-01',
      'bcc-cost-intuition-01',
    ])
    expect(byId['ach-act-4']?.required_cases).toEqual([
      'mcdc-tutorial-01',
      'mcdc-altitude-disengage-01',
      'mcdc-trap-isolation-01',
      'mcdc-vault-boss-01',
    ])
  })

  test('unlockedAchievementIds: empty when no cases done', () => {
    expect(unlockedAchievementIds([])).toEqual([])
  })

  test('unlockedAchievementIds: partial completion does not unlock', () => {
    expect(unlockedAchievementIds(['stmt-tutorial-01', 'stmt-hidden-branch-01'])).toEqual([])
  })

  test('unlockedAchievementIds: completing ACT I unlocks only ach-act-1', () => {
    const r = unlockedAchievementIds([
      'stmt-tutorial-01',
      'stmt-hidden-branch-01',
      'branch-loop-trap-01',
    ])
    expect(r).toEqual(['ach-act-1'])
  })

  test('unlockedAchievementIds: completing all 12 cases unlocks all 4 achievements', () => {
    const allCases = ACHIEVEMENTS.flatMap((a) => a.required_cases)
    const r = unlockedAchievementIds(allCases)
    expect(r.sort()).toEqual(['ach-act-1', 'ach-act-2', 'ach-act-3', 'ach-act-4'])
  })
})
