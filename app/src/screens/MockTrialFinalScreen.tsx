import { useMemo } from 'react'
import { TC, HAND_FONT, PIXEL_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore } from '../stores/mockTrialStore'
import type { Screen } from '../stores/gameStore'
import type { CourtPublic, LeaderboardCourt, MockTrialRole } from '../mock-trial/types'
import { RoleAvatar, ScoreChip } from './mock-trial-panels/MockTrialVisuals'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const ROLES: MockTrialRole[] = ['prosecutor', 'defense', 'jury1', 'jury2', 'scribe']

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

  const topThree = rows.slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', padding: 24, maxWidth: 860, margin: '0 auto', zIndex: 1, position: 'relative' }}>
      <div style={{ border: `3px solid ${TC.ink}`, background: TC.cream, padding: 18 }}>
        <h1 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 24, margin: '0 0 8px' }}>
          Final Verdict
        </h1>
        <p style={{ fontFamily: HAND_FONT, color: TC.ink, margin: '0 0 16px' }}>
          Mock Trial court leaderboard
        </p>

        {topThree.length > 0 && (
          <div className="mt-podium-grid" style={{ marginBottom: 16 }}>
            {topThree.map((court) => (
              <PodiumCard key={court.id} court={court} fullCourt={findCourt(roomState?.courts, court.id)} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.length === 0 ? (
            <div style={{ fontFamily: HAND_FONT, color: TC.grey }}>
              No court scores were recorded.
            </div>
          ) : rows.map((court) => (
            <LeaderboardRow key={court.id} court={court} fullCourt={findCourt(roomState?.courts, court.id)} />
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

function PodiumCard({ court, fullCourt }: { court: LeaderboardCourt; fullCourt?: CourtPublic }) {
  return (
    <div className="mt-argument-card" style={{
      border: `3px solid ${court.rank === 1 ? TC.orange : TC.ink}`,
      background: court.rank === 1 ? '#fff7d8' : '#fff',
      padding: 12,
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: PIXEL_FONT, color: court.rank === 1 ? TC.orange : TC.blue, fontSize: 18 }}>
        #{court.rank}
      </div>
      <div style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 13, marginTop: 6 }}>{court.name}</div>
      <CourtAvatarStrip court={fullCourt} centered />
      <div style={{ fontFamily: MONO_FONT, color: TC.blue, fontSize: 24, marginTop: 6 }}>
        {court.totalScore}
      </div>
    </div>
  )
}

function LeaderboardRow({ court, fullCourt }: { court: LeaderboardCourt; fullCourt?: CourtPublic }) {
  const history = fullCourt?.caseHistory ?? []
  return (
    <div
      style={{
        border: `2px solid ${court.rank <= 3 ? TC.orange : TC.ink}`,
        background: court.rank <= 3 ? '#fff7d8' : '#fff',
        padding: 12,
        display: 'grid',
        gridTemplateColumns: '56px minmax(0, 1fr) auto',
        gap: 10,
        alignItems: 'center',
      }}
    >
      <div style={{ fontFamily: PIXEL_FONT, color: court.rank <= 3 ? TC.orange : TC.grey, fontSize: 14 }}>
        #{court.rank}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 13 }}>{court.name}</div>
        <CourtAvatarStrip court={fullCourt} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
          {history.length > 0 ? history.map((entry, idx) => (
            <span key={`${entry.caseId}-${idx}`} style={{ fontFamily: MONO_FONT, color: TC.grey, border: `1px solid ${TC.greyLight}`, padding: '2px 5px', background: TC.cream }}>
              C{idx + 1}: +{entry.caseTotal}
            </span>
          )) : (
            <span style={{ fontFamily: HAND_FONT, color: TC.grey, fontSize: 13 }}>
              Last case: +{court.lastCaseDelta}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ fontFamily: MONO_FONT, color: TC.blue, fontSize: 20 }}>
          {court.totalScore}
        </div>
        <ScoreChip label="last" value={court.lastCaseDelta} tone={TC.blue} />
      </div>
    </div>
  )
}

function CourtAvatarStrip({ court, centered = false }: { court?: CourtPublic; centered?: boolean }) {
  const players = ROLES
    .map((role) => ({ role, player: court?.slots[role] ?? null }))
    .filter(({ player }) => player)

  if (players.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: centered ? 'center' : 'flex-start', marginTop: 8, flexWrap: 'wrap' }}>
      {players.map(({ role, player }) => (
        <RoleAvatar
          key={role}
          role={role}
          player={player}
          size={34}
          pose={role === 'scribe' ? 'submitted' : 'celebrate'}
        />
      ))}
    </div>
  )
}

function findCourt(courts: CourtPublic[] | undefined, id: string): CourtPublic | undefined {
  return courts?.find((court) => court.id === id)
}
