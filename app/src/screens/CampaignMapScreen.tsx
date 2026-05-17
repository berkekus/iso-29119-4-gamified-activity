import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import { BugSprite } from '../ui/CharacterSprites'
import type { Screen } from '../stores/gameStore'
import { CASE_ORDER } from '../content/caseOrder'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
  completedCases: string[]
  onSelectCase?: (caseId: string) => void
}

type CaseEntry = {
  id: string
  name: string
  difficulty: 1 | 2 | 3
  isBoss?: boolean
}

type ActEntry = {
  id: string
  name: string
  title: string
  subtitle: string
  color: string
  bugType: 'combinatorial' | 'bcc' | 'mcdc' | 'dataflow'
  clauses: string
  cases: CaseEntry[]
}

const acts: ActEntry[] = [
  {
    id: 'stmt-branch',
    name: 'ACT I',
    title: 'Statement & Branch',
    subtitle: 'Recognition',
    color: TC.orange,
    bugType: 'combinatorial',
    clauses: '§5.3.1 – §5.3.2',
    cases: [
      { id: 'stmt-tutorial-01',      name: 'First Trial',      difficulty: 1 },
      { id: 'stmt-hidden-branch-01', name: 'The Missing Else', difficulty: 2 },
      { id: 'branch-loop-trap-01',   name: 'The Empty Loop',   difficulty: 3 },
    ],
  },
  {
    id: 'decision-bc',
    name: 'ACT II',
    title: 'Decision & BC',
    subtitle: 'Discrimination',
    color: TC.green,
    bugType: 'bcc',
    clauses: '§5.3.3 – §5.3.4',
    cases: [
      { id: 'decision-and-trap-01', name: 'Two-Factor Login', difficulty: 1 },
      { id: 'bc-or-three-cond-01',  name: 'Triple Alarm',     difficulty: 2 },
      { id: 'bc-negation-mask-01',  name: 'Negation Mask',    difficulty: 3 },
    ],
  },
  {
    id: 'bcc',
    name: 'ACT III',
    title: 'BCC',
    subtitle: 'Combinatorial Cost',
    color: TC.blue,
    bugType: 'bcc',
    clauses: '§5.3.5',
    cases: [
      { id: 'bcc-intro-01',          name: 'E-Commerce Discount', difficulty: 1 },
      { id: 'bcc-vs-bc-01',          name: 'Bank Loan Scandal',   difficulty: 2 },
      { id: 'bcc-explosion-01',      name: 'Emergency Brake',     difficulty: 3 },
    ],
  },
  {
    id: 'mcdc',
    name: 'ACT IV',
    title: 'MC/DC',
    subtitle: 'Independence Pairs',
    color: TC.magenta,
    bugType: 'mcdc',
    clauses: '§5.3.6',
    cases: [
      { id: 'mcdc-tutorial-01',       name: 'The Single Flip',     difficulty: 1 },
      { id: 'mcdc-trap-isolation-01', name: 'The Sabotaged Drone', difficulty: 2 },
      { id: 'mcdc-vault-boss-01',     name: 'The Casino Vault',    difficulty: 3 },
    ],
  },
  {
    id: 'coverage-mix',
    name: 'ACT V',
    title: 'Coverage Trial',
    subtitle: 'The Final Exam',
    color: TC.grey,
    bugType: 'dataflow',
    clauses: '§5.3.1 – §5.3.6',
    cases: [
      { id: 'coverage-mix-01', name: 'The Logging Glitch',        difficulty: 1 },
      { id: 'coverage-mix-02', name: 'The Insurance Rule Engine', difficulty: 2 },
      { id: 'coverage-mix-03', name: 'The Life-Support Controller', difficulty: 3, isBoss: true },
    ],
  },
]

const TOTAL_CASES = acts.reduce((n, a) => n + a.cases.length, 0)

function isCaseUnlocked(caseId: string, completed: string[]): boolean {
  const idx = CASE_ORDER.indexOf(caseId as (typeof CASE_ORDER)[number])
  if (idx <= 0) return idx === 0
  const prev = CASE_ORDER[idx - 1]
  return prev !== undefined && completed.includes(prev)
}

// ── Palette ───────────────────────────────────────────────────────────────────
const INK    = '#1e130a'
const PAPER  = '#f0e5cb'
const BORDER = '#9a7a50'

