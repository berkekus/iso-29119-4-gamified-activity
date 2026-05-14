import { useEffect, useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import ScoreChip from '../../ui/ScoreChip'
import CoverageMeter from '../../ui/CoverageMeter'
import { JudgeSprite } from '../../ui/CharacterSprites'
import { TRUTH_TABLE } from '../../engine/coverage/mcdc'
import { useGameStore } from '../../stores/gameStore'
import type { AnswerPayload } from '../../stores/gameStore'
import {
  OptionListPicker,
  CoverageTablePicker,
  TestDesignerPicker,
  NumericInputPicker,
  DialogueObjectionPicker,
  EvidenceBoardPicker,
  BudgetStrategyPicker,
  McdcPairBuilderPicker,
} from '../QuestionRenderer'
import type { SectionProps } from './types'

const TECHNIQUE_LABEL: Record<string, string> = {
  STATEMENT: 'STATEMENT',
  BRANCH:    'BRANCH',
  DECISION:  'DECISION',
  BC:        'BC',
  BCC:       'BCC',
  MCDC:      'MC/DC',
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

function pickOptionExplanation(
  caseFile: import('../../engine/caseLoader').CaseFile,
  payload: AnswerPayload,
  isCorrect: boolean,
): string | null {
  if (payload.kind === 'binary_verdict' || payload.kind === 'level_picker') {
    const opt = (caseFile.options ?? []).find((o) => o.id === payload.optionId)
    return opt?.explanation ?? null
  }
  return isCorrect
    ? caseFile.correct_answer_explanation ?? null
    : caseFile.wrong_answer_explanation ?? null
}

export default function InvestigationSection({ isCompleted, onAdvance }: SectionProps) {
  const { mcdc, toggleRow, caseFile, submitAnswer } = useGameStore()
  const [validated, setValidated] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [hintLevel, setHintLevel] = useState(0)
  const decisionExpr = caseFile?.scenario.decision_expression || 'A && (B || C)'

  const techniqueLabel =
    (caseFile?.technique && TECHNIQUE_LABEL[caseFile.technique]) ?? 'CASE'
  const questionType = caseFile?.question_type ?? 'pair_selector'

  useEffect(() => {
    if (!isCompleted) {
      setValidated(false)
      setFeedback(null)
    }
  }, [isCompleted])

  const handleAnswer = (payload: AnswerPayload) => {
    if (!caseFile) return
    const passed = submitAnswer(payload)
    if (passed) {
      const msg =
        pickOptionExplanation(caseFile, payload, true) ??
        caseFile.correct_answer_explanation ??
        'Correct. The claim has been certified.'
      setFeedback({ type: 'success', msg })
    } else {
      const msg =
        pickOptionExplanation(caseFile, payload, false) ??
        caseFile.wrong_answer_explanation ??
        'Not quite. The court will now convene.'
      setFeedback({ type: 'error', msg })
    }
  }

  const selectedCount = mcdc.selectedRows.length

  const handleValidate = () => {
    if (selectedCount >= 4) {
      setValidated(true)
      setFeedback({ type: 'success', msg: 'Model accepted. The judge approves your truth table construction. Proceed to evidence derivation.' })
    } else {
      setFeedback({
        type: 'error',
        msg: 'Insufficient rows selected. The required coverage standard needs at least N+1 = 4 test cases for 3 conditions. Review your selection.',
      })
    }
  }

  // ─── Non-pair_selector branch ─────────────────────────────────────────────
  if (questionType !== 'pair_selector') {
    const claim = caseFile?.claim ?? ''
    const narrative = caseFile?.scenario.narrative ?? ''
    const code = caseFile?.scenario.code ?? ''
    const testSet = caseFile?.test_set ?? []

    return (
      <div style={{
        opacity: isCompleted ? 0.65 : 1,
        pointerEvents: isCompleted ? 'none' : 'auto',
        transition: 'opacity 0.2s',
      }}>
        {isCompleted && (
          <div style={{
            fontFamily: PIXEL_FONT, fontSize: 8, color: TC.green,
            border: `2px solid ${TC.green}`, padding: '4px 10px',
            background: `${TC.green}10`, display: 'inline-block', marginBottom: 14,
          }}>
            ✓ COMPLETED — scroll up to review
          </div>
        )}

        <div className="responsive-row" style={{ gap: 30, maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ flex: 1 }}>
            <div style={{
              background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `5px 5px 0 ${TC.ink}`,
              padding: 24,
            }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 8 }}>CASE BRIEF</div>
              <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.6, marginBottom: 18 }}>
                {narrative}
              </div>

              {code && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.orange, marginBottom: 8 }}>EXHIBIT — SOURCE CODE</div>
                  <div style={{
                    background: '#1e1e2e', color: '#cdd6f4', fontFamily: MONO_FONT, fontSize: 13,
                    padding: 16, border: `2px solid ${TC.ink}`, lineHeight: 1.6, overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {code}
                  </div>
                </div>
              )}

              {testSet.length > 0 && questionType !== 'coverage_table' && questionType !== 'test_designer' && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.blue, marginBottom: 8 }}>TEST SET ON RECORD</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {testSet.map((t) => (
                      <div key={t.id} style={{
                        fontFamily: MONO_FONT, fontSize: 12, color: TC.ink, lineHeight: 1.55,
                        padding: '6px 10px', background: `${TC.blue}10`, border: `1px solid ${TC.blue}`,
                      }}>
                        <strong>{t.id}</strong>: inputs = {JSON.stringify(t.inputs)} → outcome = {String(t.outcome)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {claim && (
                <div style={{
                  background: `${TC.magenta}10`, border: `2px solid ${TC.magenta}`, padding: 14,
                  marginTop: 8,
                }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginBottom: 8 }}>THE CLAIM UNDER REVIEW</div>
                  <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.55 }}>
                    "{claim}"
                  </div>
                </div>
              )}

              {caseFile && (questionType === 'binary_verdict' || questionType === 'level_picker') && (
                <OptionListPicker caseFile={caseFile} feedback={feedback} onSubmit={handleAnswer} />
              )}
              {caseFile && questionType === 'coverage_table' && (
                <CoverageTablePicker caseFile={caseFile} feedback={feedback} onSubmit={handleAnswer} />
              )}
              {caseFile && questionType === 'test_designer' && (
                <TestDesignerPicker caseFile={caseFile} feedback={feedback} onSubmit={handleAnswer} />
              )}
              {caseFile && questionType === 'numeric_input' && (
                <NumericInputPicker caseFile={caseFile} feedback={feedback} onSubmit={handleAnswer} />
              )}
              {caseFile && questionType === 'dialogue_objection' && (
                <DialogueObjectionPicker caseFile={caseFile} feedback={feedback} onSubmit={handleAnswer} />
              )}
              {caseFile && questionType === 'evidence_board' && (
                <EvidenceBoardPicker caseFile={caseFile} feedback={feedback} onSubmit={handleAnswer} />
              )}
              {caseFile && questionType === 'budget_strategy' && (
                <BudgetStrategyPicker caseFile={caseFile} feedback={feedback} onSubmit={handleAnswer} />
              )}
              {caseFile && questionType === 'mcdc_pair_builder' && (
                <McdcPairBuilderPicker caseFile={caseFile} feedback={feedback} onSubmit={handleAnswer} />
              )}
              
              {feedback && !isCompleted && (
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <PixelButton
                    variant={feedback.type === 'success' ? 'primary' : 'danger'}
                    onClick={onAdvance}
                  >
                    PROCEED TO TRIAL →
                  </PixelButton>
                </div>
              )}
            </div>
          </div>

          <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: 16, border: `3px solid ${TC.ink}`, background: TC.cream, boxShadow: `4px 4px 0 ${TC.ink}` }}>
              <JudgeSprite size={90} />
              <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, marginTop: 10, lineHeight: 1.55 }}>
                "Read the claim carefully. Does the evidence support it under the required coverage standard?"
              </div>
            </div>

            {(caseFile?.hints?.length ?? 0) > 0 && (
              <div style={{ padding: 14, border: `2px solid ${TC.grid}`, background: TC.cream }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.blue }}>
                    HINT {hintLevel + 1}/{caseFile?.hints?.length}
                  </div>
                  {hintLevel < (caseFile?.hints?.length ?? 1) - 1 && (
                    <button
                      onClick={() => setHintLevel((h) => h + 1)}
                      style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.orange, background: 'none', border: `1px solid ${TC.orange}`, padding: '3px 8px', cursor: 'pointer' }}
                    >
                      NEXT →
                    </button>
                  )}
                </div>
                <div style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.ink, lineHeight: 1.6 }}>
                  {caseFile?.hints?.[hintLevel]}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── pair_selector branch (MC/DC truth-table flow) ────────────────────────
  return (
    <div style={{
      opacity: isCompleted ? 0.65 : 1,
      pointerEvents: isCompleted ? 'none' : 'auto',
      transition: 'opacity 0.2s',
    }}>
      {isCompleted && (
        <div style={{
          fontFamily: PIXEL_FONT, fontSize: 8, color: TC.green,
          border: `2px solid ${TC.green}`, padding: '4px 10px',
          background: `${TC.green}10`, display: 'inline-block', marginBottom: 14,
        }}>
          ✓ COMPLETED — scroll up to review
        </div>
      )}

      <div className="responsive-row" style={{ gap: 30, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey }}>
              TRUTH TABLE — {decisionExpr}
            </div>
            <ScoreChip label="SELECTED" value={selectedCount} color={TC.blue} />
          </div>

          <div style={{
            background: '#1e1e2e', color: '#cdd6f4', fontFamily: MONO_FONT, fontSize: 12,
            padding: '10px 16px', border: `2px solid ${TC.ink}`, marginBottom: 16,
            whiteSpace: 'pre-wrap',
          }}>
            <span style={{ color: '#cba6f7' }}>if</span>{' '}(<span style={{ color: '#f9e2af' }}>{decisionExpr}</span>) → Decision <span style={{ color: '#a6e3a1' }}>D</span>
          </div>

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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey }}>
              Selected: <strong style={{ color: TC.blue }}>{selectedCount}</strong> / Required: <strong>≥ 4</strong> (N+1)
            </div>
            <PixelButton
              variant={validated ? 'success' : 'primary'}
              onClick={validated ? onAdvance : handleValidate}
            >
              {validated ? 'PROCEED TO EVIDENCE →' : 'VALIDATE MODEL'}
            </PixelButton>
          </div>

          {feedback && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: feedback.type === 'success' ? `${TC.green}15` : `${TC.magenta}15`,
              border: `2px solid ${feedback.type === 'success' ? TC.green : TC.magenta}`,
              fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.55,
            }}>
              {feedback.type === 'error' && '⚠  '}{feedback.msg}
            </div>
          )}
        </div>

        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, border: `3px solid ${TC.ink}`, background: TC.cream, boxShadow: `4px 4px 0 ${TC.ink}` }}>
            <JudgeSprite size={90} />
            <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, marginTop: 10, lineHeight: 1.55 }}>
              "Build the truth table first. Identify which rows you'll need for your independence pairs."
            </div>
          </div>

          <div style={{ padding: 14, border: `2px solid ${TC.grid}`, background: TC.cream }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.blue, marginBottom: 8 }}>QUICK REF</div>
            <div style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.ink, lineHeight: 1.6 }}>
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
