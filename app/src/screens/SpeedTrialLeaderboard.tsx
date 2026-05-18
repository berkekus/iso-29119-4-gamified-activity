import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import type { LeaderboardEntry } from '../speed-trial/types'

const MEDAL = ['🥇', '🥈', '🥉']

interface Props {
  entries: LeaderboardEntry[]
  myPlayerId: string | null
  /** When true, show gold/silver/bronze styling for top 3 */
  isPodium?: boolean
}

export default function SpeedTrialLeaderboard({ entries, myPlayerId, isPodium }: Props) {
  return (
    <div style={{
      background: TC.cream,
      border: `3px solid ${TC.ink}`,
      boxShadow: `6px 6px 0 ${TC.ink}`,
      padding: '16px 20px',
      width: '100%',
      maxWidth: 480,
    }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.ink, marginBottom: 14 }}>
        LEADERBOARD
      </div>

      {entries.length === 0 && (
        <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey }}>
          No scores yet — waiting for players to answer.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry) => {
          const isMe = entry.playerId === myPlayerId
          const medal = isPodium ? MEDAL[entry.rank - 1] : undefined
          const rankColor = entry.rank === 1 ? '#F5A623' : entry.rank === 2 ? '#9B9B9B' : entry.rank === 3 ? '#C17B43' : TC.ink

          return (
            <div
              key={entry.playerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: isMe ? `${TC.blue}18` : 'transparent',
                border: isMe ? `2px solid ${TC.blue}` : `2px solid transparent`,
                padding: '8px 10px',
              }}
            >
              {/* Rank */}
              <div style={{ minWidth: 28, textAlign: 'center' }}>
                {medal
                  ? <span style={{ fontSize: 20 }}>{medal}</span>
                  : <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: rankColor }}>#{entry.rank}</span>
                }
              </div>

              {/* Avatar */}
              {entry.avatar && (
                <div style={{ minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={`/assets/${entry.avatar}.png`}
                    alt={entry.nickname}
                    style={{ width: 32, height: 32, objectFit: 'contain', imageRendering: 'pixelated' }}
                  />
                </div>
              )}

              {/* Nickname */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 9,
                  color: isMe ? TC.blue : TC.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {entry.nickname}{isMe ? ' (YOU)' : ''}
                </div>
                <div style={{ fontFamily: MONO_FONT, fontSize: 9, color: TC.grey }}>
                  {entry.correctAnswers} correct
                </div>
              </div>

              {/* Score + delta */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: TC.ink }}>
                  {entry.score.toLocaleString()}
                </div>
                {entry.delta > 0 && (
                  <div style={{ fontFamily: MONO_FONT, fontSize: 9, color: TC.green }}>
                    +{entry.delta}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
