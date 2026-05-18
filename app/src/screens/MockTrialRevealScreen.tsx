import { useEffect, useMemo, useState } from 'react'
import { TC, HAND_FONT, PIXEL_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { getMyCourt, useMockTrialStore } from '../stores/mockTrialStore'
import type { Screen } from '../stores/gameStore'
import type { CourtResult, SelfScore } from '../mock-trial/types'

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
    () => revealData?.courtResults.find((r) => r.courtId === myCourtId) ?? null,
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
    <div style={{ minHeight: '100vh', padding: 16, maxWidth: 760, margin: '0 auto', zIndex: 1, position: 'relative' }}>
      <div style={{ border: `2px solid ${TC.ink}`, background: TC.cream, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 20, margin: 0 }}>
            Case Reveal
          </h1>
          <span style={{ fontFamily: MONO_FONT, fontSize: 13, color: TC.grey }}>
            Case {roomState.currentCaseIdx + 1} / {roomState.caseCount}
          </span>
        </div>

        <h2 style={{ fontFamily: PIXEL_FONT, color: TC.blue, fontSize: 15, margin: '14px 0 6px' }}>
          {currentCase.title}
        </h2>
        <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginBottom: 10 }}>
          Official verdict:{' '}
          <strong style={{ color: revealData.correctVerdict === 'satisfied' ? TC.green : TC.magenta }}>
            {formatVerdict(revealData.correctVerdict)}
          </strong>
        </div>
        <div style={{ fontFamily: HAND_FONT, color: TC.ink, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
          {revealData.answerExplanation}
        </div>
      </div>

      {myResult && (
        <CourtResultCard result={myResult} title={myCourt?.name ?? 'Your Court'} />
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
            <CourtResultCard key={result.courtId} result={result} compact />
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

function CourtResultCard({ result, title, compact = false }: { result: CourtResult; title?: string; compact?: boolean }) {
  return (
    <div style={{ border: `2px solid ${TC.ink}`, background: compact ? '#fff' : TC.cream, padding: compact ? 8 : 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: PIXEL_FONT, fontSize: compact ? 11 : 13, color: TC.ink }}>
          {title ?? result.courtName}
        </strong>
        <span style={{ fontFamily: MONO_FONT, color: TC.blue }}>
          +{result.caseTotal} pts
        </span>
      </div>
      {!compact && (
        <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginTop: 8 }}>
          <div>Verdict: <strong>{result.submission.verdict ? formatVerdict(result.submission.verdict) : 'Not submitted'}</strong></div>
          <div>Justification: <em>"{result.submission.justification || 'No justification submitted'}"</em></div>
          <div style={{ marginTop: 6, fontFamily: MONO_FONT, fontSize: 12 }}>
            Verdict {result.verdictScore} + Prosecutor {result.prosecutorBonus} + Defense {result.defenseBonus} + Self-score {result.juryBonus}
          </div>
        </div>
      )}
    </div>
  )
}

function formatVerdict(verdict: string): string {
  return verdict === 'satisfied' ? 'Satisfied' : 'Not Satisfied'
}
