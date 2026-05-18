import { useEffect, useMemo, useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../../ui/tokens'
import type { CasePublic, MockTrialPhase } from '../../mock-trial/types'
import { lawCardById } from '../../content/lawCards'

export default function CaseUpperPanel({
  caseData, phase, endsAt, courtName, caseIdx, caseCount, paused,
}: {
  caseData: CasePublic
  phase: MockTrialPhase
  endsAt: number | null
  courtName: string
  caseIdx: number
  caseCount: number
  paused?: boolean
}) {
  const remaining = useCountdown(endsAt, paused)
  const lawCard = useMemo(() => lawCardById(caseData.lawCardRef), [caseData.lawCardRef])
  const [showLaw, setShowLaw] = useState(false)

  return (
    <div className="mt-argument-card" style={{ border: `2px solid ${TC.ink}`, background: TC.cream, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: PIXEL_FONT, color: TC.ink, lineHeight: 1.5 }}>
          Case {caseIdx + 1} / {caseCount} - {courtName}
        </span>
        <span style={{ fontFamily: MONO_FONT, fontSize: 20, color: paused ? TC.magenta : phase === 'arguing' ? TC.orange : TC.ink }}>
          {paused ? 'paused' : phase} - {remaining}s
        </span>
      </div>

      <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 18, margin: '0 0 6px 0', color: TC.ink, lineHeight: 1.5 }}>{caseData.title}</h2>
      <div style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 13, marginBottom: 8 }}>
        <strong>Claim:</strong> {caseData.claim.text}
      </div>

      <button
        onClick={() => setShowLaw((value) => !value)}
        style={{
          fontFamily: PIXEL_FONT,
          fontSize: 9,
          border: `2px solid ${TC.blue}`,
          background: '#fff',
          color: TC.blue,
          padding: '6px 8px',
          marginBottom: 8,
          cursor: 'pointer',
        }}
      >
        {showLaw ? 'Hide Law Card' : 'Show Law Card'} - {lawCard?.title ?? caseData.lawCardRef}
      </button>

      {showLaw && (
        <div className="mt-argument-card" style={{ border: `2px dashed ${TC.blue}`, background: '#fff', padding: 10, marginBottom: 8 }}>
          <div style={{ fontFamily: PIXEL_FONT, color: TC.blue, fontSize: 10, marginBottom: 5 }}>
            {lawCard?.iso_clause ?? 'Reference'} - {lawCard?.title ?? caseData.lawCardRef}
          </div>
          <div style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 13, lineHeight: 1.5 }}>
            {lawCard?.short_definition ?? 'No law card content is available for this reference yet.'}
          </div>
          {lawCard?.pitfall ? (
            <div style={{ fontFamily: HAND_FONT, color: TC.magenta, fontSize: 12, marginTop: 6 }}>
              Pitfall: {lawCard.pitfall}
            </div>
          ) : null}
        </div>
      )}

      <pre style={{ fontFamily: MONO_FONT, fontSize: 12, background: '#fff', padding: 8, border: `1px solid ${TC.ink}`, overflow: 'auto' }}>
        {caseData.codeSnippet}
      </pre>
      {caseData.testSet.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO_FONT, fontSize: 12, marginTop: 6 }}>
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

function useCountdown(endsAt: number | null, paused?: boolean): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!endsAt || paused) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endsAt, paused])
  if (!endsAt || paused) return 0
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}
