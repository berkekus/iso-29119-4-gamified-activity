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
      <rect x="21" y="4"  width="2" height="30" fill={color} />
      <rect x="8"  y="7"  width="28" height="2"  fill={color} />
      <rect x="9"  y="9"  width="2" height="11" fill={color} />
      <rect x="33" y="9"  width="2" height="11" fill={color} />
      <rect x="5"  y="20" width="9" height="4"  fill={color} />
      <rect x="30" y="20" width="9" height="4"  fill={color} />
      <rect x="17" y="34" width="10" height="2" fill={color} />
      <rect x="13" y="36" width="18" height="2" fill={color} />
      {/* outer frame */}
      <rect x="2"  y="2"  width="40" height="40" rx="0"
        stroke={color} strokeWidth="2" fill="none" />
    </svg>
  )
}

function PeopleIcon({ color }: { color: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 44 44" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
      <rect x="8"  y="7"  width="8"  height="8"  fill={color} />
      <rect x="6"  y="17" width="12" height="10" fill={color} />
      <rect x="7"  y="27" width="4"  height="9"  fill={color} />
      <rect x="13" y="27" width="4"  height="9"  fill={color} />
      <rect x="28" y="7"  width="8"  height="8"  fill={color} />
      <rect x="26" y="17" width="12" height="10" fill={color} />
      <rect x="27" y="27" width="4"  height="9"  fill={color} />
      <rect x="33" y="27" width="4"  height="9"  fill={color} />
    </svg>
  )
}

function TrophyIcon({ color }: { color: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 44 44" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
      <rect x="12" y="5"  width="20" height="18" fill={color} />
      <rect x="10" y="5"  width="2"  height="14" fill={color} />
      <rect x="32" y="5"  width="2"  height="14" fill={color} />
      <rect x="8"  y="5"  width="2"  height="8"  fill={color} />
      <rect x="34" y="5"  width="2"  height="8"  fill={color} />
      <rect x="6"  y="7"  width="4"  height="6"  fill={color} />
      <rect x="34" y="7"  width="4"  height="6"  fill={color} />
      <rect x="19" y="23" width="6"  height="8"  fill={color} />
      <rect x="13" y="31" width="18" height="4"  fill={color} />
    </svg>
  )
}

