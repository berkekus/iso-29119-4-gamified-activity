import { useState, type CSSProperties } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import { useMockTrialStore } from '../../stores/mockTrialStore'
import type { CasePublic, MockTrialPlayer, Side } from '../../mock-trial/types'
import { ArgumentDocket, RolePanelHeader } from './MockTrialVisuals'

export default function JuryPanel({
  caseData,
  courtId,
  player,
}: {
  caseData: CasePublic
  courtId: string
  player?: MockTrialPlayer | null
}) {
  const submitVote = useMockTrialStore((s) => s.submitVote)
  const liveArgs = useMockTrialStore((s) => s.liveArguments[courtId])
  const courtVote = useMockTrialStore((s) => s.liveVotes[courtId])
  const [voted, setVoted] = useState<Side | null>(null)

  const selected = voted ?? courtVote ?? null
  const prosCardText = liveArgs?.prosecutor
    ? caseData.prosecutorArguments.find((a) => a.id === liveArgs.prosecutor!.argId)?.text
    : undefined
  const defCardText = liveArgs?.defense
    ? caseData.defenseArguments.find((a) => a.id === liveArgs.defense!.argId)?.text
    : undefined

  const handleVote = (side: Side) => {
    if (selected) return
    setVoted(side)
    submitVote(side)
  }

  return (
    <div style={{ marginTop: 12, border: `2px solid ${TC.orange}`, padding: 12, background: TC.cream }}>
      <RolePanelHeader
        role="jury1"
        player={player}
        pose={selected ? 'submitted' : 'thinking'}
        title="JURY"
        subtitle="Compare the filed arguments and vote for the stronger side."
      />

      <div className="mt-evidence-grid" style={{ marginBottom: 12 }}>
        <ArgumentDocket
          title="Prosecutor"
          color={TC.magenta}
          card={prosCardText}
          note={liveArgs?.prosecutor?.sentence}
          empty="No attack filed before deliberation."
        />
        <ArgumentDocket
          title="Defense"
          color={TC.green}
          card={defCardText}
          note={liveArgs?.defense?.sentence}
          empty="No counter filed before deliberation."
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <button
          onClick={() => handleVote('prosecutor')}
          disabled={!!selected}
          style={voteButton(TC.magenta, selected === 'prosecutor')}
        >
          Support Prosecutor
        </button>
        <button
          onClick={() => handleVote('defense')}
          disabled={!!selected}
          style={voteButton(TC.green, selected === 'defense')}
        >
          Support Defense
        </button>
      </div>

      {selected ? (
        <div style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 13 }}>
          Vote recorded for {selected === 'prosecutor' ? 'the Prosecutor' : 'the Defense'}. Scribe can now file the verdict.
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PixelButton disabled variant="secondary">Vote Pending</PixelButton>
        </div>
      )}
    </div>
  )
}

function voteButton(tone: string, active: boolean): CSSProperties {
  return {
    padding: 12,
    border: `2px solid ${tone}`,
    cursor: active ? 'default' : 'pointer',
    fontFamily: PIXEL_FONT,
    fontSize: 10,
    textTransform: 'uppercase',
    lineHeight: 1.4,
    background: active ? tone : '#fff',
    color: active ? TC.cream : TC.ink,
    boxShadow: active ? `3px 3px 0 ${TC.ink}` : 'none',
  }
}
