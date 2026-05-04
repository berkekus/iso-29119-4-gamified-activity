import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import BriefingScreen from '../../src/screens/BriefingScreen'
import { useGameStore } from '../../src/stores/gameStore'

// Mount in jsdom so that zustand's client snapshot path runs (the SSR
// snapshot returns initial state and would always render the fallback).
let container: HTMLDivElement
let root: Root

beforeEach(() => {
  localStorage.clear()
  useGameStore.getState().resetGame()
  useGameStore.setState({ completedCases: [] })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

// Strip <svg>...</svg> blocks before asserting on user-visible text — the
// retro bug-defendant sprite has the literal "MCDC" baked into its SVG glyph
// and the user rule is no design changes. We assert on the user-visible TEXT
// only, outside SVG markup.
function userVisibleText(): string {
  const html = container.innerHTML
  return html.replace(/<svg[\s\S]*?<\/svg>/g, '')
}

describe('BriefingScreen — technique-neutral content for non-MCDC cases', () => {
  test('stmt-tutorial-01 briefing renders no residual MC/DC, MCDC, or Altitude Hold text', () => {
    useGameStore.getState().loadCaseById('stmt-tutorial-01')
    expect(useGameStore.getState().caseFile?.id).toBe('stmt-tutorial-01')
    act(() => {
      root.render(<BriefingScreen onNavigate={() => {}} onBack={() => {}} />)
    })
    const html = userVisibleText()
    expect(html).not.toMatch(/MC\/DC/)
    expect(html).not.toMatch(/MCDC/)
    expect(html).not.toMatch(/Altitude Hold/)
    expect(html).not.toMatch(/short-circuit/i)
    expect(html).not.toMatch(/modified condition/i)
    expect(html).toContain('Greeting Service')
  })

  test('stmt-hidden-branch-01 briefing renders no residual MC/DC, MCDC, or Altitude Hold text', () => {
    useGameStore.getState().loadCaseById('stmt-hidden-branch-01')
    expect(useGameStore.getState().caseFile?.id).toBe('stmt-hidden-branch-01')
    act(() => {
      root.render(<BriefingScreen onNavigate={() => {}} onBack={() => {}} />)
    })
    const html = userVisibleText()
    expect(html).not.toMatch(/MC\/DC/)
    expect(html).not.toMatch(/MCDC/)
    expect(html).not.toMatch(/Altitude Hold/)
    expect(html).not.toMatch(/modified condition/i)
    expect(html).toContain('The Missing Else')
  })
})
