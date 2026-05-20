import { TC, PIXEL_FONT, MONO_FONT } from '../ui/tokens'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Pixel-art SVG icons
// ─────────────────────────────────────────────────────────────────────────────

function ScalesIcon({ color }: { color: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 44 44" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
      <rect x="21" y="4" width="2" height="30" fill={color} />
      <rect x="8" y="7" width="28" height="2" fill={color} />
      <rect x="9" y="9" width="2" height="11" fill={color} />
      <rect x="33" y="9" width="2" height="11" fill={color} />
      <rect x="5" y="20" width="9" height="4" fill={color} />
      <rect x="30" y="20" width="9" height="4" fill={color} />
      <rect x="17" y="34" width="10" height="2" fill={color} />
      <rect x="13" y="36" width="18" height="2" fill={color} />
      {/* outer frame */}
      <rect x="2" y="2" width="40" height="40" rx="0"
        stroke={color} strokeWidth="2" fill="none" />
    </svg>
  )
}

function PeopleIcon({ color }: { color: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 44 44" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
      <rect x="8" y="7" width="8" height="8" fill={color} />
      <rect x="6" y="17" width="12" height="10" fill={color} />
      <rect x="7" y="27" width="4" height="9" fill={color} />
      <rect x="13" y="27" width="4" height="9" fill={color} />
      <rect x="28" y="7" width="8" height="8" fill={color} />
      <rect x="26" y="17" width="12" height="10" fill={color} />
      <rect x="27" y="27" width="4" height="9" fill={color} />
      <rect x="33" y="27" width="4" height="9" fill={color} />
    </svg>
  )
}



// ─────────────────────────────────────────────────────────────────────────────
// Ornamental divider — thin line + diamonds + center ⚖ badge
// ─────────────────────────────────────────────────────────────────────────────

