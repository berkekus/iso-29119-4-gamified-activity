import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import ScoreChip from '../ui/ScoreChip'
import { LAW_CARDS } from '../content/lawCards'
import { useGameStore } from '../stores/gameStore'

interface Props {
  onBack: () => void
}

// Law Library — mirrors CampaignMapScreen's visual vocabulary (cream cards,
// 3px ink border, ink boxShadow, greyLight + opacity 0.5 for locked). NO new
// tokens, fonts, or layouts: reuses existing tokens.ts values throughout.
export default function LawLibraryScreen({ onBack }: Props) {
  const collected = useGameStore((s) => s.collectedLawCards)
  const collectedSet = new Set(collected)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: '30px 40px' }}>
      {/* Header — same pattern as CampaignMapScreen */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
        <PixelButton small variant="secondary" onClick={onBack}>← CAMPAIGN</PixelButton>
        <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.ink, margin: 0 }}>
          LAW LIBRARY · ISO 29119-4 §5.3
        </h2>
        <ScoreChip label="LAWS" value={`${collected.length}/${LAW_CARDS.length}`} color={TC.orange} />
      </div>

      {/* 6-card grid — same row gap & card frame as the act timeline */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {LAW_CARDS.map((law) => {
          const unlocked = collectedSet.has(law.id)
          return (
            <div
              key={law.id}
              style={{
                background: TC.cream,
                border: `3px solid ${unlocked ? TC.ink : TC.greyLight}`,
                boxShadow: unlocked ? `4px 4px 0 ${TC.ink}` : 'none',
                padding: 16,
                opacity: unlocked ? 1 : 0.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey }}>
                {unlocked ? law.iso_clause : '🔒 LOCKED'}
              </div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: unlocked ? TC.ink : TC.grey }}>
                {unlocked ? law.title : '— — —'}
              </div>
              <div
                style={{
                  fontFamily: HAND_FONT,
                  fontSize: 16,
                  color: TC.ink,
                  lineHeight: 1.5,
                  minHeight: 60,
                }}
              >
                {unlocked
                  ? law.short_definition
                  : 'Complete a case that teaches this technique to add it to your library.'}
              </div>
              {unlocked && (
                <>
                  <div
                    style={{
                      fontFamily: HAND_FONT,
                      fontSize: 14,
                      color: TC.grey,
                      lineHeight: 1.5,
                    }}
                  >
                    {law.long_description}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      background: `${TC.magenta}10`,
                      border: `2px solid ${TC.magenta}`,
                      padding: '6px 8px',
                    }}
                  >
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: TC.magenta, marginBottom: 2 }}>
                      COMMON PITFALL
                    </div>
                    <div style={{ fontFamily: HAND_FONT, fontSize: 14, color: TC.ink, lineHeight: 1.4 }}>
                      {law.pitfall}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: MONO_FONT,
                      fontSize: 10,
                      color: TC.grey,
                      lineHeight: 1.4,
                      marginTop: 4,
                    }}
                  >
                    {law.example_note}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer hint — same dashed-border treatment as CampaignMapScreen */}
      <div
        style={{
          marginTop: 24,
          padding: 12,
          border: `2px dashed ${TC.greyLight}`,
          fontFamily: HAND_FONT,
          fontSize: 13,
          color: TC.grey,
          textAlign: 'center',
        }}
      >
        Each Law Card unlocks when you win a case that teaches the technique. Locked entries appear here as a reminder of what is still to learn.
      </div>
    </div>
  )
}
