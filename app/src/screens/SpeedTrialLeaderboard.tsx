import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import type { LeaderboardEntry } from '../speed-trial/types'

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
      border: `4px solid ${TC.ink}`,
      boxShadow: `8px 8px 0 ${TC.ink}`,
      padding: '24px 28px',
      width: '100%',
      maxWidth: 560,
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `2px solid ${TC.ink}`,
        paddingBottom: 12,
        marginBottom: 20,
      }}>
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: TC.ink, letterSpacing: 2 }}>
          TOURNAMENT LEADERBOARD
        </span>
        <span style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.grey }}>
          {entries.length} COUNSELOR{entries.length !== 1 ? 'S' : ''} ON RECORD
        </span>
      </div>

      {entries.length === 0 && (
        <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey, textAlign: 'center', padding: '24px 0' }}>
          No scores yet — waiting for counselor statements...
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {entries.map((entry) => {
          const isMe = entry.playerId === myPlayerId
          const isTop3 = entry.rank <= 3

          const rankBg = (isPodium && isTop3)
            ? (entry.rank === 1 ? '#F5A623' : entry.rank === 2 ? '#9B9B9B' : '#C17B43')
            : (entry.rank === 1 ? '#F5A623' : entry.rank === 2 ? '#9B9B9B' : entry.rank === 3 ? '#C17B43' : TC.ink)
          const rankTextColor = TC.cream

          return (
            <div
              key={entry.playerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: isMe ? `${TC.blue}15` : '#fffef8',
                border: isMe ? `3px solid ${TC.blue}` : `2px solid ${TC.ink}`,
                boxShadow: isMe ? `5px 5px 0 ${TC.blue}` : `3px 3px 0 ${TC.ink}`,
                padding: '14px 18px',
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                boxSizing: 'border-box',
              }}
            >
              {/* Rank Badge */}
              <div style={{
                width: 38,
                height: 38,
                background: rankBg,
                border: `2px solid ${TC.ink}`,
                boxShadow: `2px 2px 0 ${TC.ink}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: PIXEL_FONT, fontSize: 14, fontWeight: 700, color: rankTextColor }}>
                  #{entry.rank}
                </span>
              </div>

              {/* Avatar */}
              {entry.avatar && (
                <div style={{
                  width: 52,
                  height: 52,
                  background: `${TC.cream}88`,
                  border: `2px solid ${TC.ink}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `inset 1px 1px 0 rgba(255,255,255,0.8)`,
                }}>
                  <img
                    src={`/assets/${entry.avatar}.png`}
                    alt={entry.nickname}
                    style={{ width: 46, height: 46, objectFit: 'contain', imageRendering: 'pixelated' }}
                  />
                </div>
              )}

              {/* Nickname & Stats */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: PIXEL_FONT,
                    fontSize: 14,
                    color: isMe ? TC.blue : TC.ink,
                    fontWeight: isMe ? 700 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {entry.nickname}
                  </span>
                  {isMe && (
                    <span style={{
                      fontFamily: PIXEL_FONT, fontSize: 8, background: TC.blue, color: TC.cream,
                      padding: '2px 6px', borderRadius: 4, letterSpacing: 1,
                    }}>
                      YOU
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.grey }}>
                  {entry.correctAnswers} EXHIBIT{entry.correctAnswers !== 1 ? 'S' : ''} CERTIFIED
                </div>
              </div>

              {/* Total Score & Round Delta */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: MONO_FONT, fontSize: 20, fontWeight: 700, color: TC.ink, letterSpacing: -0.5 }}>
                  {entry.score.toLocaleString()} <span style={{ fontSize: 12, color: TC.grey, fontWeight: 400 }}>PTS</span>
                </div>
                {entry.delta > 0 && (
                  <div style={{
                    fontFamily: MONO_FONT, fontSize: 11, fontWeight: 700, color: TC.green,
                    background: `${TC.green}15`, border: `1px solid ${TC.green}`,
                    padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4,
                  }}>
                    +{entry.delta.toLocaleString()} PTS
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
