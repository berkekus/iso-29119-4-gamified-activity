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

// ── Dialogue Objection ────────────────────────────────────────────────────────
export function DialogueObjectionPicker({ caseFile, feedback, onSubmit }: BaseProps) {
  const fragments = caseFile.fragments ?? [];
  const requiredCount =
    (caseFile.dialogue_valid_sequences?.[0]?.length) ??
    (caseFile.required_fragments?.length ?? 0);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleFragment = (f: string) => {
    if (selected.includes(f)) {
      setSelected(selected.filter(x => x !== f));
    } else if (selected.length < requiredCount) {
      setSelected([...selected, f]);
    }
  };

  const submit = () => onSubmit({ kind: 'dialogue_objection', selectedFragments: selected });

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 10 }}>
        CROSS-EXAMINATION — Construct your objection
      </div>
      <div style={{ background: TC.cream, border: `3px solid ${TC.ink}`, padding: 16, marginBottom: 16, minHeight: 60, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: TC.magenta, alignSelf: 'center' }}>[OBJECTION!]</span>
        {selected.map((f, i) => (
          <button key={i} onClick={() => toggleFragment(f)} style={{ padding: '6px 10px', background: `${TC.magenta}15`, border: `2px solid ${TC.magenta}`, cursor: 'pointer', fontFamily: HAND_FONT, fontSize: 16 }}>
            {f}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {fragments.map(f => {
          if (selected.includes(f)) return null;
          return (
            <button key={f} onClick={() => toggleFragment(f)} style={{ padding: '6px 10px', background: 'white', border: `2px solid ${TC.ink}`, cursor: 'pointer', fontFamily: HAND_FONT, fontSize: 16 }}>
              {f}
            </button>
          )
        })}
      </div>
      <div style={{ textAlign: 'center' }}>
        <PixelButton variant="primary" onClick={submit} disabled={selected.length !== requiredCount}>PRESENT OBJECTION</PixelButton>
      </div>
      <FeedbackBanner feedback={feedback} />
    </div>
  )
}

// ── Evidence Board ───────────────────────────────────────────────────────────
export function EvidenceBoardPicker({ caseFile, feedback, onSubmit }: BaseProps) {
  const clues = caseFile.evidence_board_clues ?? [];
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else if (selected.length < 2) setSelected([...selected, id]);
  };

  const submit = () => onSubmit({ kind: 'evidence_board', connectedEvidence: [selected[0], selected[1]] });

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 10 }}>
        EVIDENCE BOARD — Connect 2 clues to reveal the blind spot
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {clues.map(c => {
          const sel = selected.includes(c.id);
          return (
            <button key={c.id} onClick={() => toggle(c.id)} style={{
              background: sel ? `${TC.orange}15` : '#fff',
              border: `3px solid ${sel ? TC.orange : TC.ink}`,
              boxShadow: `3px 3px 0 ${TC.ink}`,
              padding: 16, cursor: 'pointer', textAlign: 'left',
              fontFamily: HAND_FONT, fontSize: 16, color: TC.ink,
              position: 'relative'
            }}>
              {c.label}
              {sel && <div style={{ position: 'absolute', top: -5, right: -5, width: 14, height: 14, background: TC.orange, borderRadius: '50%' }} />}
            </button>
          )
        })}
      </div>
      <div style={{ textAlign: 'center' }}>
        <PixelButton variant="primary" onClick={submit} disabled={selected.length !== 2}>CONNECT CLUES</PixelButton>
      </div>
      <FeedbackBanner feedback={feedback} />
    </div>
  )
}

