import { useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import type { CaseFile } from '../engine/caseLoader'
import type { AnswerPayload } from '../stores/gameStore'

// Per-question-type renderers. Each one builds its own AnswerPayload, hands
// it to the parent on Submit, and shows a per-option / per-input feedback
// banner the parent passes down. Visuals reuse the existing cream-card +
// PixelButton + ink-border tokens — no new design system.

interface BaseProps {
  caseFile: CaseFile
  feedback: { type: 'success' | 'error'; msg: string } | null
  onSubmit: (payload: AnswerPayload) => void
}

// ── Option list (binary_verdict + level_picker) ─────────────────────────────

export function OptionListPicker({ caseFile, feedback, onSubmit }: BaseProps) {
  const [picked, setPicked] = useState<string | null>(null)
  const options = caseFile.options ?? []
  const qType = caseFile.question_type
  const heading = qType === 'binary_verdict' ? 'YOUR VERDICT' : 'CHOOSE THE STRONGEST CORRECT ANSWER'
  const submitDisabled = picked === null

  const submit = () => {
    if (picked === null || qType === undefined) return
    if (qType !== 'binary_verdict' && qType !== 'level_picker') return
    onSubmit({ kind: qType, optionId: picked })
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 10 }}>
        {heading}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt) => {
          const selected = picked === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => setPicked(opt.id)}
              style={{
                textAlign: 'left',
                fontFamily: HAND_FONT,
                fontSize: 18,
                color: TC.ink,
                padding: '10px 14px',
                background: selected ? `${TC.blue}15` : TC.cream,
                border: `3px solid ${selected ? TC.blue : TC.ink}`,
                boxShadow: selected ? `4px 4px 0 ${TC.blue}` : `4px 4px 0 ${TC.ink}`,
                cursor: 'pointer',
                lineHeight: 1.5,
              }}
            >
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginRight: 10 }}>
                {opt.id.replace(/^opt-/, '').toUpperCase()}
              </span>
              {opt.label}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <PixelButton variant="primary" disabled={submitDisabled} onClick={submit}>
          SUBMIT ANSWER
        </PixelButton>
      </div>

      <FeedbackBanner feedback={feedback} />
    </div>
  )
}

// ── Coverage table — toggle test rows ───────────────────────────────────────

export function CoverageTablePicker({ caseFile, feedback, onSubmit }: BaseProps) {
  const rows = caseFile.coverage_table ?? []
  const condIds = caseFile.scenario.conditions.map((c) => c.id)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }))
  const selectedIds = rows.filter((r) => selected[r.id]).map((r) => r.id)

  const submit = () => {
    onSubmit({ kind: 'coverage_table', selectedRowIds: selectedIds })
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 10 }}>
        SELECT TEST ROWS — toggle which tests belong in your suite
      </div>
      <div style={{ background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: `${TC.blue}15` }}>
              <th style={tableHeadStyle}>TC#</th>
              {condIds.map((id) => (
                <th key={id} style={{ ...tableHeadStyle, color: TC.blue }}>{id}</th>
              ))}
              <th style={{ ...tableHeadStyle, color: TC.green }}>OUT</th>
              <th style={tableHeadStyle}>SELECT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const marked = !!selected[row.id]
              return (
                <tr
                  key={row.id}
                  onClick={() => toggle(row.id)}
                  style={{
                    borderBottom: `1px solid ${TC.grid}`,
                    background: marked ? `${TC.blue}12` : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <td style={tableCellStyle}>{row.id}</td>
                  {condIds.map((id) => (
                    <td key={id} style={{ ...tableCellStyle, color: row.inputs[id] ? TC.green : TC.magenta, fontWeight: 700 }}>
                      {row.inputs[id] ? 'T' : 'F'}
                    </td>
                  ))}
                  <td style={{ ...tableCellStyle, color: row.outcome ? TC.green : TC.magenta, fontWeight: 700 }}>
                    {row.outcome ? 'T' : 'F'}
                  </td>
                  <td style={tableCellStyle}>
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
          Selected: <strong style={{ color: TC.blue }}>{selectedIds.length}</strong> / {rows.length}
        </div>
        <PixelButton variant="primary" onClick={submit} disabled={selectedIds.length === 0}>
          SUBMIT TEST SUITE
        </PixelButton>
      </div>

      <FeedbackBanner feedback={feedback} />
    </div>
  )
}

// ── Test designer — pick exactly N rows from a 16-row truth table ───────────

export function TestDesignerPicker({ caseFile, feedback, onSubmit }: BaseProps) {
  const rows = caseFile.coverage_table ?? []
  const condIds = caseFile.scenario.conditions.map((c) => c.id)
  const expectedCount = caseFile.required_pick_count ?? 0
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }))
  const selectedIds = rows.filter((r) => selected[r.id]).map((r) => r.id)
  const atLimit = selectedIds.length === expectedCount
  const overLimit = selectedIds.length > expectedCount

  const submit = () => {
    onSubmit({ kind: 'test_designer', selectedRowIds: selectedIds })
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 10 }}>
        DESIGN MINIMUM TEST SET — pick exactly {expectedCount} of {rows.length} rows
      </div>
      <div style={{ background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: `${TC.blue}15` }}>
              <th style={tableHeadStyle}>ROW</th>
              {condIds.map((id) => (
                <th key={id} style={{ ...tableHeadStyle, color: TC.blue }}>{id}</th>
              ))}
              <th style={{ ...tableHeadStyle, color: TC.green }}>OUT</th>
              <th style={tableHeadStyle}>PICK</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const marked = !!selected[row.id]
              return (
                <tr
                  key={row.id}
                  onClick={() => toggle(row.id)}
                  style={{
                    borderBottom: `1px solid ${TC.grid}`,
                    background: marked ? `${TC.blue}12` : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <td style={tableCellStyle}>{row.id}</td>
                  {condIds.map((id) => (
                    <td key={id} style={{ ...tableCellStyle, color: row.inputs[id] ? TC.green : TC.magenta, fontWeight: 700 }}>
                      {row.inputs[id] ? 'T' : 'F'}
                    </td>
                  ))}
                  <td style={{ ...tableCellStyle, color: row.outcome ? TC.green : TC.magenta, fontWeight: 700 }}>
                    {row.outcome ? 'T' : 'F'}
                  </td>
                  <td style={tableCellStyle}>
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
        <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: overLimit ? TC.magenta : TC.grey }}>
          Selected: <strong style={{ color: atLimit ? TC.green : overLimit ? TC.magenta : TC.blue }}>
            {selectedIds.length}
          </strong> / Required: <strong>{expectedCount}</strong>
          {overLimit && ' — too many'}
        </div>
        <PixelButton variant="primary" onClick={submit} disabled={!atLimit}>
          CERTIFY VAULT
        </PixelButton>
      </div>

      <FeedbackBanner feedback={feedback} />
    </div>
  )
}

