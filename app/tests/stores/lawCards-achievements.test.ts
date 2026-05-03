import { describe, test, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../src/stores/gameStore'

const ACT1 = ['stmt-tutorial-01', 'stmt-hidden-branch-01', 'branch-loop-trap-01']
const ACT3 = ['bcc-three-and-01', 'bcc-cost-intuition-01']

beforeEach(() => {
  localStorage.clear()
  useGameStore.setState({
    completedCases: [],
    collectedLawCards: [],
    unlockedAchievements: [],
    newlyUnlockedAchievement: null,
  })
})

describe('Law Cards: collection on case win', () => {
  test('collectedLawCards starts empty', () => {
    expect(useGameStore.getState().collectedLawCards).toEqual([])
  })

  test('completing stmt-tutorial-01 collects law-statement', () => {
    useGameStore.getState().markCaseCompleted('stmt-tutorial-01')
    expect(useGameStore.getState().collectedLawCards).toEqual(['law-statement'])
  })

  test('completing two cases that map to the same law only stores it once', () => {
    useGameStore.getState().markCaseCompleted('stmt-hidden-branch-01') // law-branch
    useGameStore.getState().markCaseCompleted('branch-loop-trap-01')   // also law-branch
    expect(useGameStore.getState().collectedLawCards).toEqual(['law-branch'])
  })

  test('markCaseCompleted is idempotent — duplicate call does not double-collect', () => {
    useGameStore.getState().markCaseCompleted('stmt-tutorial-01')
    useGameStore.getState().markCaseCompleted('stmt-tutorial-01')
    expect(useGameStore.getState().completedCases).toEqual(['stmt-tutorial-01'])
    expect(useGameStore.getState().collectedLawCards).toEqual(['law-statement'])
  })

  test('completing all 12 cases collects all 6 law cards', () => {
    const allCases = [
      'stmt-tutorial-01', 'stmt-hidden-branch-01', 'branch-loop-trap-01',
      'decision-and-trap-01', 'bc-or-three-cond-01', 'bc-negation-mask-01',
      'bcc-three-and-01', 'bcc-cost-intuition-01',
      'mcdc-tutorial-01', 'mcdc-altitude-disengage-01',
      'mcdc-trap-isolation-01', 'mcdc-vault-boss-01',
    ]
    for (const id of allCases) useGameStore.getState().markCaseCompleted(id)
    expect(useGameStore.getState().collectedLawCards.sort()).toEqual([
      'law-bc', 'law-bcc', 'law-branch', 'law-decision', 'law-mcdc', 'law-statement',
    ])
  })
})

describe('Achievements: unlock on full ACT completion', () => {
  test('unlockedAchievements starts empty', () => {
    expect(useGameStore.getState().unlockedAchievements).toEqual([])
  })

  test('partial ACT I does NOT unlock anything', () => {
    useGameStore.getState().markCaseCompleted('stmt-tutorial-01')
    useGameStore.getState().markCaseCompleted('stmt-hidden-branch-01')
    expect(useGameStore.getState().unlockedAchievements).toEqual([])
    expect(useGameStore.getState().newlyUnlockedAchievement).toBeNull()
  })

  test('completing all of ACT I unlocks ach-act-1 and records newlyUnlockedAchievement', () => {
    for (const id of ACT1) useGameStore.getState().markCaseCompleted(id)
    expect(useGameStore.getState().unlockedAchievements).toEqual(['ach-act-1'])
    expect(useGameStore.getState().newlyUnlockedAchievement).toBe('ach-act-1')
  })

  test('newlyUnlockedAchievement reflects only the freshly-unlocked one', () => {
    for (const id of ACT1) useGameStore.getState().markCaseCompleted(id)
    useGameStore.getState().clearNewlyUnlockedAchievement()
    expect(useGameStore.getState().newlyUnlockedAchievement).toBeNull()

    // Now finish ACT III in two markCaseCompleted calls — last one fires.
    useGameStore.getState().markCaseCompleted(ACT3[0]!)
    expect(useGameStore.getState().newlyUnlockedAchievement).toBeNull()
    useGameStore.getState().markCaseCompleted(ACT3[1]!)
    expect(useGameStore.getState().newlyUnlockedAchievement).toBe('ach-act-3')
  })

  test('clearNewlyUnlockedAchievement clears the flag', () => {
    for (const id of ACT1) useGameStore.getState().markCaseCompleted(id)
    expect(useGameStore.getState().newlyUnlockedAchievement).toBe('ach-act-1')
    useGameStore.getState().clearNewlyUnlockedAchievement()
    expect(useGameStore.getState().newlyUnlockedAchievement).toBeNull()
  })
})

describe('Persistence: collectedLawCards & unlockedAchievements', () => {
  test('partialize writes both new fields to localStorage', () => {
    useGameStore.getState().markCaseCompleted('stmt-tutorial-01')
    const raw = localStorage.getItem('iso29119-game-progress')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!) as { state: Record<string, unknown> }
    expect(parsed.state).toHaveProperty('completedCases')
    expect(parsed.state).toHaveProperty('collectedLawCards')
    expect(parsed.state).toHaveProperty('unlockedAchievements')
    expect(parsed.state.collectedLawCards).toEqual(['law-statement'])
  })

  test('rehydrate from a save that pre-dates law cards: backfill from completedCases', () => {
    // Simulate an old save (only completedCases persisted).
    localStorage.setItem(
      'iso29119-game-progress',
      JSON.stringify({
        state: { completedCases: ACT1 },
        version: 1,
      }),
    )
    const persistApi = (useGameStore as unknown as {
      persist: { rehydrate: () => Promise<void> }
    }).persist
    return persistApi.rehydrate().then(() => {
      const s = useGameStore.getState()
      expect(s.completedCases).toEqual(ACT1)
      // Backfilled — every ACT I case maps to law-statement OR law-branch.
      expect(s.collectedLawCards.sort()).toEqual(['law-branch', 'law-statement'])
      // Recomputed — ACT I is complete, so ach-act-1 is unlocked.
      expect(s.unlockedAchievements).toEqual(['ach-act-1'])
      // Notification not shown for restored sessions.
      expect(s.newlyUnlockedAchievement).toBeNull()
    })
  })

  test('rehydrate honors a save that already includes the new fields', () => {
    localStorage.setItem(
      'iso29119-game-progress',
      JSON.stringify({
        state: {
          completedCases: ACT1,
          collectedLawCards: ['law-statement', 'law-branch'],
          unlockedAchievements: ['ach-act-1'],
        },
        version: 1,
      }),
    )
    const persistApi = (useGameStore as unknown as {
      persist: { rehydrate: () => Promise<void> }
    }).persist
    return persistApi.rehydrate().then(() => {
      const s = useGameStore.getState()
      expect(s.collectedLawCards.sort()).toEqual(['law-branch', 'law-statement'])
      expect(s.unlockedAchievements).toEqual(['ach-act-1'])
    })
  })
})
