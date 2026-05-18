import { useEffect } from 'react'
import { TC, PIXEL_FONT, HAND_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore } from '../stores/mockTrialStore'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function MockTrialHostScreen({ onNavigate, onBack }: Props) {
  const {
    roomState, addCourt, startGame, nextCase, finishGame, hostOverride,
    revealData, reset, error, clearError,
  } = useMockTrialStore()

  useEffect(() => {
    if (roomState?.status === 'finished') onNavigate('mock-trial-final')
  }, [roomState?.status, onNavigate])

  const handleBack = () => { reset(); onBack() }

  if (!roomState) {
    return <div style={{ padding: 24 }}><p style={{ fontFamily: HAND_FONT }}>Connecting…</p></div>
  }

  const allReady = roomState.courts.some(
    (c) => c.slots.prosecutor && c.slots.defense && c.slots.scribe,
  )

  return (
    <div style={{ minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 1, position: 'relative' }}>
      <h1 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 26, margin: 0 }}>Host Console</h1>
      <p style={{ fontFamily: HAND_FONT, color: TC.ink }}>
        Room <strong style={{ fontFamily: 'monospace', fontSize: 22 }}>{roomState.code}</strong>
        {' · '}Status: <strong>{roomState.status}</strong>
        {roomState.currentPhase ? <> · Phase: <strong>{roomState.currentPhase}</strong></> : null}
      </p>

      {error && (
        <div style={{ background: TC.magenta, color: TC.cream, padding: 8 }}>
          {error} <button onClick={clearError}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {roomState.courts.map((c) => (
          <div key={c.id} style={{ border: `2px solid ${TC.ink}`, padding: 8, background: TC.cream }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontFamily: PIXEL_FONT }}>{c.name}</strong>
              <span style={{ fontFamily: 'monospace' }}>Score: {c.totalScore}</span>
            </div>
            <div style={{ fontFamily: HAND_FONT, fontSize: 13, color: TC.ink }}>
              P: {c.slots.prosecutor?.nickname ?? '—'} ·
              D: {c.slots.defense?.nickname ?? '—'} ·
              J1: {c.slots.jury1?.nickname ?? '—'} ·
              J2: {c.slots.jury2?.nickname ?? '—'} ·
              S: {c.slots.scribe?.nickname ?? '—'}
            </div>
          </div>
        ))}
      </div>

      {roomState.status === 'lobby' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <PixelButton onClick={addCourt} disabled={roomState.courts.length >= 12}>+ Add Court</PixelButton>
          <PixelButton onClick={startGame} disabled={!allReady}>Start Game</PixelButton>
        </div>
      )}

      {roomState.status === 'reveal' && revealData && (
        <div style={{ border: `2px solid ${TC.ink}`, padding: 12, background: TC.cream }}>
          <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 18, margin: '0 0 8px 0', color: TC.ink }}>
            Answer: {revealData.correctVerdict === 'satisfied' ? 'Satisfied ✓' : 'Not Satisfied ✗'}
          </h2>
          <p style={{ fontFamily: HAND_FONT, color: TC.ink, whiteSpace: 'pre-wrap' }}>{revealData.answerExplanation}</p>
          <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 14, margin: '12px 0 4px 0' }}>Court Justifications (override scores if needed):</h3>
          {revealData.courtResults.map((cr) => (
            <div key={cr.courtId} style={{ borderTop: `1px dashed ${TC.ink}`, padding: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, fontFamily: HAND_FONT, fontSize: 13 }}>
                <strong>{cr.courtName}</strong> ({cr.caseTotal} pts):
                <em> "{cr.submission.justification || '(no justification)'}"</em>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => hostOverride(cr.courtId, -1)} style={{ padding: '2px 6px' }}>-1</button>
                <button onClick={() => hostOverride(cr.courtId, +1)} style={{ padding: '2px 6px' }}>+1</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <PixelButton onClick={nextCase}>Next Case →</PixelButton>
            <PixelButton onClick={finishGame} variant="secondary">End Game</PixelButton>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <PixelButton onClick={handleBack} variant="secondary">Close Room</PixelButton>
      </div>
    </div>
  )
}
