import { useState } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import { useMockTrialStore } from '../../stores/mockTrialStore'
import type { CasePublic } from '../../mock-trial/types'

export default function ProsecutorPanel({ caseData, courtId }: { caseData: CasePublic; courtId: string }) {
  const submitArgument = useMockTrialStore((s) => s.submitArgument)
  const liveArgs = useMockTrialStore((s) => s.liveArguments[courtId])
  const [argId, setArgId] = useState<string | null>(null)
  const [sentence, setSentence] = useState('')

  const submitted = !!liveArgs?.prosecutor

  const handleSend = () => {
    if (!argId) return
    submitArgument(argId, sentence.trim())
  }

  return (
    <div style={{ marginTop: 12, border: `2px solid ${TC.magenta}`, padding: 12, background: TC.cream }}>
      <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.magenta, margin: '0 0 8px 0' }}>
        You are the PROSECUTOR — argue the claim is NOT satisfied.
      </h3>
      {submitted ? (
        <div style={{ fontFamily: HAND_FONT, color: TC.ink }}>
          Argument submitted. Waiting for Defense and Jury…
          <div style={{ marginTop: 8, padding: 8, background: '#fff', border: `1px dashed ${TC.ink}` }}>
            <strong>Card:</strong> {caseData.prosecutorArguments.find((a) => a.id === liveArgs!.prosecutor!.argId)?.text}<br />
            <strong>Note:</strong> "{liveArgs!.prosecutor!.sentence}"
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {caseData.prosecutorArguments.map((a) => (
              <label key={a.id} style={{ fontFamily: HAND_FONT, color: TC.ink, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <input type="radio" name="prosArg" checked={argId === a.id} onChange={() => setArgId(a.id)} />
                <span>{a.text}</span>
              </label>
            ))}
          </div>
          <textarea
            value={sentence} onChange={(e) => setSentence(e.target.value.slice(0, 140))}
            placeholder="Write one sentence to back this up (≤140 chars)…"
            rows={2}
            style={{ width: '100%', fontFamily: HAND_FONT, fontSize: 14, padding: 6, border: `2px solid ${TC.ink}` }}
          />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <PixelButton onClick={handleSend} disabled={!argId}>Submit Argument</PixelButton>
          </div>
        </>
      )}
    </div>
  )
}
