import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../../ui/tokens'
import type { CasePublic, MockTrialPhase } from '../../mock-trial/types'
import { useEffect, useState } from 'react'

export default function CaseUpperPanel({
  caseData, phase, endsAt, courtName, caseIdx, caseCount,
}: {
  caseData: CasePublic; phase: MockTrialPhase; endsAt: number | null
  courtName: string; caseIdx: number; caseCount: number
}) {
  const remaining = useCountdown(endsAt)
  return (
    <div style={{ border: `2px solid ${TC.ink}`, background: TC.cream, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: PIXEL_FONT, color: TC.ink }}>
          Case {caseIdx + 1} / {caseCount} · {courtName}
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: 22, color: phase === 'arguing' ? TC.orange : TC.ink }}>
          {phase} · {remaining}s
        </span>
      </div>
      <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 18, margin: '0 0 6px 0', color: TC.ink }}>{caseData.title}</h2>
      <div style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 13, marginBottom: 8 }}>
        <strong>Claim:</strong> {caseData.claim.text}
      </div>
      <pre style={{ fontFamily: MONO_FONT, fontSize: 12, background: '#fff', padding: 8, border: `1px solid ${TC.ink}`, overflow: 'auto' }}>
        {caseData.codeSnippet}
      </pre>
      {caseData.testSet.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 12, marginTop: 6 }}>
          <thead>
            <tr>
              <th style={cell}>Test</th>
              <th style={cell}>Inputs</th>
              <th style={cell}>Expected</th>
            </tr>
          </thead>
          <tbody>
            {caseData.testSet.map((t) => (
              <tr key={t.label}>
                <td style={cell}>{t.label}</td>
                <td style={cell}>{Object.entries(t.inputs).map(([k, v]) => `${k}=${v}`).join(', ')}</td>
                <td style={cell}>{t.expected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const cell: React.CSSProperties = { border: `1px solid ${TC.ink}`, padding: '4px 6px' }

function useCountdown(endsAt: number | null): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!endsAt) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endsAt])
  if (!endsAt) return 0
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}
