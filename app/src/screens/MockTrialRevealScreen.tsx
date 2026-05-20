import { useEffect, useMemo, useState } from 'react'
import { TC, HAND_FONT, PIXEL_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { getMyCourt, useMockTrialStore } from '../stores/mockTrialStore'
import type { Screen } from '../stores/gameStore'
import type { CasePublic, CourtResult, SelfScore } from '../mock-trial/types'
import { ArgumentDocket, ScoreChip, VerdictStamp } from './mock-trial-panels/MockTrialVisuals'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function MockTrialRevealScreen({ onNavigate, onBack }: Props) {
  const state = useMockTrialStore()
  const { roomState, currentCase, revealData, myRole, myCourtId, submitSelfScore, reset } = state
  const [submittedScore, setSubmittedScore] = useState<SelfScore | null>(null)

  useEffect(() => {
    if (roomState?.status === 'in_case') onNavigate('mock-trial-case')
    if (roomState?.status === 'finished') onNavigate('mock-trial-final')
  }, [roomState?.status, onNavigate])

  const myCourt = getMyCourt(state)
  const myResult = useMemo(
    () => revealData?.courtResults.find((result) => result.courtId === myCourtId) ?? null,
    [revealData?.courtResults, myCourtId],
  )
  const hasJury = Boolean(myCourt?.slots.jury1 || myCourt?.slots.jury2)
  const canSelfScore =
    Boolean(myResult) &&
    (myRole === 'jury1' || myRole === 'jury2' || (myRole === 'scribe' && !hasJury))

  const handleSelfScore = (score: SelfScore) => {
    if (submittedScore !== null) return
    setSubmittedScore(score)
    submitSelfScore(score)
  }

  if (!roomState || !currentCase || !revealData) {
    return (
      <div style={{ padding: 24, fontFamily: HAND_FONT, color: TC.ink }}>
        Loading reveal...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: 16, maxWidth: 840, margin: '0 auto', zIndex: 1, position: 'relative' }}>
      <div style={{ border: `3px solid ${TC.ink}`, background: TC.cream, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 20, margin: 0 }}>Case Reveal</h1>
            <span style={{ fontFamily: MONO_FONT, fontSize: 13, color: TC.grey }}>
              Case {roomState.currentCaseIdx + 1} / {roomState.caseCount}
            </span>
          </div>
          <VerdictStamp verdict={revealData.correctVerdict} />
        </div>

        <h2 style={{ fontFamily: PIXEL_FONT, color: TC.blue, fontSize: 15, margin: '14px 0 6px' }}>
          {currentCase.title}
        </h2>
        {revealData.pitfallTag ? (
          <div style={{ display: 'inline-block', fontFamily: MONO_FONT, color: TC.orange, border: `2px solid ${TC.orange}`, background: '#fff', padding: '3px 7px', marginBottom: 8 }}>
            Pitfall: {revealData.pitfallTag}
          </div>
        ) : null}
        <div style={{ fontFamily: HAND_FONT, color: TC.ink, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
          {revealData.answerExplanation}
        </div>
      </div>

      {myResult && (
        <CourtResultCard result={myResult} caseData={currentCase} title={myCourt?.name ?? 'Your Court'} featured />
      )}

      {canSelfScore && (
        <div style={{ border: `2px solid ${TC.orange}`, background: TC.cream, padding: 12, marginTop: 12 }}>
          <h2 style={{ fontFamily: PIXEL_FONT, color: TC.orange, fontSize: 14, margin: '0 0 8px' }}>
            Self-Score
          </h2>
          <p style={{ fontFamily: HAND_FONT, color: TC.ink, margin: '0 0 10px' }}>
            How aligned is your court justification with the official note?
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <PixelButton onClick={() => handleSelfScore(1)} disabled={submittedScore !== null} variant="success">
              Aligned +1
            </PixelButton>
            <PixelButton onClick={() => handleSelfScore(0.5)} disabled={submittedScore !== null} variant="warning">
              Partial +0.5
            </PixelButton>
            <PixelButton onClick={() => handleSelfScore(0)} disabled={submittedScore !== null} variant="secondary">
              Not Aligned +0
            </PixelButton>
          </div>
          {submittedScore !== null && (
            <div style={{ fontFamily: HAND_FONT, color: TC.green, marginTop: 8 }}>
              Self-score sent. Waiting for the host to continue.
            </div>
          )}
        </div>
      )}

      <div style={{ border: `2px solid ${TC.ink}`, background: TC.cream, padding: 12, marginTop: 12 }}>
        <h2 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 14, margin: '0 0 8px' }}>
          Court Scores
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {revealData.courtResults.map((result) => (
            <CourtResultCard
              key={result.courtId}
              result={result}
              caseData={currentCase}
              compact
              featured={result.courtId === myCourtId}
            />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontFamily: HAND_FONT, color: TC.grey }}>
          Host controls the next case.
        </div>
        <PixelButton onClick={() => { reset(); onBack() }} variant="secondary">
          Leave
        </PixelButton>
      </div>
    </div>
  )
}

function CourtResultCard({
  result,
  caseData,
  title,
  compact = false,
  featured = false,
}: {
  result: CourtResult
  caseData: CasePublic
  title?: string
  compact?: boolean
  featured?: boolean
}) {
  const prosecutorCard = result.submission.prosecutorArgId
    ? caseData.prosecutorArguments.find((a) => a.id === result.submission.prosecutorArgId)?.text
    : undefined
  const defenseCard = result.submission.defenseArgId
    ? caseData.defenseArguments.find((a) => a.id === result.submission.defenseArgId)?.text
    : undefined

  return (
    <div style={{
      border: `2px solid ${featured ? TC.orange : TC.ink}`,
      background: featured ? '#fff7d8' : compact ? '#fff' : TC.cream,
      padding: compact ? 8 : 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: PIXEL_FONT, fontSize: compact ? 11 : 13, color: TC.ink }}>
          {title ?? result.courtName}
        </strong>
        <span style={{ fontFamily: MONO_FONT, color: TC.blue, fontSize: compact ? 15 : 18 }}>
          +{result.caseTotal} pts
        </span>
      </div>

      {!compact && (
        <>
          <div className="mt-evidence-grid" style={{ marginTop: 10 }}>
            <ArgumentDocket
              title="Prosecutor"
              color={TC.magenta}
              card={prosecutorCard}
              note={result.submission.prosecutorSentence}
              empty="No attack filed."
            />
            <ArgumentDocket
              title="Defense"
              color={TC.green}
              card={defenseCard}
              note={result.submission.defenseSentence}
              empty="No counter filed."
            />
          </div>
          <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginTop: 8 }}>
            <div>Verdict: <strong>{formatVerdict(result.submission.verdict)}</strong></div>
            <div>Justification: <em>"{result.submission.justification || 'No justification submitted'}"</em></div>
          </div>
          <ScoreBreakdown result={result} />
        </>
      )}
    </div>
  )
}

function ScoreBreakdown({ result }: { result: CourtResult }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      <ScoreChip label="verdict" value={result.verdictScore} tone={TC.blue} />
      <ScoreChip label="prosecutor" value={result.prosecutorBonus} tone={TC.magenta} />
      <ScoreChip label="defense" value={result.defenseBonus} tone={TC.green} />
      <ScoreChip label="self-score" value={result.juryBonus} tone={TC.orange} />
      {result.hostOverride !== 0 ? <ScoreChip label="override" value={result.hostOverride} tone={TC.grey} /> : null}
    </div>
  )
}

function formatVerdict(verdict: string | null): string {
  if (verdict === 'satisfied') return 'Satisfied'
  if (verdict === 'not_satisfied') return 'Not Satisfied'
  return 'Not submitted'
}
