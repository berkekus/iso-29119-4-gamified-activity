import { useState } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../../ui/tokens'
import { useMockTrialStore } from '../../stores/mockTrialStore'
import type { CasePublic, Side } from '../../mock-trial/types'

export default function JuryPanel({ caseData, courtId }: { caseData: CasePublic; courtId: string }) {
  const submitVote = useMockTrialStore((s) => s.submitVote)
  const liveArgs = useMockTrialStore((s) => s.liveArguments[courtId])
  const [voted, setVoted] = useState<Side | null>(null)

  const handle = (side: Side) => { if (voted) return; setVoted(side); submitVote(side) }

  const prosCardText = liveArgs?.prosecutor ? caseData.prosecutorArguments.find((a) => a.id === liveArgs.prosecutor!.argId)?.text : ''
  const defCardText  = liveArgs?.defense    ? caseData.defenseArguments   .find((a) => a.id === liveArgs.defense!.argId)?.text     : ''

  return (
    <div style={{ marginTop: 12, border: `2px solid ${TC.orange}`, padding: 12, background: TC.cream }}>
      <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.orange, margin: '0 0 8px 0' }}>
        You are the JURY — pick the stronger argument.
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <button onClick={() => handle('prosecutor')} disabled={!!voted}
          style={{ ...btn, borderColor: TC.magenta, background: voted === 'prosecutor' ? TC.magenta : '#fff', color: voted === 'prosecutor' ? TC.cream : TC.ink }}>
          <strong style={{ color: TC.magenta }}>Prosecutor</strong>
          <div style={{ fontSize: 12, marginTop: 4 }}>{prosCardText ?? '(no argument)'}</div>
          {liveArgs?.prosecutor?.sentence ? <div style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>"{liveArgs.prosecutor.sentence}"</div> : null}
        </button>
        <button onClick={() => handle('defense')} disabled={!!voted}
          style={{ ...btn, borderColor: TC.green, background: voted === 'defense' ? TC.green : '#fff', color: voted === 'defense' ? TC.cream : TC.ink }}>
          <strong style={{ color: TC.green }}>Defense</strong>
          <div style={{ fontSize: 12, marginTop: 4 }}>{defCardText ?? '(no argument)'}</div>
          {liveArgs?.defense?.sentence ? <div style={{ fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>"{liveArgs.defense.sentence}"</div> : null}
        </button>
      </div>
      {voted && (
        <div style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 13 }}>
          Vote sent. Scribe is writing the verdict…
        </div>
      )}
    </div>
  )
}

const btn: React.CSSProperties = {
  padding: 12,
  border: '2px solid',
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  textAlign: 'left',
}