// ── Small reusable SVG icons ──────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
      <rect x="1" y="5" width="9" height="8" rx="1" fill={BORDER} />
      <path d="M2.5 5V3.5a3 3 0 016 0V5" stroke={BORDER} strokeWidth="1.5" fill="none" />
      <circle cx="5.5" cy="9" r="1.2" fill={PAPER} />
    </svg>
  )
}

function PlayIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="9" height="11" viewBox="0 0 9 11" fill="none">
      <polygon points="0,0 9,5.5 0,11"
        fill={filled ? INK : 'none'}
        stroke={INK} strokeWidth={filled ? 0 : 1.5} />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <polyline points="1,5 4.5,8.5 11,1"
        stroke={TC.green} strokeWidth="2" fill="none" strokeLinecap="square" />
    </svg>
  )
}

function CrosshairIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={BORDER} strokeWidth="1.2" fill="none" />
      <line x1="8" y1="1" x2="8" y2="15" stroke={BORDER} strokeWidth="1.2" />
      <line x1="1" y1="8" x2="15" y2="8" stroke={BORDER} strokeWidth="1.2" />
    </svg>
  )
}

// ── Screen connector node ─────────────────────────────────────────────────────
function ConnectorH() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingTop: 72 }}>
      <div style={{ width: 10, height: 2, background: BORDER }} />
      <div style={{ width: 14, height: 14, border: `2px solid ${BORDER}`, background: PAPER, flexShrink: 0 }} />
      <div style={{ width: 10, height: 2, background: BORDER }} />
    </div>
  )
}

function ConnectorV() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 2, height: 12, background: BORDER }} />
      <div style={{ width: 12, height: 12, border: `2px solid ${BORDER}`, background: PAPER }} />
      <div style={{ width: 2, height: 12, background: BORDER }} />
    </div>
  )
}