function BookIcon({ color }: { color: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 44 44" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
      <rect x="5"  y="7"  width="16" height="28" fill={color} />
      <rect x="23" y="7"  width="16" height="28" fill={color} />
      <rect x="20" y="5"  width="4"  height="32" fill={color} />
      <rect x="7"  y="14" width="11" height="2"  fill="#f7f1df" />
      <rect x="7"  y="19" width="11" height="2"  fill="#f7f1df" />
      <rect x="7"  y="24" width="11" height="2"  fill="#f7f1df" />
      <rect x="26" y="14" width="11" height="2"  fill="#f7f1df" />
      <rect x="26" y="19" width="11" height="2"  fill="#f7f1df" />
      <rect x="26" y="24" width="11" height="2"  fill="#f7f1df" />
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
  const leftDiamonds  = [40, 80, 120, 160, 200]
  const rightDiamonds = [360, 400, 440, 480, 520]

  return (
    <svg viewBox="0 0 560 32"
      style={{ width: 'min(560px, 88vw)', display: 'block', overflow: 'visible' }}>
      <polygon points="6,16 14,12 14,20" fill={ink} />
      <rect x="14"  y="15" width="218" height="2" fill={ink} />
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
    fontFamily:    PIXEL_FONT,
    fontSize,
    lineHeight:    1.2,
    letterSpacing: 3,
    display:       'block',
    whiteSpace:    'nowrap',
  }
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{
        ...shared,
        WebkitTextStroke: '10px #1A1A1A',
        color:       'transparent',
        textShadow:  '7px 7px 0 #1A1A1A, 8px 8px 0 #1A1A1A',
        userSelect:  'none',
        pointerEvents: 'none',
      }}>{text}</span>
      <span style={{
        ...shared,
        color,
        position: 'absolute',
        inset:    0,
      }}>{text}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu items data
// ─────────────────────────────────────────────────────────────────────────────

const menuItems = [
  {
    id:       'campaign'     as Screen,
    label:    'SOLO CAMPAIGN',
    desc:     'FOUR ACTS. TWELVE CASES. ONE STANDARD.',
    color:    '#2f6db3',
    icon:     (c: string) => <ScalesIcon color={c} />,
    disabled: false,
  },
  {
    id:       'multiplayer'  as Screen,
    label:    'MULTIPLAYER',
    desc:     'MOCK TRIALS. JURY. HOT SEAT.',
    color:    '#c23b83',
    icon:     (c: string) => <PeopleIcon color={c} />,
    disabled: true,
  },
  {
    id:       'achievements' as Screen,
    label:    'ACHIEVEMENTS',
    desc:     'BADGES. TRANSCRIPTS. MASTERY.',
    color:    '#269650',
    icon:     (c: string) => <TrophyIcon color={c} />,
    disabled: false,
  },
  {
    id:       'how-to-play'  as Screen,
    label:    'HOW TO PLAY',
    desc:     'LEARN THE 5 PHASES STEP BY STEP.',
    color:    '#e57b2c',
    icon:     (c: string) => <BookIcon color={c} />,
    disabled: false,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const CHAR_SIZE = 180   // all three characters the same, bigger than before

const gridBg: React.CSSProperties = {
  backgroundColor:  '#f7f1df',
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
      minHeight:      '100vh',
      width:          '100%',
      outline:        '5px solid #111111',
      outlineOffset:  '-5px',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      position:       'relative',
      zIndex:         1,
      padding:        'clamp(18px, 3vw, 36px) clamp(16px, 3vw, 32px)',
      gap:            0,
    }}>

      {/* ── ISO/IEC label ─────────────────────────────────────── */}
      <div style={{
        display:    'flex', alignItems: 'center', gap: 10, marginBottom: 10,
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
        fontFamily:    PIXEL_FONT,
        fontSize:      'clamp(6px, 0.85vw, 8px)',
        color:         '#8a8171',
        letterSpacing: 1.5,
        textAlign:     'center',
        marginBottom:  'clamp(14px, 2vw, 24px)',
        lineHeight:    1.9,
      }}>
        WHERE BUGS STAND TRIAL AND MISCONCEPTIONS ARE THE REAL DEFENDANTS.
      </p>

      {/* ── Character row ─────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        gap:            'clamp(16px, 4vw, 52px)',
        marginBottom:   'clamp(18px, 2.5vw, 30px)',
        alignItems:     'flex-end',
        justifyContent: 'center',
        flexWrap:       'wrap',
      }}>
        {([
          { src: '/assets/new_judge.png',      label: 'JUDGE',            size: 255 },
          { src: '/assets/new_prosecutor.png', label: 'PROSECUTOR',       size: 205, isPlayer: true },
          { src: '/assets/new_defense.png',    label: 'DEFENSE ATTORNEY', size: 180 },
          { src: '/assets/bug-defendant.png',  label: 'DEFENDANT',        size: 180 },
        ] as { src: string; label: string; size: number; isPlayer?: boolean }[]).map(({ src, label, size, isPlayer }) => (
          <div key={label} style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           10,
            position:      'relative',
            paddingTop:    28,
          }}>
            {isPlayer && (
              <div style={{
                position:      'absolute',
                top:           0,
                fontFamily:    PIXEL_FONT,
                fontSize:      7,
                color:         '#fff',
                background:    '#2C6FBB',
                padding:       '3px 10px',
                letterSpacing: 1,
              }}>▶ YOU</div>
            )}
            <img
              src={src}
              alt={label}
              style={{
                width:          size,
                height:         size,
                objectFit:      'contain',
                imageRendering: 'pixelated',
                filter:         isPlayer
                  ? 'drop-shadow(0 0 10px rgba(44,111,187,0.55))'
                  : undefined,
              }}
            />
            <div style={{
              fontFamily:    PIXEL_FONT,
              fontSize:      8,
              color:         isPlayer ? '#fff' : '#111111',
              border:        `2px solid ${isPlayer ? '#2C6FBB' : '#111111'}`,
              background:    isPlayer ? '#2C6FBB' : '#f7f1df',
              padding:       '5px 12px',
              letterSpacing: 1,
              whiteSpace:    'nowrap',
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── 2×2 Menu grid ─────────────────────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 14,
        width:               'min(680px, 94vw)',
        marginBottom:        'clamp(14px, 2vw, 24px)',
      }}>
        {menuItems.map(item => (
          <button
            key={item.id}
            className="menu-btn pixel-border"
            data-disabled={item.disabled}
            onClick={() => { if (!item.disabled) onNavigate(item.id) }}
            style={{
              background:  '#f7f1df',
              border:      `5px solid #111111`,
              padding:     '16px 18px',
              textAlign:   'left',
              display:     'flex',
              alignItems:  'center',
              gap:         16,
              opacity:     item.disabled ? 0.42 : 1,
              cursor:      item.disabled ? 'default' : 'pointer',
            }}
          >
            {/* Colored corner pip */}
            <div style={{
              position:   'absolute',
              top:        -2,
              left:       -2,
              width:      9,
              height:     9,
              background: item.disabled ? '#aaa' : item.color,
            }} />

            {/* Icon */}
            <div style={{ flexShrink: 0 }}>
              {item.icon(item.disabled ? '#aaa' : item.color)}
            </div>

            {/* Text */}
            <div>
              <div style={{
                fontFamily:    PIXEL_FONT,
                fontSize:      'clamp(8px, 1.2vw, 11px)',
                color:         item.disabled ? '#aaa' : item.color,
                marginBottom:  7,
                letterSpacing: 0.5,
                lineHeight:    1.5,
              }}>
                {item.label}
              </div>
              <div style={{
                fontFamily:    PIXEL_FONT,
                fontSize:      'clamp(6px, 0.8vw, 8px)',
                color:         item.disabled ? '#bbb' : '#8a8171',
                lineHeight:    1.85,
                letterSpacing: 0.3,
              }}>
                {item.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <p style={{
        fontFamily:    MONO_FONT,
        fontSize:      10,
        color:         '#8a8171',
        opacity:       0.75,
        letterSpacing: 1,
        textAlign:     'center',
      }}>
        © 2025 SENG 436 • LEARNER-AS-DEVELOPER PROJECT • v0.1.0
      </p>
    </div>
  )
}
