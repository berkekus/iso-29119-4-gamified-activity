/**
 * GrandJuryFinalScreen — shown to host when they click "Start Grand Jury"
 * and to qualified players automatically via SpeedTrialPlayerScreen.
 * This component is a projector-friendly fullscreen view.
 */
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import SpeedTrialLeaderboard from './SpeedTrialLeaderboard'
import { useSpeedTrialStore } from '../stores/speedTrialStore'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function GrandJuryFinalScreen({ onNavigate }: Props) {
  const {
    grandJuryQuestion,
    grandJuryQualifiedIds,
    roundResult,
    finalLeaderboard,
    roomStatus,
    players,
    playerId,
  } = useSpeedTrialStore()

  const qualifiedNicknames = grandJuryQualifiedIds
    .map((id) => players.find((p) => p.id === id)?.nickname ?? id)
    .join(', ')

  if (roomStatus === 'finished') {
    return (
      <div style={outerStyle}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: TC.orange, textShadow: `2px 2px 0 ${TC.ink}` }}>
          TOURNAMENT COMPLETE
        </div>
        <SpeedTrialLeaderboard entries={finalLeaderboard} myPlayerId={playerId} isPodium />
      </div>
    )
  }

  if (roomStatus === 'leaderboard' && roundResult) {
    return (
      <div style={outerStyle}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.magenta }}>GRAND JURY — RESULTS</div>
        <SpeedTrialLeaderboard entries={roundResult.leaderboard} myPlayerId={playerId} isPodium />
      </div>
    )
  }

  return (
    <div style={outerStyle}>
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, letterSpacing: 4, marginBottom: 6 }}>
          ⚖ GRAND JURY FINAL ⚖
        </div>
        <div style={{ fontFamily: HAND_FONT, fontSize: 22, color: TC.ink }}>
          Only the best advance to deliver the final verdict.
        </div>
      </div>

      {/* Qualified players */}
      <div style={{
        background: `${TC.magenta}14`,
        border: `2px solid ${TC.magenta}`,
        padding: '12px 20px',
        textAlign: 'center',
        maxWidth: 500,
        width: '100%',
      }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginBottom: 6 }}>
          QUALIFIED JURORS
        </div>
        <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink }}>
          {qualifiedNicknames || 'Top players…'}
        </div>
      </div>

      {/* Question preview */}
      {grandJuryQuestion && (
        <div style={{
          background: TC.cream,
          border: `3px solid ${TC.magenta}`,
          boxShadow: `6px 6px 0 ${TC.magenta}`,
          padding: '20px 24px',
          maxWidth: 640,
          width: '100%',
        }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginBottom: 10 }}>
            BOSS CASE — {grandJuryQuestion.technique.replace('_', ' ')} · {grandJuryQuestion.timeLimitSeconds}s
          </div>
          <div style={{ fontFamily: HAND_FONT, fontSize: 17, color: TC.ink, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
            {grandJuryQuestion.prompt}
          </div>
          {grandJuryQuestion.codeSnippet && (
            <pre style={{
              fontFamily: MONO_FONT,
              fontSize: 12,
              background: '#1A1A1A',
              color: TC.cream,
              padding: '12px 16px',
              marginTop: 12,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {grandJuryQuestion.codeSnippet}
            </pre>
          )}
          {/* Options (display-only, no selection) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            {grandJuryQuestion.options.map((opt, idx) => (
              <div key={opt.id} style={{
                background: TC.cream,
                border: `2px solid ${TC.ink}`,
                padding: '10px 12px',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}>
                <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey, flexShrink: 0 }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ fontFamily: HAND_FONT, fontSize: 14, color: TC.ink, whiteSpace: 'pre-wrap' }}>
                  {opt.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const outerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  zIndex: 1,
  padding: 24,
  gap: 20,
}