// ── Numeric input — one or more labeled number fields ───────────────────────

export function NumericInputPicker({ caseFile, feedback, onSubmit }: BaseProps) {
  const prompts = caseFile.numeric_prompts ?? []
  const [values, setValues] = useState<string[]>(() => prompts.map(() => ''))

  const setAt = (i: number, v: string) =>
    setValues((vs) => vs.map((x, idx) => (idx === i ? v : x)))

  const allFilled = values.every((v) => v.trim() !== '' && !Number.isNaN(Number(v)))

  const submit = () => {
    if (!allFilled) return
    onSubmit({ kind: 'numeric_input', answers: values.map((v) => Number(v)) })
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 10 }}>
        ENTER YOUR ESTIMATES
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {prompts.map((p, i) => (
          <div key={i} style={{
            padding: 14, border: `2px solid ${TC.ink}`, background: TC.cream,
            boxShadow: `3px 3px 0 ${TC.ink}`,
          }}>
            <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, marginBottom: 8 }}>
              {p.question}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                value={values[i] ?? ''}
                onChange={(e) => setAt(i, e.target.value)}
                style={{
                  fontFamily: MONO_FONT, fontSize: 16, color: TC.ink,
                  background: '#fff', border: `2px solid ${TC.ink}`,
                  padding: '6px 10px', width: 120,
                }}
              />
              {p.unit && (
                <span style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.grey }}>{p.unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <PixelButton variant="primary" onClick={submit} disabled={!allFilled}>
          SUBMIT ESTIMATES
        </PixelButton>
      </div>

      <FeedbackBanner feedback={feedback} />
    </div>
  )
}

// ── Shared bits ─────────────────────────────────────────────────────────────

const tableHeadStyle = {
  padding: '10px 14px', textAlign: 'center' as const,
  fontFamily: PIXEL_FONT, fontSize: 8, color: TC.ink,
  borderBottom: `2px solid ${TC.ink}`,
}
const tableCellStyle = {
  padding: '8px 12px', textAlign: 'center' as const,
  fontFamily: MONO_FONT, fontSize: 12,
}

function FeedbackBanner({ feedback }: { feedback: { type: 'success' | 'error'; msg: string } | null }) {
  if (!feedback) return null
  return (
    <div style={{
      marginTop: 14, padding: '10px 14px',
      background: feedback.type === 'success' ? `${TC.green}15` : `${TC.magenta}15`,
      border: `2px solid ${feedback.type === 'success' ? TC.green : TC.magenta}`,
      fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.5,
    }}>
      {feedback.type === 'error' ? '⚠  ' : '✓ '}{feedback.msg}
    </div>
  )
}
