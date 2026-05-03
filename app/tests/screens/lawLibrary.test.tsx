import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import LawLibraryScreen from '../../src/screens/LawLibraryScreen'
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

describe('LawLibraryScreen', () => {
  test('renders all 6 law card slots when none are collected', () => {
    act(() => {
      root.render(<LawLibraryScreen onBack={() => {}} />)
    })
    const html = container.innerHTML
    // 6 LOCKED rows
    expect(html.match(/LOCKED/g)?.length ?? 0).toBeGreaterThanOrEqual(6)
    // No real titles visible because all are locked.
    expect(html).not.toContain('Statement Coverage')
    expect(html).not.toContain('MC/DC')
  })

  test('shows unlocked content for collected law cards', () => {
    useGameStore.setState({
      completedCases: ['stmt-tutorial-01', 'mcdc-tutorial-01'],
      collectedLawCards: ['law-statement', 'law-mcdc'],
    })
    act(() => {
      root.render(<LawLibraryScreen onBack={() => {}} />)
    })
    const html = container.innerHTML
    expect(html).toContain('Statement Coverage')
    expect(html).toContain('Modified Condition')
    expect(html).toContain('§5.3.1')
    expect(html).toContain('§5.3.6')
    // Other 4 still locked.
    expect(html).toContain('LOCKED')
  })

  test('header counter reflects collected count', () => {
    useGameStore.setState({
      completedCases: ['stmt-tutorial-01'],
      collectedLawCards: ['law-statement'],
    })
    act(() => {
      root.render(<LawLibraryScreen onBack={() => {}} />)
    })
    expect(container.innerHTML).toContain('1/6')
  })
})
