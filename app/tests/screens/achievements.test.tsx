import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import AchievementsScreen from '../../src/screens/AchievementsScreen'
import { useGameStore } from '../../src/stores/gameStore'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  localStorage.clear()
  useGameStore.setState({
    completedCases: [],
    collectedLawCards: [],
    unlockedAchievements: [],
    newlyUnlockedAchievement: null,
  })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('AchievementsScreen', () => {
  test('renders all 4 achievements as locked when none are unlocked', () => {
    act(() => {
      root.render(<AchievementsScreen onBack={() => {}} />)
    })
    const html = container.innerHTML
    expect(html).toContain('Foundations Forged')
    expect(html).toContain('Decisive Reasoning')
    expect(html).toContain('Combinatorial Insight')
    expect(html).toContain('Independence Proven')
    expect((html.match(/\[LOCKED\]/g) ?? []).length).toBe(4)
    expect(html).toContain('0/4')
  })

  test('marks ACT I unlocked once its 3 cases are complete', () => {
    useGameStore.setState({
      completedCases: ['stmt-tutorial-01', 'stmt-hidden-branch-01', 'branch-loop-trap-01'],
      unlockedAchievements: ['ach-act-1'],
    })
    act(() => {
      root.render(<AchievementsScreen onBack={() => {}} />)
    })
    const html = container.innerHTML
    expect(html).toContain('UNLOCKED')
    // ACT I unlocked, the other three still locked
    expect((html.match(/\[LOCKED\]/g) ?? []).length).toBe(3)
    expect(html).toContain('1/4')
  })

  test('shows partial progress count for in-progress acts', () => {
    useGameStore.setState({
      completedCases: ['mcdc-tutorial-01', 'mcdc-trap-isolation-01'],
      unlockedAchievements: [],
    })
    act(() => {
      root.render(<AchievementsScreen onBack={() => {}} />)
    })
    // ACT IV needs 4 cases; 2 are done.
    expect(container.innerHTML).toContain('2/4')
  })
})