function PixelDivider() {
  const ink = '#5a4e3a'
  const D = 4
  const dia = (cx: number, cy: number) =>
    `${cx},${cy - D} ${cx + D},${cy} ${cx},${cy + D} ${cx - D},${cy}`
  const leftDiamonds = [40, 80, 120, 160, 200]
  const rightDiamonds = [360, 400, 440, 480, 520]

  return (
    <svg viewBox="0 0 560 32"
      style={{ width: 'min(560px, 88vw)', display: 'block', overflow: 'visible' }}>
      <polygon points="6,16 14,12 14,20" fill={ink} />
      <rect x="14" y="15" width="218" height="2" fill={ink} />
      {leftDiamonds.map(x => (
        <polygon key={x} points={dia(x, 16)} fill={ink} />
      ))}

      <circle cx="280" cy="16" r="16" fill="#f7f1df" stroke={ink} strokeWidth="1.5" />
      <text x="280" y="22" textAnchor="middle" fontSize="15"
        fill={ink} style={{ fontFamily: 'serif' }}>⚖</text>

      <rect x="328" y="15" width="218" height="2" fill={ink} />
      {rightDiamonds.map(x => (
        <polygon key={x} points={dia(x, 16)} fill={ink} />
      ))}
      <polygon points="554,16 546,12 546,20" fill={ink} />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Title word — thick outline via dual-layer (DON'T TOUCH)
// ─────────────────────────────────────────────────────────────────────────────

function TitleWord({ text, fontSize, color = '#F5F0E1' }: { text: string; fontSize: string; color?: string }) {
  const shared: React.CSSProperties = {
    fontFamily: PIXEL_FONT,
    fontSize,
    lineHeight: 1.2,
    letterSpacing: 3,
    display: 'block',
    whiteSpace: 'nowrap',
  }
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{
        ...shared,
        WebkitTextStroke: '10px #1A1A1A',
        color: 'transparent',
        textShadow: '7px 7px 0 #1A1A1A, 8px 8px 0 #1A1A1A',
        userSelect: 'none',
        pointerEvents: 'none',
      }}>{text}</span>
      <span style={{
        ...shared,
        color,
        position: 'absolute',
        inset: 0,
      }}>{text}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu items data
// ─────────────────────────────────────────────────────────────────────────────

const menuItems = [
  {
    id: 'campaign' as Screen,
    label: 'SOLO CAMPAIGN',
    desc: 'FIVE ACTS. 15 CASES. ONE VERDICT.',
    color: '#2f6db3',
    icon: (c: string) => <ScalesIcon color={c} />,
    disabled: false,
  },
  {
    id: 'speed-trial-lobby' as Screen,
    label: 'SPEED TRIAL',
    desc: 'MULTIPLAYER COURTROOM. 5 ROUNDS. 70 PLAYERS.',
    color: '#c23b83',
    icon: (c: string) => <PeopleIcon color={c} />,
    disabled: false,
  },
  {
    id: 'mock-trial-lobby' as Screen,
    label: 'MOCK TRIAL',
    desc: 'ROLE-BASED GROUP PLAY. COURTS OF 4-5.',
    color: '#8b6914',
    icon: (c: string) => <ScalesIcon color={c} />,
    disabled: false,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const CHAR_SIZE = 180   // all three characters the same, bigger than before

const gridBg: React.CSSProperties = {
  backgroundColor: '#f7f1df',
  backgroundImage: [
    'linear-gradient(rgba(150,130,90,0.14) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(150,130,90,0.14) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '28px 28px',
}

export default function MainMenuScreen({ onNavigate }: Props) {
  const titleSize = 'clamp(36px, 6vw, 68px)'

  return (
    <div style={{
      ...gridBg,
      minHeight: '100vh',
      width: '100%',
      outline: '5px solid #111111',
      outlineOffset: '-5px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1,
      padding: 'clamp(18px, 3vw, 36px) clamp(16px, 3vw, 32px)',
      gap: 0,
    }}>

      {/* ── ISO/IEC label ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
      }}>
        <div style={{ width: 56, height: 1, background: '#8a8171' }} />
        <span style={{
          fontFamily: PIXEL_FONT, fontSize: 8,
          color: '#8a8171', letterSpacing: 2,
        }}>
          ISO/IEC/IEEE 29119-4
        </span>
        <div style={{ width: 56, height: 1, background: '#8a8171' }} />
      </div>

      {/* ── Title (DO NOT TOUCH) ───────────────────────────────── */}
      <div style={{ textAlign: 'center', lineHeight: 1.1, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <TitleWord text="TEST" fontSize={titleSize} color="#CC2222" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <TitleWord text="COURTHOUSE" fontSize={titleSize} color="#2C6FBB" />
        </div>
      </div>

      {/* ── Ornamental divider ────────────────────────────────── */}
      <div style={{ margin: '6px 0' }}>
        <PixelDivider />
      </div>

      {/* ── Subtitle ──────────────────────────────────────────── */}
      <p style={{
        fontFamily: PIXEL_FONT,
        fontSize: 'clamp(6px, 0.85vw, 8px)',
        color: '#8a8171',
        letterSpacing: 1.5,
        textAlign: 'center',
        marginBottom: 'clamp(14px, 2vw, 24px)',
        lineHeight: 1.9,
      }}>
        WHERE BUGS STAND TRIAL AND MISCONCEPTIONS ARE THE REAL DEFENDANTS.
      </p>

      {/* ── Character row ─────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        marginBottom: 0,
        width: 'min(620px, 94vw)',
        alignSelf: 'center',
      }}>
        {/* Removed Red Glow and YOU Badge */}

        <img
          src="/assets/UntitledDesign.png"
          alt="Court characters"
          style={{
            width: '100%',
            height: 'auto',
            imageRendering: 'pixelated',
            display: 'block',
          }}
        />
      </div>

      {/* ── 1×2 Menu row ─────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 24,
        width: 'min(640px, 94vw)',
        marginTop: -30,
        marginBottom: 'clamp(30px, 4vw, 50px)',
      }}>
        {menuItems.map(item => (
          <button
            key={item.id}
            className="menu-btn pixel-border"
            data-disabled={item.disabled}
            onClick={() => { if (!item.disabled) onNavigate(item.id) }}
            style={{
              background: '#f7f1df',
              border: `4px solid #111111`,
              padding: '10px 12px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: item.disabled ? 0.42 : 1,
              cursor: item.disabled ? 'default' : 'pointer',
            }}
          >
            {/* Colored corner pip */}
            <div style={{
              position: 'absolute',
              top: -2,
              left: -2,
              width: 7,
              height: 7,
              background: item.disabled ? '#aaa' : item.color,
            }} />

            {/* Icon */}
            <div style={{ flexShrink: 0, transform: 'scale(0.8)', transformOrigin: 'center' }}>
              {item.icon(item.disabled ? '#aaa' : item.color)}
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: PIXEL_FONT,
                fontSize: 'clamp(7.5px, 1vw, 10px)',
                color: item.disabled ? '#aaa' : item.color,
                marginBottom: 4,
                letterSpacing: 0.5,
                lineHeight: 1.4,
              }}>
                {item.label}
              </div>
              <div style={{
                fontFamily: PIXEL_FONT,
                fontSize: 'clamp(5.5px, 0.7vw, 7.5px)',
                color: item.disabled ? '#bbb' : '#8a8171',
                lineHeight: 1.6,
                letterSpacing: 0.2,
              }}>
                {item.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <p style={{
        fontFamily: MONO_FONT,
        fontSize: 10,
        color: '#8a8171',
        opacity: 0.75,
        letterSpacing: 1,
        textAlign: 'center',
      }}>
        © 2025 SENG 436 • LEARNER-AS-DEVELOPER PROJECT • v0.1.0
      </p>
    </div>
  )
}
