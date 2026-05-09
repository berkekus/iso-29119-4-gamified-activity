import { useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import ScoreChip from '../ui/ScoreChip'
import { BugSprite } from '../ui/CharacterSprites'
import type { Screen } from '../stores/gameStore'
import { CASE_ORDER } from '../content/caseOrder'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
  completedCases: string[]
  onSelectCase?: (caseId: string) => void
}

// ─── Coverage Hierarchy Campaign (Concept Analysis §2 chain) ────────────────
// Each ACT corresponds to one or two ISO 29119-4 §5.3.x techniques.
// Cases inside an ACT are ordered easy → hard and gated sequentially: a case
// is unlocked only when the previous case in the same act has been completed,
// or when the previous act has been fully completed (for the first case of
// the next act). This implements the "misconception-driven progression" laid
// out in Concept Analysis §4: each level defeats the player's previous
// strategy and forces adoption of the next technique.

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
      { id: 'decision-and-trap-01', name: 'Two-Factor Login',     difficulty: 1 },
      { id: 'bc-or-three-cond-01',  name: 'Triple Alarm',          difficulty: 2 },
      { id: 'bc-negation-mask-01',  name: 'Negation Mask',         difficulty: 3 },
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
      { id: 'mcdc-tutorial-01',           name: 'The Single Flip',        difficulty: 1 },
      { id: 'mcdc-trap-isolation-01',     name: 'The Sabotaged Drone',    difficulty: 2 },
      { id: 'mcdc-vault-boss-01',         name: 'The Casino Vault',       difficulty: 3 },
      { id: 'mcdc-showdown-01',           name: 'BCC vs MC/DC Showdown',  difficulty: 3, isBoss: true },
    ],
  },
]

const TOTAL_CASES = acts.reduce((n, a) => n + a.cases.length, 0)

/**
 * Returns true if a case is unlocked. Gating follows the canonical CASE_ORDER:
 * the first case is always unlocked, and every subsequent case is unlocked
 * iff its predecessor in CASE_ORDER has been completed. ACT-boundary gating
 * falls out automatically because the predecessor of the first case of a
 * later act is the last case of the previous act.
 */
function isCaseUnlocked(caseId: string, completed: string[]): boolean {
  const idx = CASE_ORDER.indexOf(caseId as (typeof CASE_ORDER)[number])
  if (idx <= 0) return idx === 0
  const prev = CASE_ORDER[idx - 1]
  return prev !== undefined && completed.includes(prev)
}

export default function CampaignMapScreen({ onNavigate, onBack, completedCases, onSelectCase }: Props) {
  const [selectedAct, setSelectedAct] = useState<string | null>(null)
  const completedCount = completedCases.filter((id) =>
    acts.some((a) => a.cases.some((c) => c.id === id)),
  ).length

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: 'clamp(16px, 3vw, 30px) clamp(16px, 4vw, 40px)' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <PixelButton small variant="secondary" onClick={onBack}>← MENU</PixelButton>
          <PixelButton small variant="secondary" onClick={() => onNavigate('law-library')}>LAW LIBRARY</PixelButton>
          <PixelButton small variant="secondary" onClick={() => onNavigate('achievements')}>ACHIEVEMENTS</PixelButton>
        </div>
        <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.ink, margin: 0 }}>
          COVERAGE HIERARCHY · ISO 29119-4
        </h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <ScoreChip label="CASES" value={`${completedCount}/${TOTAL_CASES}`} color={TC.blue} />
          <ScoreChip label="ACTS" value={`${acts.filter((a) => a.cases.every((c) => completedCases.includes(c.id))).length}/${acts.length}`} color={TC.green} />
        </div>
      </div>

      {/* Act timeline */}
      <div className="acts-row" style={{ gap: 20 }}>
        {acts.map((act) => (
          <div key={act.id} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Act header card */}
            <button
              onClick={() => setSelectedAct(selectedAct === act.id ? null : act.id)}
              style={{
                background: selectedAct === act.id ? `${act.color}18` : TC.cream,
                border: `3px solid ${act.color}`,
                boxShadow: `4px 4px 0 ${TC.ink}`,
                padding: 16,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.06s steps(2)',
              }}
            >
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey }}>{act.name}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: act.color, margin: '10px 0 6px', lineHeight: 1.4 }}>{act.title}</div>
              <div style={{ fontFamily: HAND_FONT, fontSize: 15, color: TC.ink, lineHeight: 1.4 }}>{act.subtitle}</div>
              <div style={{ margin: '10px auto 0' }}>
                <BugSprite size={50} type={act.bugType} />
              </div>
              <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey, marginTop: 8, letterSpacing: 0.3 }}>{act.clauses}</div>
            </button>

            {/* Cases list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {act.cases.map((c) => {
                const isComplete = completedCases.includes(c.id)
                const isLocked = !isComplete && !isCaseUnlocked(c.id, completedCases)
                const handleClick = () => {
                  if (isLocked) return
                  if (onSelectCase) onSelectCase(c.id)
                  onNavigate('briefing')
                }
                const prefix = isComplete ? '✓ ' : isLocked ? '🔒 ' : c.isBoss ? '★ ' : '> '
                return (
                  <button
                    key={c.id}
                    onClick={handleClick}
                    title={isLocked ? 'Complete the previous case to unlock' : c.isBoss ? 'FINAL BOSS' : c.name}
                    style={{
                      background: isComplete
                        ? `${TC.green}15`
                        : c.isBoss && !isLocked
                          ? `${TC.magenta}10`
                          : TC.cream,
                      border: `2px solid ${isLocked ? TC.greyLight : c.isBoss ? TC.magenta : TC.ink}`,
                      boxShadow: !isLocked ? `3px 3px 0 ${TC.ink}` : 'none',
                      padding: '10px 12px',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      opacity: isLocked ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div
                        style={{
                          fontFamily: PIXEL_FONT,
                          fontSize: 9,
                          color: isComplete ? TC.green : c.isBoss ? TC.magenta : TC.ink,
                          lineHeight: 1.4,
                        }}
                      >
                        {prefix}
                        {c.name}
                      </div>
                      {c.isBoss && (
                        <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.magenta }}>
                          ★ FINAL BOSS
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1, 2, 3].map((d) => (
                        <div
                          key={d}
                          style={{
                            width: 8,
                            height: 8,
                            background: d <= c.difficulty ? act.color : TC.grid,
                            border: `1px solid ${TC.ink}`,
                          }}
                        />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend / hint footer */}
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
        Each act builds on the last: the case you just solved planted the very misconception the
        next case will defeat. Complete an act to unlock the next.
      </div>
      </div>
    </div>
  )
}
