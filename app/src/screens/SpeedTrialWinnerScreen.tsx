import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { JudgeSprite, ProsecutorSprite } from '../ui/CharacterSprites'
import SpeedTrialLeaderboard from './SpeedTrialLeaderboard'
import { useSpeedTrialStore } from '../stores/speedTrialStore'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const CROWN_TEXT = ['1ST PLACE', '2ND PLACE', '3RD PLACE']

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
      {/* Title banner flanked by courtroom characters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginTop: 16 }}>
        <JudgeSprite size={120} pose="verdict" isTalking />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey, letterSpacing: 3, marginBottom: 10 }}>
            SPEED TRIAL · FINAL VERDICT
          </div>
          <h1 style={{ fontFamily: PIXEL_FONT, fontSize: 32, color: TC.orange, margin: 0, textShadow: `4px 4px 0 ${TC.ink}` }}>
            TOURNAMENT
          </h1>
          <h1 style={{ fontFamily: PIXEL_FONT, fontSize: 32, color: TC.ink, margin: 0, textShadow: `4px 4px 0 ${TC.grid}` }}>
            COMPLETE
          </h1>
        </div>
        <ProsecutorSprite size={120} pose="idle" />
      </div>

      {/* Winner callout */}
      {winner && (
        <div style={{
          background: TC.cream,
          border: `4px solid ${TC.ink}`,
          boxShadow: `8px 8px 0 ${TC.ink}`,
          padding: '24px 40px',
          textAlign: 'center',
          maxWidth: 480,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, fontWeight: 700, color: TC.orange, marginBottom: 12, letterSpacing: 2 }}>
            GRAND CHAMPION
          </div>
          {winner.avatar && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={`/assets/${winner.avatar}.png`}
                alt={winner.nickname}
                style={{ width: 96, height: 96, objectFit: 'contain', imageRendering: 'pixelated' }}
              />
            </div>
          )}
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 26, color: TC.ink, marginBottom: 10 }}>
            {winner.nickname}
          </div>
          <div style={{ fontFamily: MONO_FONT, fontSize: 16, color: TC.grey }}>
            {winner.score.toLocaleString()} pts · {winner.correctAnswers} correct
          </div>
          {winner.playerId === playerId && (
            <div style={{
              fontFamily: HAND_FONT, fontSize: 18, color: TC.green,
              marginTop: 14, border: `2px solid ${TC.green}`, padding: '6px 14px',
              background: `${TC.green}10`,
            }}>
              That's YOU! Excellent work, counselor.
            </div>
          )}
        </div>
      )}

      {/* Podium top 3 */}
      {top3.length > 1 && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap' }}>
          {top3.map((entry, idx) => (
            <div key={entry.playerId} style={{
              background: TC.cream,
              border: `3px solid ${TC.ink}`,
              boxShadow: `6px 6px 0 ${TC.ink}`,
              padding: '20px 28px',
              textAlign: 'center',
              minWidth: 160,
              transform: idx === 0 ? 'translateY(-16px)' : 'none',
              boxSizing: 'border-box',
            }}>
              <div style={{
                fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700,
                background: idx === 0 ? '#F5A623' : idx === 1 ? '#9B9B9B' : '#C17B43',
                color: TC.cream, padding: '4px 8px', display: 'inline-block', marginBottom: 12,
                border: `2px solid ${TC.ink}`,
              }}>
                {CROWN_TEXT[idx]}
              </div>
              {entry.avatar && (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={`/assets/${entry.avatar}.png`}
                    alt={entry.nickname}
                    style={{ width: 64, height: 64, objectFit: 'contain', imageRendering: 'pixelated' }}
                  />
                </div>
              )}
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: TC.ink, fontWeight: 700 }}>
                {entry.nickname}
              </div>
              <div style={{ fontFamily: MONO_FONT, fontSize: 14, color: TC.grey, marginTop: 8 }}>
                {entry.score.toLocaleString()} PTS
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full leaderboard */}
      <SpeedTrialLeaderboard entries={finalLeaderboard} myPlayerId={playerId} isPodium />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
        <PixelButton variant="primary" onClick={handleBack}>
          PLAY AGAIN
        </PixelButton>
        <PixelButton variant="secondary" onClick={() => { reset(); window.location.reload() }}>
          MAIN MENU
        </PixelButton>
      </div>

      <div style={{ fontFamily: MONO_FONT, fontSize: 10, color: TC.greyLight }}>
        ISO/IEC/IEEE 29119-4 · SENG 436
      </div>
    </div>
  )
}