// ── Budget Strategy ──────────────────────────────────────────────────────────
export function BudgetStrategyPicker({ caseFile, feedback, onSubmit }: BaseProps) {
  const rows = caseFile.coverage_table ?? []
  const condIds = caseFile.scenario.conditions.map((c) => c.id)
  const expectedCount = caseFile.required_pick_count ?? 0
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }))
  const selectedIds = rows.filter((r) => selected[r.id]).map((r) => r.id)
  const atLimit = selectedIds.length === expectedCount

  const submit = () => onSubmit({ kind: 'budget_strategy', selectedRowIds: selectedIds });

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.orange, marginBottom: 10 }}>
        SUBPOENA BUDGET — You can only afford {expectedCount} logs. Choose wisely!
      </div>
      <div style={{ background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: `${TC.blue}15` }}>
              <th style={tableHeadStyle}>ID</th>
              {condIds.map((id) => (
                <th key={id} style={{ ...tableHeadStyle, color: TC.blue }}>{id}</th>
              ))}
              <th style={{ ...tableHeadStyle, color: TC.orange }}>SUBPOENA</th>
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
                    background: marked ? `${TC.orange}15` : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <td style={tableCellStyle}>{row.id}</td>
                  {condIds.map((id) => (
                    <td key={id} style={{ ...tableCellStyle, color: row.inputs[id] ? TC.green : TC.magenta, fontWeight: 700 }}>
                      {row.inputs[id] ? 'T' : 'F'}
                    </td>
                  ))}
                  <td style={tableCellStyle}>
                    <div style={{
                      width: 20, height: 20, border: `2px solid ${TC.ink}`,
                      background: marked ? TC.orange : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto', color: '#fff',
                      fontFamily: PIXEL_FONT, fontSize: 10,
                    }}>
                      {marked ? '★' : ''}
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
          Budget Used: <strong style={{ color: atLimit ? TC.green : TC.orange }}>{selectedIds.length}</strong> / {expectedCount}
        </div>
        <PixelButton variant="primary" onClick={submit} disabled={!atLimit}>
          SUBMIT SUBPOENAS
        </PixelButton>
      </div>
      {feedback?.type === 'success' && (
        <div style={{ marginTop: 16, padding: 14, border: `2px dashed ${TC.magenta}`, background: `${TC.magenta}10`, fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, lineHeight: 1.5 }}>
          <strong>UNEXAMINED PATHS:</strong> Your three subpoenas cover {expectedCount} of {rows.length} combinations under full BCC — the rest of the truth table stays dark. Proceed to trial: the debrief will spell out the coverage fraction and how your choices read as prosecution strategy.
        </div>
      )}
      <FeedbackBanner feedback={feedback} />
    </div>
  )
}

// ── MCDC Pair Builder ────────────────────────────────────────────────────────
export function McdcPairBuilderPicker({ caseFile, feedback, onSubmit }: BaseProps) {
  const rows = caseFile.coverage_table ?? []
  const condIds = caseFile.scenario.conditions.map((c) => c.id)
  const expectedCount = caseFile.required_pick_count ?? 0
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }))
  const selectedIds = rows.filter((r) => selected[r.id]).map((r) => r.id)
  const atLimit = selectedIds.length === expectedCount
  const overLimit = selectedIds.length > expectedCount

  const submit = () => onSubmit({ kind: 'mcdc_pair_builder', selectedRowIds: selectedIds });

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.blue, marginBottom: 10 }}>
        MC/DC PAIR BUILDER — Connect the logs to form valid pairs (Max {expectedCount} logs)
      </div>
      
      {/* Evidence Logs Display */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
        {rows.map((row) => {
          const marked = !!selected[row.id]
          return (
            <button
              key={row.id}
              onClick={() => toggle(row.id)}
              style={{
                background: marked ? `${TC.blue}15` : TC.cream,
                border: `3px solid ${marked ? TC.blue : TC.ink}`,
                boxShadow: `3px 3px 0 ${marked ? TC.blue : TC.ink}`,
                padding: 10, cursor: 'pointer', textAlign: 'center',
                fontFamily: MONO_FONT, fontSize: 12, color: TC.ink,
              }}
            >
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: marked ? TC.blue : TC.ink, marginBottom: 8 }}>
                {row.id}
              </div>
              {condIds.map(id => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span>{id}:</span>
                  <strong style={{ color: row.inputs[id] ? TC.green : TC.magenta }}>{row.inputs[id] ? 'T' : 'F'}</strong>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${TC.grid}`, marginTop: 4, paddingTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>OUT:</span>
                <strong style={{ color: row.outcome ? TC.green : TC.magenta }}>{row.outcome ? 'T' : 'F'}</strong>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: overLimit ? TC.magenta : TC.grey }}>
          Logs Selected: <strong style={{ color: atLimit ? TC.green : overLimit ? TC.magenta : TC.blue }}>
            {selectedIds.length}
          </strong> / {expectedCount}
          {overLimit && ' (Too many!)'}
        </div>
        <PixelButton variant="primary" onClick={submit} disabled={!atLimit}>
          CERTIFY MC/DC SUITE
        </PixelButton>
      </div>

      <FeedbackBanner feedback={feedback} />
    </div>
  )
}
