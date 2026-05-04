import { useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { JudgeSprite, ProsecutorSprite, DefenseSprite } from '../ui/CharacterSprites'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
}

const menuItems = [
  { id: 'campaign' as Screen,      label: 'SOLO CAMPAIGN',  icon: '⚖',  desc: 'Four acts. Twelve cases. One standard.', color: TC.blue },
  { id: 'multiplayer' as Screen,   label: 'MULTIPLAYER',    icon: '🔥',  desc: 'Mock Trial · Jury · Hot Seat',           color: TC.orange },
  { id: 'achievements' as Screen,  label: 'ACHIEVEMENTS',   icon: '🏆',  desc: 'Badges, transcripts, mastery.',          color: TC.green },
  { id: 'how-to-play' as Screen,   label: 'HOW TO PLAY',    icon: '📖',  desc: 'Learn the 5 phases step by step.',       color: TC.magenta },
]

export default function MainMenuScreen({ onNavigate }: Props) {
  const [hover, setHover] = useState<Screen | null>(null)

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
        padding: 'clamp(16px, 4vw, 40px)',
      }}
    >
      {/* Title Block */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: TC.grey, letterSpacing: 3, marginBottom: 12 }}>
          ISO/IEC/IEEE 29119-4
        </div>
        <h1 style={{ fontFamily: PIXEL_FONT, fontSize: 32, color: TC.ink, margin: 0, lineHeight: 1.3, textShadow: `3px 3px 0 ${TC.grid}` }}>
          TEST
        </h1>
        <h1 style={{ fontFamily: PIXEL_FONT, fontSize: 32, color: TC.blue, margin: 0, lineHeight: 1.3, textShadow: `3px 3px 0 ${TC.grid}` }}>
          COURTHOUSE
        </h1>
        <div style={{ fontFamily: HAND_FONT, fontSize: 22, color: TC.grey, marginTop: 12 }}>
          Where bugs stand trial and misconceptions are the real defendants.
        </div>
      </div>

      {/* Characters */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 40, alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
        <ProsecutorSprite size={100} />
        <JudgeSprite size={130} />
        <DefenseSprite size={100} />
      </div>

      {/* Menu Grid */}
      <div className="menu-grid">
        {menuItems.map(item => {
          const disabled = item.id === 'multiplayer'
          return (
            <button
              key={item.id}
              onClick={() => { if (!disabled) onNavigate(item.id) }}
              onMouseEnter={() => { if (!disabled) setHover(item.id) }}
              onMouseLeave={() => setHover(null)}
              style={{
                background: hover === item.id ? `${item.color}15` : TC.cream,
                border: `3px solid ${disabled ? TC.greyLight : TC.ink}`,
                boxShadow: hover === item.id ? `6px 6px 0 ${item.color}` : `4px 4px 0 ${disabled ? TC.greyLight : TC.ink}`,
                padding: 20,
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.06s steps(2)',
                transform: hover === item.id ? 'translate(-2px, -2px)' : 'none',
                opacity: disabled ? 0.4 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: item.color }}>{item.label}</span>
              </div>
              <div style={{ fontFamily: HAND_FONT, fontSize: 17, color: TC.grey }}>{item.desc}</div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ fontFamily: MONO_FONT, fontSize: 10, color: TC.greyLight, marginTop: 40 }}>
        SENG 436 · Learner-as-Designer Project · v0.1.0
      </div>

      <div style={{ marginTop: 8 }}>
        <PixelButton small variant="secondary" onClick={() => onNavigate('briefing')}>
          QUICK START → ACT III
        </PixelButton>
      </div>
    </div>
  )
}
