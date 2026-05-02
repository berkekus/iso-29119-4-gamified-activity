import { useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import ScoreChip from '../ui/ScoreChip'
import CoverageMeter from '../ui/CoverageMeter'
import { JudgeSprite } from '../ui/CharacterSprites'
import { TRUTH_TABLE } from '../engine/coverage/mcdc'
import { useGameStore } from '../stores/gameStore'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const thStyle = {
  padding: '10px 14px', textAlign: 'center' as const,
  fontFamily: PIXEL_FONT, fontSize: 8, color: TC.ink,
  borderBottom: `2px solid ${TC.ink}`,
}
const tdStyle = {
  padding: '10px 14px', textAlign: 'center' as const,
  fontFamily: MONO_FONT, fontSize: 13,
}

export default function InvestigationScreen({ onNavigate, onBack }: Props) {
  const { mcdc, toggleRow, caseFile } = useGameStore()
  const [validated, setValidated] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const decisionExpr = caseFile?.scenario.decision_expression || 'A && (B || C)'

  const selectedCount = mcdc.selectedRows.length

  const handleValidate = () => {
    if (selectedCount >= 4) {
      setValidated(true)
      setFeedback({ type: 'success', msg: 'Model accepted. The judge approves your truth table construction. Proceed to evidence derivation.' })
    } else {
      setFeedback({ type: 'error', msg: 'Insufficient rows selected. MC/DC requires at least N+1 = 4 test cases for 3 conditions. Review your selection.' })
    }
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: '30px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <PixelButton small variant="secondary" onClick={onBack}>← BRIEFING</PixelButton>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta, padding: '4px 10px', border: `2px solid ${TC.magenta}` }}>MC/DC</span>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.orange, padding: '4px 10px', border: `2px solid ${TC.orange}`, background: `${TC.orange}15` }}>PHASE 2: INVESTIGATION</span>
        </div>
        <ScoreChip label="SELECTED" value={selectedCount} color={TC.blue} />
      </div>

      <div style={{ display: 'flex', gap: 30 }}>
        {/* Main: Truth Table */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 12 }}>
            TRUTH TABLE — {decisionExpr}
          </div>

          {/* Code reminder */}
          <div style={{
            background: '#1e1e2e', color: '#cdd6f4', fontFamily: MONO_FONT, fontSize: 12,
            padding: '10px 16px', border: `2px solid ${TC.ink}`, marginBottom: 16,
            whiteSpace: 'pre-wrap',
          }}>
            <span style={{ color: '#cba6f7' }}>if</span>{' '}(<span style={{ color: '#f9e2af' }}>{decisionExpr}</span>) → Decision <span style={{ color: '#a6e3a1' }}>D</span>
          </div>

          {/* Table */}
          <div style={{ background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: `${TC.blue}15` }}>
                  <th style={thStyle}>TC#</th>
                  <th style={{ ...thStyle, color: TC.blue }}>A</th>
                  <th style={{ ...thStyle, color: TC.blue }}>B</th>
                  <th style={{ ...thStyle, color: TC.blue }}>C</th>
                  <th style={{ ...thStyle, color: TC.green }}>D</th>
                  <th style={thStyle}>SELECT</th>
                </tr>
              </thead>
              <tbody>
                {TRUTH_TABLE.map(row => {
                  const marked = mcdc.selectedRows.includes(row.id)
                  return (
                    <tr
                      key={row.id}
                      onClick={() => toggleRow(row.id)}
                      style={{
                        borderBottom: `1px solid ${TC.grid}`,
                        background: marked ? `${TC.blue}12` : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.06s steps(2)',
                      }}
                    >
                      <td style={tdStyle}>{row.id}</td>
                      <td style={{ ...tdStyle, color: row.A ? TC.green : TC.magenta, fontWeight: 700 }}>{row.A ? 'T' : 'F'}</td>
                      <td style={{ ...tdStyle, color: row.B ? TC.green : TC.magenta, fontWeight: 700 }}>{row.B ? 'T' : 'F'}</td>
                      <td style={{ ...tdStyle, color: row.C ? TC.green : TC.magenta, fontWeight: 700 }}>{row.C ? 'T' : 'F'}</td>
                      <td style={{ ...tdStyle, color: row.D ? TC.green : TC.magenta, fontWeight: 700 }}>{row.D ? 'T' : 'F'}</td>
                      <td style={tdStyle}>
                        <div style={{
                          width: 20, height: 20, border: `2px solid ${TC.ink}`,
                          background: marked ? TC.blue : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto', color: '#fff',
                          fontFamily: PIXEL_FONT, fontSize: 10,
                        }}>
                          {marked ? '✓' : ''}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Info bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey }}>
              Selected: <strong style={{ color: TC.blue }}>{selectedCount}</strong> / Required: <strong>≥ 4</strong> (N+1 for MC/DC)
            </div>
            <PixelButton
              variant={validated ? 'success' : 'primary'}
              onClick={validated ? () => onNavigate('evidence') : handleValidate}
            >
              {validated ? 'PROCEED TO EVIDENCE →' : 'VALIDATE MODEL'}
            </PixelButton>
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: feedback.type === 'success' ? `${TC.green}15` : `${TC.magenta}15`,
              border: `2px solid ${feedback.type === 'success' ? TC.green : TC.magenta}`,
              fontFamily: HAND_FONT, fontSize: 18, color: TC.ink,
            }}>
              {feedback.type === 'error' && '⚠  '}{feedback.msg}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, border: `3px solid ${TC.ink}`, background: TC.cream, boxShadow: `4px 4px 0 ${TC.ink}` }}>
            <JudgeSprite size={90} />
            <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, marginTop: 10, lineHeight: 1.5 }}>
              "Build the truth table first. Identify which rows you'll need for your independence pairs."
            </div>
          </div>

          <div style={{ padding: 14, border: `2px solid ${TC.grid}`, background: TC.cream }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.blue, marginBottom: 8 }}>MC/DC QUICK REF</div>
            <div style={{ fontFamily: MONO_FONT, fontSize: 10, color: TC.ink, lineHeight: 1.6 }}>
              • N conditions → N+1 tests min<br />
              • Each condition must independently<br />
              &nbsp;&nbsp;affect the decision<br />
              • Paired test cases: one condition<br />
              &nbsp;&nbsp;flips, others fixed, outcome flips<br />
              <br />
              <span style={{ color: TC.grey }}>Ref: §5.3.6.2, Annex C.2.3.6</span>
            </div>
          </div>

          <CoverageMeter value={selectedCount > 0 ? Math.min(selectedCount * 20, 100) : 0} max={100} label="MODEL PROGRESS" color={TC.blue} width={250} />
        </div>
      </div>
    </div>
  )
}
