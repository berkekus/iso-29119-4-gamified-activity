import { useState } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import { useMockTrialStore } from '../../stores/mockTrialStore'
import type { CasePublic, Verdict } from '../../mock-trial/types'

export default function ScribePanel({ caseData, courtId, hasJury }: { caseData: CasePublic; courtId: string; hasJury: boolean }) {
  const submitVerdict = useMockTrialStore((s) => s.submitVerdict)
  const [verdict, setVerdict] = useState<Verdict | ''>('')
  const [justification, setJustification] = useState('')
  const [sent, setSent] = useState(false)

  void hasJury
  void courtId

  const handleSubmit = () => {
    if (!verdict) return
    submitVerdict(verdict, justification.trim())
    setSent(true)
  }

  return (
    <div style={{ marginTop: 12, border: `2px solid ${TC.blue}`, padding: 12, background: TC.cream }}>
      <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.blue, margin: '0 0 8px 0' }}>
        You are the SCRIBE — submit your court's verdict.
      </h3>
      {sent ? (
        <div style={{ fontFamily: HAND_FONT, color: TC.ink }}>
          Verdict submitted. Waiting for reveal…
        </div>
      ) : (
        <>
          <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginBottom: 8 }}>
            Verdict on the claim: <em>"{caseData.claim.text}"</em>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setVerdict('satisfied')}
              style={{ ...btn, background: verdict === 'satisfied' ? TC.green : '#fff', color: verdict === 'satisfied' ? TC.cream : TC.ink }}>
              Satisfied
            </button>
            <button onClick={() => setVerdict('not_satisfied')}
              style={{ ...btn, background: verdict === 'not_satisfied' ? TC.magenta : '#fff', color: verdict === 'not_satisfied' ? TC.cream : TC.ink }}>
              Not Satisfied
            </button>
          </div>
          <textarea value={justification} onChange={(e) => setJustification(e.target.value.slice(0, 200))}
            placeholder="One-sentence justification (≤200 chars)…" rows={3}
            style={{ width: '100%', fontFamily: HAND_FONT, fontSize: 14, padding: 6, border: `2px solid ${TC.ink}` }} />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <PixelButton onClick={handleSubmit} disabled={!verdict}>Submit Verdict</PixelButton>
          </div>
        </>
      )}
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: 12,
  border: `2px solid ${TC.ink}`,
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  background: '#fff',
  color: TC.ink,
}
