import { useState } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import { useMockTrialStore } from '../../stores/mockTrialStore'
import type { CasePublic, MockTrialPlayer } from '../../mock-trial/types'
import { ArgumentDocket, RolePanelHeader } from './MockTrialVisuals'

export default function DefensePanel({
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

  const submitted = liveArgs?.defense ?? null
  const selectedCard = submitted
    ? caseData.defenseArguments.find((a) => a.id === submitted.argId)?.text
    : undefined

  return (
    <div style={{ marginTop: 12, border: `2px solid ${TC.green}`, padding: 12, background: TC.cream }}>
      <RolePanelHeader
        role="defense"
        player={player}
        pose={submitted ? 'submitted' : 'thinking'}
        title="DEFENSE"
        subtitle="Argue that the coverage claim is satisfied."
      />

      {submitted ? (
        <>
          <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginBottom: 8 }}>
            Counter-argument submitted. The docket is waiting for deliberation.
          </div>
          <ArgumentDocket title="Filed counter" color={TC.green} card={selectedCard} note={submitted.sentence} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {caseData.defenseArguments.map((argument) => (
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
                  background: argId === argument.id ? '#f3fff0' : '#fff',
                  border: `2px solid ${argId === argument.id ? TC.green : TC.greyLight}`,
                  padding: 8,
                }}
              >
                <input
                  type="radio"
                  name="defArg"
                  checked={argId === argument.id}
                  onChange={() => setArgId(argument.id)}
                />
                <span>{argument.text}</span>
              </label>
            ))}
          </div>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontFamily: PIXEL_FONT, color: TC.green, fontSize: 10, marginBottom: 5 }}>
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
            <PixelButton onClick={() => argId && submitArgument(argId, sentence.trim())} disabled={!argId}>
              Submit Argument
            </PixelButton>
          </div>
        </>
      )}
    </div>
  )
}