// ── Nav button ────────────────────────────────────────────────────────────────
function NavBtn({
  label, icon, onClick, disabled,
}: { label: string; icon: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background:    '#2a1a08',
        border:        `2px solid ${BORDER}`,
        boxShadow:     disabled ? 'none' : `3px 3px 0 ${INK}`,
        padding:       '10px 20px',
        cursor:        disabled ? 'not-allowed' : 'pointer',
        opacity:       disabled ? 0.45 : 1,
        display:       'flex',
        alignItems:    'center',
        gap:           10,
        fontFamily:    PIXEL_FONT,
        fontSize:      9,
        color:         '#f0e5cb',
        letterSpacing: 0.5,
        whiteSpace:    'nowrap',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CampaignMapScreen({ onNavigate, onBack, completedCases, onSelectCase }: Props) {
  const completedCount = completedCases.filter(id =>
    acts.some(a => a.cases.some(c => c.id === id))
  ).length
  const completedActs = acts.filter(a =>
    a.cases.every(c => completedCases.includes(c.id))
  ).length

  const currentCaseId = CASE_ORDER.find(id =>
    !completedCases.includes(id) &&
    acts.some(a => a.cases.some(c => c.id === id)) &&
    isCaseUnlocked(id, completedCases)
  ) ?? CASE_ORDER[0]

  const currentCaseDisplay = (currentCaseId ?? '').toUpperCase()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

      {/* ── Header bar ──────────────────────────────────────────────────────── */}
      <div style={{
        background:    '#1a0e06',
        borderBottom:  `3px solid #6a4020`,
        padding:       '10px 20px',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'space-between',
        gap:           16,
        flexShrink:    0,
        flexWrap:      'wrap',
      }}>
        {/* Left: nav buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <NavBtn
            label="MENU"
            icon={<svg width="14" height="12" viewBox="0 0 14 12" fill="none"><polyline points="6,1 1,6 6,11" stroke={PAPER} strokeWidth="2" fill="none" strokeLinecap="square" /><line x1="1" y1="6" x2="13" y2="6" stroke={PAPER} strokeWidth="2" /></svg>}
            onClick={onBack}
          />
          <NavBtn
            label="LAW LIBRARY"
            icon={<svg width="18" height="16" viewBox="0 0 18 16" fill="none"><rect x="1" y="1" width="7" height="14" fill={PAPER} stroke={PAPER} strokeWidth="1"/><rect x="10" y="1" width="7" height="14" fill={PAPER} stroke={PAPER} strokeWidth="1"/><rect x="8" y="0" width="2" height="16" fill="#8a7a60"/><line x1="2" y1="5" x2="7" y2="5" stroke="#8a7a60" strokeWidth="1"/><line x1="2" y1="8" x2="7" y2="8" stroke="#8a7a60" strokeWidth="1"/><line x1="11" y1="5" x2="16" y2="5" stroke="#8a7a60" strokeWidth="1"/><line x1="11" y1="8" x2="16" y2="8" stroke="#8a7a60" strokeWidth="1"/></svg>}
            onClick={() => onNavigate('law-library')}
          />
          <NavBtn
            label="ACHIEVEMENTS"
            icon={<svg width="16" height="18" viewBox="0 0 16 18" fill="none"><rect x="4" y="1" width="8" height="10" rx="4" fill={PAPER} stroke={PAPER} strokeWidth="1"/><rect x="2" y="1" width="2" height="8" fill={PAPER}/><rect x="12" y="1" width="2" height="8" fill={PAPER}/><rect x="6" y="11" width="4" height="4" fill={PAPER}/><rect x="3" y="15" width="10" height="2" fill={PAPER}/></svg>}
            onClick={() => onNavigate('achievements')}
          />
        </div>

        {/* Center: case file indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: PIXEL_FONT, fontSize: 9, color: '#c8a870',
          border: `2px solid #5a3818`, padding: '6px 14px',
          background: '#2e1c0a', letterSpacing: 0.5,
        }}>
          {/* folder icon */}
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M0 2h7l2 2h9v10H0V2z" fill="#c8a870" stroke="#8a6030" strokeWidth="1" />
            <rect x="0" y="4" width="18" height="10" rx="0" fill="#d4b870" stroke="#8a6030" strokeWidth="1" />
          </svg>
          CASE FILE: {currentCaseDisplay}
        </div>

        {/* Right: score chips */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            fontFamily: PIXEL_FONT, fontSize: 9, color: '#fff',
            background: TC.blue, padding: '6px 16px',
            border: '2px solid #1a3a6a',
          }}>
            CASES {String(completedCount).padStart(2, '0')}/{String(TOTAL_CASES).padStart(2, '0')}
          </div>
          <div style={{
            fontFamily: PIXEL_FONT, fontSize: 9, color: '#fff',
            background: TC.green, padding: '6px 16px',
            border: '2px solid #1a5a2a',
          }}>
            ACTS {String(completedActs).padStart(2, '0')}/{String(acts.length).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* ── Desk surface ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', padding: '14px 22px 10px', overflow: 'hidden' }}>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1260, margin: '0 auto' }}>

          {/* Title panel */}
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{
              display:    'inline-flex',
              alignItems: 'center',
              gap:        14,
              background: PAPER,
              border:     `2px solid ${INK}`,
              boxShadow:  `4px 4px 0 ${INK}`,
              padding:    '9px 28px',
            }}>
              <CrosshairIcon />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 13, color: INK, letterSpacing: 1 }}>
                COVERAGE HIERARCHY · ISO 29119-4
              </span>
              <CrosshairIcon />
            </div>
          </div>

          {/* ── Acts row ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {acts.map((act, actIdx) => (
              <div key={act.id} style={{ display: 'flex', flex: 1, alignItems: 'flex-start', minWidth: 0 }}>

                {/* Horizontal connector between acts */}
                {actIdx > 0 && <ConnectorH />}

                {/* Act column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                  {/* Act header card */}
                  <div style={{
                    background: PAPER,
                    border:     `2px solid ${INK}`,
                    boxShadow:  `4px 4px 0 ${INK}`,
                  }}>
                    {/* Coloured tab */}
                    <div style={{
                      background:   act.color,
                      borderBottom: `2px solid ${INK}`,
                      padding:      '6px 12px',
                    }}>
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: '#fff', letterSpacing: 1 }}>
                        {act.name}
                      </span>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey, letterSpacing: 0.5, marginBottom: 6 }}>
                        {act.name}
                      </div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: 11, color: act.color, lineHeight: 1.4, marginBottom: 4 }}>
                        {act.title}
                      </div>
                      <div style={{ fontFamily: HAND_FONT, fontSize: 13, color: INK, marginBottom: 8 }}>
                        {act.subtitle}
                      </div>
                      <BugSprite size={46} type={act.bugType} />
                      <div style={{ fontFamily: MONO_FONT, fontSize: 10, color: TC.grey, marginTop: 7, letterSpacing: 0.3 }}>
                        {act.clauses}
                      </div>
                    </div>
                  </div>

                  {/* Vertical connector: card → cases */}
                  <ConnectorV />

                  {/* Case list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {act.cases.map(c => {
                      const isComplete = completedCases.includes(c.id)
                      const isLocked   = !isComplete && !isCaseUnlocked(c.id, completedCases)
                      const isCurrent  = c.id === currentCaseId && !isComplete

                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            if (isLocked) return
                            onSelectCase?.(c.id)
                            onNavigate('play')
                          }}
                          aria-label={
                            isLocked
                              ? `${c.name} — locked. Complete the previous case to unlock.`
                              : isComplete
                                ? `${c.name} — completed`
                                : isCurrent
                                  ? `${c.name} — current case`
                                  : c.name
                          }
                          title={isLocked ? 'Complete the previous case to unlock' : c.name}
                          style={{
                            background:  c.isBoss && !isLocked ? `${TC.magenta}18` : PAPER,
                            border:      `2px solid ${isLocked ? BORDER : c.isBoss ? TC.magenta : INK}`,
                            boxShadow:   !isLocked ? `2px 2px 0 ${INK}` : 'none',
                            padding:     '8px 9px',
                            minHeight:   44,
                            display:     'flex',
                            alignItems:  'center',
                            gap:         8,
                            cursor:      isLocked ? 'not-allowed' : 'pointer',
                            opacity:     isLocked ? 0.6 : 1,
                            textAlign:   'left',
                            width:       '100%',
                          }}
                        >
                          {/* Left icon */}
                          <div style={{ width: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isLocked   ? <LockIcon /> :
                             isComplete ? <CheckIcon /> :
                             isCurrent  ? <PlayIcon filled /> :
                                          <PlayIcon />}
                          </div>

                          {/* Name block */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontFamily:    PIXEL_FONT,
                              fontSize:      9,
                              color:         isComplete ? TC.green : c.isBoss ? TC.magenta : INK,
                              lineHeight:    1.45,
                              whiteSpace:    'normal',
                              overflowWrap:  'break-word',
                              wordBreak:     'break-word',
                              hyphens:       'auto',
                            }}>
                              {c.name}
                            </div>
                            {c.isBoss && !isLocked && (
                              <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.magenta, marginTop: 3, letterSpacing: 0.3 }}>
                                -FINAL BOSS
                              </div>
                            )}
                          </div>

                          {/* Difficulty dots */}
                          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                            {[1, 2, 3].map(d => (
                              <div key={d} style={{
                                width:      7,
                                height:     7,
                                background: d <= c.difficulty ? (isLocked ? BORDER : act.color) : '#e0d4b8',
                                border:     `1px solid ${isLocked ? BORDER : INK}`,
                              }} />
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Bottom row: hint + save ────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 14, marginTop: 16, alignItems: 'stretch' }}>

            {/* Hint text box */}
            <div style={{
              flex:       1,
              background: PAPER,
              border:     `2px solid ${BORDER}`,
              boxShadow:  `3px 3px 0 ${INK}`,
              padding:    '12px 20px',
              position:   'relative',
              overflow:   'hidden',
              display:    'flex',
              alignItems: 'center',
            }}>
              {/* Corner decorators */}
              {(['tl','tr','bl','br'] as const).map(pos => (
                <div key={pos} style={{
                  position: 'absolute',
                  top:    pos.startsWith('t') ? 5 : undefined,
                  bottom: pos.startsWith('b') ? 5 : undefined,
                  left:   pos.endsWith('l')   ? 5 : undefined,
                  right:  pos.endsWith('r')   ? 5 : undefined,
                }}>
                  <CrosshairIcon />
                </div>
              ))}
              {/* Watermark */}
              <div style={{
                position: 'absolute', right: 20,
                fontSize: 56, opacity: 0.09, color: INK, userSelect: 'none',
                fontFamily: 'serif',
              }}>⚖</div>

              <div style={{
                fontFamily: HAND_FONT, fontSize: 14, color: '#5a4830',
                lineHeight: 1.75, padding: '0 24px', textAlign: 'center', width: '100%',
              }}>
                Complete each case to unlock the next act.<br />
                Every solved misconception makes the system stronger.
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
