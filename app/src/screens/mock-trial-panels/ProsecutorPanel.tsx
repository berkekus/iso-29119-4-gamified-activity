import { useState } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import { useMockTrialStore } from '../../stores/mockTrialStore'
import type { CasePublic, MockTrialPlayer } from '../../mock-trial/types'
import { ArgumentDocket, RolePanelHeader } from './MockTrialVisuals'

export default function ProsecutorPanel({
  caseData,
  courtId,
  player,
}: {
  caseData: CasePublic
  courtId: string
  player?: MockTrialPlayer | null
}) {
  const submitArgument = useMockTrialStore((s) => s.submitArgument)
  const liveArgs = useMockTrialStore((s) => s.liveArguments[courtId])
  const [argId, setArgId] = useState<string | null>(null)
  const [sentence, setSentence] = useState('')

  const submitted = liveArgs?.prosecutor ?? null
  const selectedCard = submitted
    ? caseData.prosecutorArguments.find((a) => a.id === submitted.argId)?.text
    : undefined

  const handleSend = () => {
    if (!argId) return
    submitArgument(argId, sentence.trim())
  }

  return (
    <div style={{ marginTop: 12, border: `2px solid ${TC.magenta}`, padding: 12, background: TC.cream }}>
      <RolePanelHeader
        role="prosecutor"
        player={player}
        pose={submitted ? 'submitted' : 'thinking'}
        title="PROSECUTOR"
        subtitle="Argue that the coverage claim is not satisfied."
      />

      {submitted ? (
        <>
          <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginBottom: 8 }}>
            Argument submitted. The docket is waiting for deliberation.
          </div>
          <ArgumentDocket title="Filed attack" color={TC.magenta} card={selectedCard} note={submitted.sentence} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {caseData.prosecutorArguments.map((argument) => (
              <label
                key={argument.id}
                className={argId === argument.id ? 'mt-argument-card' : undefined}
                style={{
                  fontFamily: HAND_FONT,
                  color: TC.ink,
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  background: argId === argument.id ? '#fff5fb' : '#fff',
                  border: `2px solid ${argId === argument.id ? TC.magenta : TC.greyLight}`,
                  padding: 8,
                }}
              >
                <input
                  type="radio"
                  name="prosArg"
                  checked={argId === argument.id}
                  onChange={() => setArgId(argument.id)}
                />
                <span>{argument.text}</span>
              </label>
            ))}
          </div>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontFamily: PIXEL_FONT, color: TC.magenta, fontSize: 10, marginBottom: 5 }}>
              One-sentence backing
            </span>
            <textarea
              value={sentence}
              onChange={(event) => setSentence(event.target.value.slice(0, 140))}
              placeholder="Write one sentence to back this up (max 140 chars)."
              rows={2}
              style={{ width: '100%', fontFamily: HAND_FONT, fontSize: 14, padding: 8, border: `2px solid ${TC.ink}` }}
            />
          </label>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: HAND_FONT, color: TC.grey, fontSize: 12 }}>
              {sentence.length}/140
            </span>
            <PixelButton onClick={handleSend} disabled={!argId}>Submit Argument</PixelButton>
          </div>
        </>
      )}
    </div>
  )
}
