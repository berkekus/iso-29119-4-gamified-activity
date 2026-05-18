import { useMemo } from 'react'
import { TC, HAND_FONT, PIXEL_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore } from '../stores/mockTrialStore'
import type { Screen } from '../stores/gameStore'
import type { LeaderboardCourt } from '../mock-trial/types'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function MockTrialFinalScreen({ onNavigate, onBack }: Props) {
  const { finalLeaderboard, roomState, reset } = useMockTrialStore()

  const rows = useMemo<LeaderboardCourt[]>(() => {
    if (finalLeaderboard.length > 0) return finalLeaderboard
    return [...(roomState?.courts ?? [])]
      .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name))
      .map((court, idx) => ({ ...court, rank: idx + 1 }))
  }, [finalLeaderboard, roomState?.courts])

  const leave = () => {
    reset()
    onNavigate('menu')
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24, maxWidth: 720, margin: '0 auto', zIndex: 1, position: 'relative' }}>
      <div style={{ border: `3px solid ${TC.ink}`, background: TC.cream, padding: 18 }}>
        <h1 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 24, margin: '0 0 8px' }}>
          Final Verdict
        </h1>
        <p style={{ fontFamily: HAND_FONT, color: TC.ink, margin: '0 0 16px' }}>
          Mock Trial court leaderboard
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.length === 0 ? (
            <div style={{ fontFamily: HAND_FONT, color: TC.grey }}>
              No court scores were recorded.
            </div>
          ) : rows.map((court) => (
            <div
              key={court.id}
              style={{
                border: `2px solid ${court.rank <= 3 ? TC.orange : TC.ink}`,
                background: court.rank <= 3 ? '#fff7d8' : '#fff',
                padding: 12,
                display: 'grid',
                gridTemplateColumns: '56px 1fr auto',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <div style={{ fontFamily: PIXEL_FONT, color: court.rank <= 3 ? TC.orange : TC.grey, fontSize: 14 }}>
                #{court.rank}
              </div>
              <div>
                <div style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 13 }}>{court.name}</div>
                <div style={{ fontFamily: HAND_FONT, color: TC.grey, fontSize: 13 }}>
                  Last case: +{court.lastCaseDelta}
                </div>
              </div>
              <div style={{ fontFamily: MONO_FONT, color: TC.blue, fontSize: 20 }}>
                {court.totalScore}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 18 }}>
          <PixelButton onClick={leave}>Main Menu</PixelButton>
          <PixelButton onClick={() => { reset(); onBack() }} variant="secondary">Back</PixelButton>
        </div>
      </div>
    </div>
  )
}
