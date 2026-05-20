import { useState, type CSSProperties } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import { useMockTrialStore } from '../../stores/mockTrialStore'
import type { CasePublic, MockTrialPlayer, Verdict } from '../../mock-trial/types'
import { ArgumentDocket, RolePanelHeader } from './MockTrialVisuals'

export default function ScribePanel({
  caseData,
  courtId,
  hasJury,
  player,
}: {
  caseData: CasePublic
  courtId: string
  hasJury: boolean
  player?: MockTrialPlayer | null
}) {
  const submitVerdict = useMockTrialStore((s) => s.submitVerdict)
  const liveArgs = useMockTrialStore((s) => s.liveArguments[courtId])
  const juryVote = useMockTrialStore((s) => s.liveVotes[courtId])
  const [verdict, setVerdict] = useState<Verdict | ''>('')
  const [justification, setJustification] = useState('')
  const [sent, setSent] = useState(false)

  const waitingForJury = hasJury && !juryVote
  const prosCardText = liveArgs?.prosecutor
    ? caseData.prosecutorArguments.find((a) => a.id === liveArgs.prosecutor!.argId)?.text
    : undefined
  const defCardText = liveArgs?.defense
    ? caseData.defenseArguments.find((a) => a.id === liveArgs.defense!.argId)?.text
    : undefined

  const handleSubmit = () => {
    if (!verdict || waitingForJury) return
    submitVerdict(verdict, justification.trim())
    setSent(true)
  }

  return (
    <div style={{ marginTop: 12, border: `2px solid ${TC.blue}`, padding: 12, background: TC.cream }}>
      <RolePanelHeader
        role="scribe"
        player={player}
        pose={sent ? 'submitted' : 'thinking'}
        title="SCRIBE"
        subtitle="Write the court verdict and final justification."
      />

      <div className="mt-evidence-grid" style={{ marginBottom: 12 }}>
        <ArgumentDocket
          title="Prosecutor"
          color={TC.magenta}
          card={prosCardText}
          note={liveArgs?.prosecutor?.sentence}
          empty="No attack filed."
        />
        <ArgumentDocket
          title="Defense"
          color={TC.green}
          card={defCardText}
          note={liveArgs?.defense?.sentence}
          empty="No counter filed."
        />
      </div>

      {sent ? (
        <div style={{ fontFamily: HAND_FONT, color: TC.ink }}>
          Verdict submitted. Waiting for the reveal.
          <div style={{ marginTop: 8, padding: 8, border: `2px dashed ${TC.blue}`, background: '#fff' }}>
            <strong>{formatVerdict(verdict)}</strong>
            <div style={{ marginTop: 4 }}>
              {justification || 'No justification submitted.'}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginBottom: 8 }}>
            Verdict on the claim: <em>"{caseData.claim.text}"</em>
          </div>
          <div style={{ fontFamily: HAND_FONT, color: waitingForJury ? TC.orange : TC.green, marginBottom: 8 }}>
            {waitingForJury
              ? 'Waiting for a Jury vote before final submission.'
              : hasJury
                ? `Jury supports ${juryVote === 'prosecutor' ? 'the Prosecutor' : 'the Defense'}.`
                : 'No Jury slot is filled; Scribe may submit directly.'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => setVerdict('satisfied')}
              style={verdictButton(TC.green, verdict === 'satisfied')}
            >
              Satisfied
            </button>
            <button
              onClick={() => setVerdict('not_satisfied')}
              style={verdictButton(TC.magenta, verdict === 'not_satisfied')}
            >
              Not Satisfied
            </button>
          </div>

          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontFamily: PIXEL_FONT, color: TC.blue, fontSize: 10, marginBottom: 5 }}>
              Final justification
            </span>
            <textarea
              value={justification}
              onChange={(event) => setJustification(event.target.value.slice(0, 200))}
              placeholder="One or two sentences (max 200 chars)."
              rows={3}
              style={{ width: '100%', fontFamily: HAND_FONT, fontSize: 14, padding: 8, border: `2px solid ${TC.ink}` }}
            />
          </label>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: HAND_FONT, color: TC.grey, fontSize: 12 }}>
              {justification.length}/200
            </span>
            <PixelButton onClick={handleSubmit} disabled={!verdict || waitingForJury}>Submit Verdict</PixelButton>
          </div>
        </>
      )}
    </div>
  )
}

function verdictButton(tone: string, active: boolean): CSSProperties {
  return {
    padding: 12,
    border: `2px solid ${tone}`,
    cursor: 'pointer',
    fontFamily: PIXEL_FONT,
    fontSize: 10,
    textTransform: 'uppercase',
    lineHeight: 1.4,
    background: active ? tone : '#fff',
    color: active ? TC.cream : TC.ink,
    boxShadow: active ? `3px 3px 0 ${TC.ink}` : 'none',
  }
}

function formatVerdict(verdict: Verdict | ''): string {
  if (verdict === 'satisfied') return 'Satisfied'
  if (verdict === 'not_satisfied') return 'Not Satisfied'
  return 'No verdict'
}
