import { useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import ScoreChip from '../ui/ScoreChip'
import CoverageMeter from '../ui/CoverageMeter'
import { ProsecutorSprite } from '../ui/CharacterSprites'
import { TRUTH_TABLE, isValidIndependencePair } from '../engine/coverage/mcdc'
import { useGameStore } from '../stores/gameStore'
import type { Screen } from '../stores/gameStore'
import { lawCardForCase } from '../content/lawCards'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const pairColors: Record<string, string> = { A: TC.blue, B: TC.orange, C: TC.magenta }

const thStyle = {
  padding: '10px 14px', textAlign: 'center' as const,
  fontFamily: PIXEL_FONT, fontSize: 8, color: TC.ink,
  borderBottom: `2px solid ${TC.ink}`,
}
const tdStyle = {
  padding: '10px 14px', textAlign: 'center' as const,
  fontFamily: MONO_FONT, fontSize: 13,
}

const TECHNIQUE_LABEL: Record<string, string> = {
  STATEMENT: 'STATEMENT',
  BRANCH:    'BRANCH',
  DECISION:  'DECISION',
  BC:        'BC',
  BCC:       'BCC',
  MCDC:      'MC/DC',
}

export default function EvidenceScreen({ onNavigate, onBack }: Props) {
  const { mcdc, addPair, clearPairs, caseFile } = useGameStore()
  const [selecting, setSelecting] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [showLawCard, setShowLawCard] = useState(false)
  const techniqueLabel =
    (caseFile?.technique && TECHNIQUE_LABEL[caseFile.technique]) ?? 'CASE'
  const decisionExpr = caseFile?.scenario.decision_expression || 'A && (B || C)'
  const lawCard = lawCardForCase(caseFile?.id)

  const handleRowClick = (rowId: number) => {
    if (selecting === null) {
      setSelecting(rowId)
      setFeedback(null)
      return
    }
    if (selecting === rowId) {
      setSelecting(null)
      return
    }

    // Try each condition to find a valid pair
    const found = (['A', 'B', 'C'] as const).find(cond =>
      isValidIndependencePair(selecting, rowId, cond),
    )

    if (found) {
      const r1 = Math.min(selecting, rowId)
      const r2 = Math.max(selecting, rowId)
      const alreadyExists = mcdc.independencePairs.some(p =>
        p.condition === found && Math.min(p.row1, p.row2) === r1 && Math.max(p.row1, p.row2) === r2,
      )
      if (!alreadyExists) {
        addPair({ condition: found, row1: r1, row2: r2 })
        setFeedback({
          type: 'success',
          msg: `Independence pair for condition ${found} accepted! Rows ${r1} & ${r2}: ${found} flips, others fixed, D flips.`,
        })
      } else {
        setFeedback({ type: 'error', msg: `Pair for condition ${found} already logged.` })
      }
    } else {
      const rowA = TRUTH_TABLE.find(r => r.id === selecting)
      const rowB = TRUTH_TABLE.find(r => r.id === rowId)
      let detail = ''
      if (rowA && rowB) {
        const diffs = (['A', 'B', 'C'] as const).filter(k => rowA[k] !== rowB[k])
        if (diffs.length !== 1) {
          detail = ` (${diffs.length === 0 ? 'no condition changes' : `${diffs.length} conditions change: ${diffs.join(', ')}`})`
        } else if (rowA.D === rowB.D) {
          detail = ` (condition ${diffs[0]} flips but D does not flip)`
        }
      }
      setFeedback({
        type: 'error',
        msg: `Invalid pair: TC${selecting} & TC${rowId}${detail}. Need exactly one condition flip + D must flip.`,
      })
    }
    setSelecting(null)
  }

  const pairs = mcdc.independencePairs

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: 'clamp(16px, 3vw, 30px) clamp(16px, 4vw, 40px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <PixelButton small variant="secondary" onClick={onBack}>← INVESTIGATION</PixelButton>
          <PixelButton small variant="secondary" onClick={() => onNavigate('campaign')}>CAMPAIGN</PixelButton>
          <PixelButton small variant="secondary" onClick={() => onNavigate('menu')}>⌂ MENU</PixelButton>
          <PixelButton small variant="secondary" onClick={() => onNavigate('how-to-play')}>? HELP</PixelButton>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta, padding: '4px 10px', border: `2px solid ${TC.magenta}` }}>{techniqueLabel}</span>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.green, padding: '4px 10px', border: `2px solid ${TC.green}`, background: `${TC.green}15` }}>PHASE 3: EVIDENCE</span>
        </div>
        <ScoreChip label="PAIRS" value={`${pairs.length}/3`} color={TC.blue} />
      </div>
      {/* Phase breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { label: 'BRIEFING', color: '#5A5448' },
          { label: 'INVESTIGATION', color: '#5A5448' },
          { label: 'EVIDENCE', color: TC.green },
          { label: 'TRIAL', color: TC.blue },
          { label: 'DEBRIEF', color: '#5A5448' },
        ].map((s, i) => (
          <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontFamily: PIXEL_FONT, fontSize: 7, padding: '3px 7px',
              background: i === 2 ? s.color : 'transparent',
              color: i === 2 ? '#fff' : i < 2 ? TC.grey : TC.greyLight,
              border: `1.5px solid ${i <= 2 ? s.color : TC.greyLight}`,
            }}>{i + 1}. {s.label}</span>
            {i < 4 && <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.greyLight }}>›</span>}
          </span>
        ))}
      </div>

      <div className="responsive-row" style={{ gap: 30, maxWidth: 1100, margin: '0 auto' }}>
        {/* Main */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey, marginBottom: 8 }}>
            INDEPENDENCE PAIRS — Click two rows to form a pair
          </div>
          {/* Decision expression reminder — H05/H13 */}
          <div style={{
            background: '#1e1e2e', color: '#cdd6f4', fontFamily: MONO_FONT, fontSize: 12,
            padding: '8px 16px', border: `2px solid ${TC.ink}`, marginBottom: 10,
            whiteSpace: 'pre-wrap',
          }}>
            <span style={{ color: '#cba6f7' }}>if</span>{' '}(<span style={{ color: '#f9e2af' }}>{decisionExpr}</span>) → Decision <span style={{ color: '#a6e3a1' }}>D</span>
          </div>
          <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey, marginBottom: 16, lineHeight: 1.55 }}>
            Select pairs where exactly one condition changes and the decision flips.
          </div>

          {/* Interactive table */}
          <div style={{ background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: `${TC.blue}15` }}>
                  <th style={thStyle}>TC#</th>
                  <th style={{ ...thStyle, color: pairColors.A }}>A</th>
                  <th style={{ ...thStyle, color: pairColors.B }}>B</th>
                  <th style={{ ...thStyle, color: pairColors.C }}>C</th>
                  <th style={{ ...thStyle, color: TC.green }}>D</th>
                  <th style={thStyle}>PAIRS</th>
                </tr>
              </thead>
              <tbody>
                {TRUTH_TABLE.map(row => {
                  const isSelected = selecting === row.id
                  const inPair = pairs.some(p => p.row1 === row.id || p.row2 === row.id)
                  const conditionsForRow = pairs
                    .filter(p => p.row1 === row.id || p.row2 === row.id)
                    .map(p => p.condition)

                  return (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleRowClick(row.id)}
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleRowClick(row.id) } }}
                      style={{
                        borderBottom: `1px solid ${TC.grid}`,
                        background: isSelected ? `${TC.orange}20` : inPair ? `${TC.green}08` : 'transparent',
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'background 0.06s steps(2)',
                      }}
                    >
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block', width: 24, height: 24, lineHeight: '24px',
                          background: isSelected ? TC.orange : 'transparent',
                          color: isSelected ? '#fff' : TC.ink,
                          border: `2px solid ${isSelected ? TC.orange : TC.ink}`,
                          fontFamily: PIXEL_FONT, fontSize: 9, textAlign: 'center',
                        }}>{row.id}</span>
                      </td>
                      <td style={{ ...tdStyle, color: row.A ? TC.green : TC.magenta, fontWeight: 700 }}>{row.A ? 'T' : 'F'}</td>
                      <td style={{ ...tdStyle, color: row.B ? TC.green : TC.magenta, fontWeight: 700 }}>{row.B ? 'T' : 'F'}</td>
                      <td style={{ ...tdStyle, color: row.C ? TC.green : TC.magenta, fontWeight: 700 }}>{row.C ? 'T' : 'F'}</td>
                      <td style={{ ...tdStyle, color: row.D ? TC.green : TC.magenta, fontWeight: 700 }}>{row.D ? 'T' : 'F'}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          {conditionsForRow.map((c, i) => (
                            <span key={i} style={{
                              fontFamily: PIXEL_FONT, fontSize: 8,
                              background: pairColors[c], color: '#fff', padding: '2px 6px',
                            }}>{c}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: feedback.type === 'success' ? `${TC.green}15` : `${TC.magenta}15`,
              border: `2px solid ${feedback.type === 'success' ? TC.green : TC.magenta}`,
              fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.55,
            }}>
              {feedback.type === 'error' ? '⚠  ' : '✓ '}{feedback.msg}
            </div>
          )}

          {/* Selection hint */}
          {selecting !== null && (
            <div style={{
              marginTop: 8, padding: '6px 12px',
              background: `${TC.orange}15`, border: `2px solid ${TC.orange}`,
              fontFamily: PIXEL_FONT, fontSize: 8, color: TC.orange,
            }}>
              ROW {selecting} SELECTED — Click another row to form a pair
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey }}>
              Pairs: <strong style={{ color: TC.blue }}>{pairs.length}</strong> / Need: <strong>3</strong> (one per condition)
            </div>
            <PixelButton
              variant={pairs.length >= 3 ? 'success' : 'primary'}
              onClick={() => onNavigate('trial')}
              disabled={pairs.length < 3}
            >
              SUBMIT EVIDENCE →
            </PixelButton>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Evidence Log + CLEAR (moved here — H12) */}
          <div style={{ padding: 14, border: `3px solid ${TC.ink}`, background: TC.cream, boxShadow: `4px 4px 0 ${TC.ink}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.blue }}>EVIDENCE LOG</div>
              {pairs.length > 0 && !clearConfirm && (
                <PixelButton small variant="danger" onClick={() => setClearConfirm(true)}>CLEAR</PixelButton>
              )}
            </div>
            {/* CLEAR confirmation inline — H06 */}
            {clearConfirm && (
              <div style={{ marginBottom: 10, padding: '8px 10px', background: `${TC.magenta}10`, border: `2px solid ${TC.magenta}` }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta, marginBottom: 8 }}>Delete all pairs?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <PixelButton small variant="danger" onClick={() => { clearPairs(); setClearConfirm(false) }}>YES, CLEAR</PixelButton>
                  <PixelButton small variant="secondary" onClick={() => setClearConfirm(false)}>CANCEL</PixelButton>
                </div>
              </div>
            )}
            {pairs.length === 0 ? (
              <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey, fontStyle: 'italic', lineHeight: 1.5 }}>No pairs submitted yet...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pairs.map((p, i) => (
                  <div key={i} style={{
                    padding: '6px 10px',
                    background: `${pairColors[p.condition]}10`,
                    border: `1px solid ${pairColors[p.condition]}`,
                  }}>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: pairColors[p.condition] }}>
                      COND {p.condition}: TC{p.row1} ↔ TC{p.row2}
                    </div>
                    <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey, marginTop: 4 }}>
                      {p.condition} flips, D flips ✓
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <CoverageMeter value={Math.round((pairs.length / 3) * 100)} max={100} label={`${techniqueLabel} COVERAGE`} color={TC.green} width={250} />

          {/* Law card reference — H22 */}
          {lawCard && (
            <div>
              <PixelButton small variant="secondary" onClick={() => setShowLawCard(v => !v)}>
                {showLawCard ? '▲ HIDE LAW REF' : '▼ LAW REFERENCE'}
              </PixelButton>
              {showLawCard && (
                <div style={{ marginTop: 8, background: `${TC.orange}08`, border: `2px solid ${TC.orange}`, padding: 12 }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.orange, marginBottom: 6 }}>
                    {lawCard.iso_clause}
                  </div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.ink, marginBottom: 8, lineHeight: 1.4 }}>
                    {lawCard.title}
                  </div>
                  <div style={{ fontFamily: HAND_FONT, fontSize: 15, color: TC.ink, lineHeight: 1.55 }}>
                    {lawCard.short_definition}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <ProsecutorSprite size={90} pose={pairs.length >= 2 ? 'pointing' : 'idle'} />
          </div>
        </div>
      </div>
    </div>
  )
}
