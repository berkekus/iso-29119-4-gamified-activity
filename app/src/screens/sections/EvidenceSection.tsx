import { useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import ScoreChip from '../../ui/ScoreChip'
import CoverageMeter from '../../ui/CoverageMeter'
import { ProsecutorSprite } from '../../ui/CharacterSprites'
import { TRUTH_TABLE, isValidIndependencePair } from '../../engine/coverage/mcdc'
import { useGameStore } from '../../stores/gameStore'
import type { SectionProps } from './types'

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
  STATEMENT: 'STATEMENT', BRANCH: 'BRANCH', DECISION: 'DECISION',
  BC: 'BC', BCC: 'BCC', MCDC: 'MC/DC',
}

export default function EvidenceSection({ isCompleted, onAdvance }: SectionProps) {
  const { mcdc, addPair, clearPairs, caseFile } = useGameStore()
  const [selecting, setSelecting] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const techniqueLabel =
    (caseFile?.technique && TECHNIQUE_LABEL[caseFile.technique]) ?? 'CASE'

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
      setFeedback({
        type: 'error',
        msg: 'Invalid independence pair. Check: does exactly one condition change? Do the others stay fixed? Does the decision flip?',
      })
    }
    setSelecting(null)
  }

  const pairs = mcdc.independencePairs

  return (
    <div style={{
      opacity: isCompleted ? 0.65 : 1,
      pointerEvents: isCompleted ? 'none' : 'auto',
      transition: 'opacity 0.2s',
    }}>


      <div className="responsive-row" style={{ gap: 30, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.grey, marginBottom: 8 }}>
            INDEPENDENCE PAIRS — Click two rows to form a pair
          </div>
          <div style={{ fontFamily: HAND_FONT, fontSize: 16, fontWeight: 400, color: TC.grey, marginBottom: 16, lineHeight: 1.5 }}>
            Select pairs where exactly one condition changes and the decision flips.
          </div>

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
                      onClick={() => handleRowClick(row.id)}
                      style={{
                        borderBottom: `1px solid ${TC.grid}`,
                        background: isSelected ? `${TC.orange}20` : inPair ? `${TC.green}08` : 'transparent',
                        cursor: 'pointer',
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

          {feedback && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: feedback.type === 'success' ? `${TC.green}15` : `${TC.magenta}15`,
              border: `2px solid ${feedback.type === 'success' ? TC.green : TC.magenta}`,
              fontFamily: HAND_FONT, fontSize: 16, fontWeight: 400, color: TC.ink, lineHeight: 1.5,
            }}>
              {feedback.type === 'error' ? '⚠  ' : '✓ '}{feedback.msg}
            </div>
          )}

          {selecting !== null && (
            <div style={{
              marginTop: 8, padding: '6px 12px',
              background: `${TC.orange}15`, border: `2px solid ${TC.orange}`,
              fontFamily: PIXEL_FONT, fontSize: 8, color: TC.orange,
            }}>
              ROW {selecting} SELECTED — Click another row to form a pair
            </div>
          )}

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey }}>
                Pairs: <strong style={{ color: TC.blue }}>{pairs.length}</strong> / Need: <strong>3</strong> (one per condition)
              </div>
              {pairs.length > 0 && (
                <PixelButton small variant="danger" onClick={clearPairs}>CLEAR</PixelButton>
              )}
            </div>
            <PixelButton
              variant={pairs.length >= 3 ? 'success' : 'primary'}
              onClick={onAdvance}
              disabled={pairs.length < 1}
            >
              SUBMIT EVIDENCE →
            </PixelButton>
          </div>
        </div>

        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 14, border: `3px solid ${TC.ink}`, background: TC.cream, boxShadow: `4px 4px 0 ${TC.ink}` }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.blue, marginBottom: 10 }}>EVIDENCE LOG</div>
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

          <ScoreChip label="PAIRS" value={`${pairs.length}/3`} color={TC.blue} />

          <CoverageMeter value={Math.round((pairs.length / 3) * 100)} max={100} label={`${techniqueLabel} COVERAGE`} color={TC.green} width={250} />

          <div style={{ textAlign: 'center' }}>
            <ProsecutorSprite size={90} pose={pairs.length >= 2 ? 'pointing' : 'idle'} />
          </div>
        </div>
      </div>
    </div>
  )
}
