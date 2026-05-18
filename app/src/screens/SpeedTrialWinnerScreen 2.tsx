import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import SpeedTrialLeaderboard from './SpeedTrialLeaderboard'
import { useSpeedTrialStore } from '../stores/speedTrialStore'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const CROWN = ['👑', '🥈', '🥉']

export default function SpeedTrialWinnerScreen({ onBack }: Props) {
  const { finalLeaderboard, playerId, reset } = useSpeedTrialStore()

  const top3 = finalLeaderboard.slice(0, 3)
  const winner = top3[0]

  const handleBack = () => { reset(); onBack() }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1,
      padding: 32,
      gap: 28,
    }}>
      {/* Title banner */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, letterSpacing: 3, marginBottom: 10 }}>
          SPEED TRIAL · FINAL VERDICT
        </div>
        <h1 style={{ fontFamily: PIXEL_FONT, fontSize: 28, color: TC.orange, margin: 0, textShadow: `4px 4px 0 ${TC.ink}` }}>
          TOURNAMENT
        </h1>
        <h1 style={{ fontFamily: PIXEL_FONT, fontSize: 28, color: TC.ink, margin: 0, textShadow: `4px 4px 0 ${TC.grid}` }}>
          COMPLETE
        </h1>
      </div>

      {/* Winner callout */}
      {winner && (
        <div style={{
          background: TC.cream,
          border: `4px solid ${TC.ink}`,
          boxShadow: `8px 8px 0 ${TC.ink}`,
          padding: '24px 40px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👑</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 6 }}>GRAND CHAMPION</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 20, color: TC.orange, marginBottom: 8 }}>
            {winner.nickname}
          </div>
          <div style={{ fontFamily: MONO_FONT, fontSize: 14, color: TC.ink }}>
            {winner.score.toLocaleString()} pts · {winner.correctAnswers} correct
          </div>
          {winner.playerId === playerId && (
            <div style={{
              fontFamily: HAND_FONT, fontSize: 18, color: TC.green,
              marginTop: 10, border: `2px solid ${TC.green}`, padding: '4px 12px',
            }}>
              That's YOU! Excellent work, counselor.
            </div>
          )}
        </div>
      )}

      {/* Podium top 3 */}
      {top3.length > 1 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap' }}>
          {top3.map((entry, idx) => (
            <div key={entry.playerId} style={{
              background: TC.cream,
              border: `3px solid ${TC.ink}`,
              boxShadow: `4px 4px 0 ${TC.ink}`,
              padding: '14px 20px',
              textAlign: 'center',
              minWidth: 120,
              transform: idx === 0 ? 'translateY(-12px)' : 'none',
            }}>
              <div style={{ fontSize: 28 }}>{CROWN[idx]}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.ink, marginTop: 6 }}>
                {entry.nickname}
              </div>
              <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey, marginTop: 4 }}>
                {entry.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full leaderboard */}
      <SpeedTrialLeaderboard entries={finalLeaderboard} myPlayerId={playerId} isPodium />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <PixelButton variant="primary" onClick={handleBack}>
          PLAY AGAIN
        </PixelButton>
        <PixelButton variant="secondary" onClick={() => { reset(); window.location.reload() }}>
          MAIN MENU
        </PixelButton>
      </div>

      <div style={{ fontFamily: MONO_FONT, fontSize: 9, color: TC.greyLight }}>
        ISO/IEC/IEEE 29119-4 · SENG 436
      </div>
    </div>
  )
}
