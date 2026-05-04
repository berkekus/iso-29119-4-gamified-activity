import { describe, test, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../src/stores/gameStore'

beforeEach(() => {
  localStorage.clear()
  // Reset only run-state — completedCases is the persisted axis we want
  // to assert on, so we clear it explicitly through the store API.
  useGameStore.setState({ completedCases: [] })
})

describe('gameStore persist middleware', () => {
  test('persist key is iso29119-game-progress', () => {
    const persistApi = (useGameStore as unknown as { persist?: { getOptions: () => { name?: string } } }).persist
    expect(persistApi).toBeDefined()
    expect(persistApi!.getOptions().name).toBe('iso29119-game-progress')
  })

  test('partialize includes completedCases (and only campaign progress)', () => {
    useGameStore.getState().markCaseCompleted('stmt-tutorial-01')
    // Force a write to localStorage by reading from the persist API.
    const raw = localStorage.getItem('iso29119-game-progress')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!) as { state: Record<string, unknown> }
    expect(parsed.state).toHaveProperty('completedCases')
    expect(parsed.state.completedCases).toEqual(['stmt-tutorial-01'])
    // Transient run state must NOT be persisted.
    expect(parsed.state).not.toHaveProperty('caseFile')
    expect(parsed.state).not.toHaveProperty('truthTable')
    expect(parsed.state).not.toHaveProperty('submission')
    expect(parsed.state).not.toHaveProperty('verdict')
    expect(parsed.state).not.toHaveProperty('mcdc')
    expect(parsed.state).not.toHaveProperty('screen')
  })

  test('completedCases is restored from localStorage on rehydrate', () => {
    // Seed the storage as if a prior session had completed two cases.
    localStorage.setItem(
      'iso29119-game-progress',
      JSON.stringify({
        state: { completedCases: ['stmt-tutorial-01', 'stmt-hidden-branch-01'] },
        version: 1,
      }),
    )
    const persistApi = (useGameStore as unknown as { persist: { rehydrate: () => Promise<void> } }).persist
    return persistApi.rehydrate().then(() => {
      expect(useGameStore.getState().completedCases).toEqual([
        'stmt-tutorial-01',
        'stmt-hidden-branch-01',
      ])
    })
  })
})
