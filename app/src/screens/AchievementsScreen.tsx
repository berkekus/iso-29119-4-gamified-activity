import { TC, PIXEL_FONT, HAND_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import ScoreChip from '../ui/ScoreChip'
import { ACHIEVEMENTS } from '../content/achievements'
import { useGameStore } from '../stores/gameStore'

interface Props {
  onBack: () => void
}

// Achievements — mirrors CampaignMapScreen / LawLibraryScreen visual
// vocabulary. Locked achievements get the same greyLight border + opacity 0.5
// treatment used for locked cases on CampaignMapScreen.
export default function AchievementsScreen({ onBack }: Props) {
  const unlocked = useGameStore((s) => s.unlockedAchievements)
  const completed = useGameStore((s) => s.completedCases)
  const unlockedSet = new Set(unlocked)
  const completedSet = new Set(completed)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: '30px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
        <PixelButton small variant="secondary" onClick={onBack}>← CAMPAIGN</PixelButton>
        <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.ink, margin: 0 }}>
          ACHIEVEMENTS
        </h2>
        <ScoreChip label="UNLOCKED" value={`${unlocked.length}/${ACHIEVEMENTS.length}`} color={TC.green} />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          maxWidth: 700,
          margin: '0 auto',
        }}
      >
        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = unlockedSet.has(ach.id)
          const doneCount = ach.required_cases.filter((c) => completedSet.has(c)).length
          return (
            <div
              key={ach.id}
              style={{
                background: TC.cream,
                border: `3px solid ${isUnlocked ? TC.green : TC.greyLight}`,
                boxShadow: isUnlocked ? `4px 4px 0 ${TC.ink}` : 'none',
                padding: 16,
                opacity: isUnlocked ? 1 : 0.5,
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 18,
                  color: isUnlocked ? TC.green : TC.grey,
                  width: 36,
                  textAlign: 'center',
                }}
              >
                {isUnlocked ? '🏆' : '🔒'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta }}>{ach.act}</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.grey }}>
                    {isUnlocked ? 'UNLOCKED' : `${doneCount}/${ach.required_cases.length} · [LOCKED]`}
                  </div>
                </div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: isUnlocked ? TC.ink : TC.grey, marginBottom: 8, lineHeight: 1.4 }}>
                  {ach.title}
                </div>
                <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, lineHeight: 1.55 }}>
                  {ach.description}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 24,
          padding: '14px 18px',
          border: `2px dashed ${TC.greyLight}`,
          fontFamily: HAND_FONT,
          fontSize: 15,
          lineHeight: 1.55,
          color: TC.grey,
          textAlign: 'center',
        }}
      >
        One achievement per ACT — clear every case in an act to unlock the badge.
      </div>
    </div>
  )
}
