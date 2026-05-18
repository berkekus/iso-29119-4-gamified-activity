import { useState, useEffect, useRef } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import SpeedTrialQuestionCard from './SpeedTrialQuestionCard'
import SpeedTrialLeaderboard from './SpeedTrialLeaderboard'
import { useSpeedTrialStore } from '../stores/speedTrialStore'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function SpeedTrialPlayerScreen({ onNavigate, onBack }: Props) {
  const {
    roomCode, playerId, players, roomStatus,
    currentRound, totalRounds,
    currentQuestion, questionStartedAt,
    answeredCount, totalPlayerCount,
    myAnsweredOptionId, myAnswerAck,
    roundResult,
    grandJuryQuestion, grandJuryQualifiedIds, grandJuryStartedAt,
    myGrandJuryAnsweredOptionId, myGrandJuryAnswerAck,
    finalLeaderboard,
    submitAnswer, reset,
  } = useSpeedTrialStore()

  const [timeLeft, setTimeLeft] = useState<number>(0)
  const timerRef = useRef<number | null>(null)

  // Navigate to winner screen when tournament finishes
  useEffect(() => {
    if (roomStatus === 'finished') onNavigate('speed-trial-winner')
  }, [roomStatus, onNavigate])

  // Countdown timer derived from server startedAt
  useEffect(() => {
    if (!currentQuestion || !questionStartedAt) { setTimeLeft(0); return }

    const tick = () => {
      const elapsed = (Date.now() - questionStartedAt) / 1000
      const remaining = Math.max(0, currentQuestion.timeLimitSeconds - elapsed)
      setTimeLeft(remaining)
    }
    tick()
    timerRef.current = window.setInterval(tick, 250)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentQuestion, questionStartedAt])

  // Grand jury timer
  const [gjTimeLeft, setGjTimeLeft] = useState<number>(0)
  useEffect(() => {
    if (!grandJuryQuestion || !grandJuryStartedAt) { setGjTimeLeft(0); return }
    const tick = () => {
      const elapsed = (Date.now() - grandJuryStartedAt) / 1000
      setGjTimeLeft(Math.max(0, grandJuryQuestion.timeLimitSeconds - elapsed))
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => clearInterval(id)
  }, [grandJuryQuestion, grandJuryStartedAt])

  const handleBack = () => { reset(); onBack() }

  const isGrandJuryQualified = playerId ? grandJuryQualifiedIds.includes(playerId) : false
  const connectedCount = players.filter((p) => p.connected).length

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (roomStatus === 'lobby') {
    return (
      <CenteredLayout>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey }}>SPEED TRIAL</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 6 }}>ROOM CODE</div>
          <div style={{ fontFamily: MONO_FONT, fontSize: 40, color: TC.ink, letterSpacing: 10 }}>{roomCode}</div>
        </div>
        <div style={{
          background: TC.cream,
          border: `3px solid ${TC.ink}`,
          boxShadow: `4px 4px 0 ${TC.ink}`,
          padding: '16px 24px',
          width: '100%',
          maxWidth: 320,
        }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.ink, marginBottom: 10 }}>
            {connectedCount} IN LOBBY
          </div>
          {players.map((p) => (
            <div key={p.id} style={{ fontFamily: HAND_FONT, fontSize: 16, color: p.id === playerId ? TC.blue : TC.ink, padding: '2px 0' }}>
              {p.nickname}{p.id === playerId ? ' ← YOU' : ''}{p.isHost ? ' [HOST]' : ''}
            </div>
          ))}
        </div>
        <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey }}>
          Waiting for the host to start…
        </div>
        <PixelButton variant="secondary" small onClick={handleBack}>← LEAVE</PixelButton>
      </CenteredLayout>
    )
  }

  // ── ACTIVE QUESTION ────────────────────────────────────────────────────────
  if (roomStatus === 'question' && currentQuestion) {
    const hasAnswered = !!myAnsweredOptionId

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative', padding: '12px 16px', gap: 12 }}>
        {/* Top bar */}
        <PlayerTopBar
          currentRound={currentRound}
          totalRounds={totalRounds}
          timeLeft={timeLeft}
          timeLimitSeconds={currentQuestion.timeLimitSeconds}
          answeredCount={answeredCount}
          totalPlayers={totalPlayerCount}
        />

        {hasAnswered ? (
          <WaitingPanel
            ack={myAnswerAck}
            answeredCount={answeredCount}
            totalPlayers={totalPlayerCount}
          />
        ) : (
          <SpeedTrialQuestionCard
            question={currentQuestion}
            selectedOptionId={myAnsweredOptionId}
            correctOptionId={null}
            onSelect={(optId) => submitAnswer(currentQuestion.id, optId)}
            disabled={false}
          />
        )}
      </div>
    )
  }

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  if (roomStatus === 'leaderboard' && roundResult) {
    const myEntry = roundResult.leaderboard.find((e) => e.playerId === playerId)
    const answeredOptionId = myAnswerAck?.correctOptionId ? myAnswerAck.correctOptionId : null

    return (
      <CenteredLayout>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.orange }}>
          ROUND {currentRound} COMPLETE
        </div>

        {myEntry && (
          <div style={{
            background: TC.cream,
            border: `3px solid ${myAnswerAck?.isCorrect ? TC.green : TC.magenta}`,
            boxShadow: `4px 4px 0 ${TC.ink}`,
            padding: '12px 20px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: myAnswerAck?.isCorrect ? TC.green : TC.magenta }}>
              {myAnswerAck?.isCorrect ? '✓ CORRECT' : '✗ WRONG'}
            </div>
            {myAnswerAck?.isCorrect && (
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 18, color: TC.ink, marginTop: 6 }}>
                +{myAnswerAck.pointsEarned}
              </div>
            )}
            <div style={{ fontFamily: HAND_FONT, fontSize: 14, color: TC.grey, marginTop: 4 }}>
              YOUR RANK: #{myEntry.rank} · {myEntry.score} pts
            </div>
          </div>
        )}

        <div style={{
          background: `${TC.blue}11`,
          border: `2px solid ${TC.blue}`,
          padding: '10px 16px',
          maxWidth: 400,
          width: '100%',
        }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.blue }}>EXPLANATION</div>
          <div style={{ fontFamily: HAND_FONT, fontSize: 15, color: TC.ink, marginTop: 6, lineHeight: 1.5 }}>
            {roundResult.explanation}
          </div>
        </div>

        <SpeedTrialLeaderboard entries={roundResult.leaderboard} myPlayerId={playerId} />

        {roundResult.isLastRound && (
          <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey }}>
            Waiting for host to start Grand Jury Final…
          </div>
        )}
        {!roundResult.isLastRound && (
          <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey }}>
            Waiting for host to start next round…
          </div>
        )}
      </CenteredLayout>
    )
  }

  // ── GRAND JURY ─────────────────────────────────────────────────────────────
  if (roomStatus === 'grand_jury') {
    if (!isGrandJuryQualified) {
      return (
        <CenteredLayout>
          <div style={{ fontSize: 48 }}>⚖</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.magenta }}>GRAND JURY IN SESSION</div>
          <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.grey, textAlign: 'center' }}>
            The top 5 players are deciding the final verdict.
            <br />Watch the leaderboard…
          </div>
        </CenteredLayout>
      )
    }

    const hasAnswered = !!myGrandJuryAnsweredOptionId

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative', padding: '12px 16px', gap: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: TC.magenta, color: '#fff', padding: '8px 16px', width: '100%', boxSizing: 'border-box',
        }}>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 9 }}>⚖ GRAND JURY FINAL</span>
          <TimerChip timeLeft={gjTimeLeft} timeLimitSeconds={grandJuryQuestion?.timeLimitSeconds ?? 45} isOrange />
        </div>

        {grandJuryQuestion && (
          hasAnswered ? (
            <WaitingPanel ack={myGrandJuryAnswerAck} answeredCount={answeredCount} totalPlayers={totalPlayerCount} />
          ) : (
            <SpeedTrialQuestionCard
              question={grandJuryQuestion}
              selectedOptionId={myGrandJuryAnsweredOptionId}
              correctOptionId={null}
              onSelect={(optId) => submitAnswer(grandJuryQuestion.id, optId)}
              disabled={false}
            />
          )
        )}
      </div>
    )
  }

  // ── FINISHED ───────────────────────────────────────────────────────────────
  if (roomStatus === 'finished') {
    return (
      <CenteredLayout>
        <SpeedTrialLeaderboard entries={finalLeaderboard} myPlayerId={playerId} isPodium />
      </CenteredLayout>
    )
  }

  return (
    <CenteredLayout>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey }}>Connecting…</div>
      <PixelButton variant="secondary" small onClick={handleBack}>← BACK</PixelButton>
    </CenteredLayout>
  )
}

// ── Small sub-components ───────────────────────────────────────────────────────

function CenteredLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1,
      padding: 24,
      gap: 20,
    }}>
      {children}
    </div>
  )
}

function PlayerTopBar({ currentRound, totalRounds, timeLeft, timeLimitSeconds, answeredCount, totalPlayers }: {
  currentRound: number
  totalRounds: number
  timeLeft: number
  timeLimitSeconds: number
  answeredCount: number
  totalPlayers: number
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      background: TC.ink, color: TC.cream, padding: '8px 14px',
      width: '100%', boxSizing: 'border-box', justifyContent: 'space-between',
    }}>
      <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.orange }}>SPEED TRIAL</span>
      <span style={{ fontFamily: PIXEL_FONT, fontSize: 9 }}>ROUND {currentRound}/{totalRounds}</span>
      <TimerChip timeLeft={timeLeft} timeLimitSeconds={timeLimitSeconds} isOrange />
      <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.green }}>
        {answeredCount}/{totalPlayers}
      </span>
    </div>
  )
}

function TimerChip({ timeLeft, timeLimitSeconds, isOrange }: {
  timeLeft: number
  timeLimitSeconds: number
  isOrange?: boolean
}) {
  const ratio = timeLeft / timeLimitSeconds
  const color = ratio > 0.5 ? TC.green : ratio > 0.25 ? TC.orange : TC.magenta
  const secs = Math.ceil(timeLeft)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 50, height: 6, background: TC.grey, border: `1px solid ${isOrange ? TC.cream : TC.ink}`, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${ratio * 100}%`, background: color, transition: 'width 0.25s linear, background 0.25s' }} />
      </div>
      <span style={{ fontFamily: MONO_FONT, fontSize: 11, color: isOrange ? '#fff' : color, minWidth: 24 }}>
        {secs}s
      </span>
    </div>
  )
}

function WaitingPanel({ ack, answeredCount, totalPlayers }: {
  ack: { isCorrect: boolean; pointsEarned: number } | null
  answeredCount: number
  totalPlayers: number
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`,
      padding: '28px 32px', maxWidth: 380, width: '100%',
    }}>
      {ack ? (
        <>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: ack.isCorrect ? TC.green : TC.magenta }}>
            {ack.isCorrect ? '✓ CORRECT!' : '✗ WRONG'}
          </div>
          {ack.isCorrect && (
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 22, color: TC.ink }}>
              +{ack.pointsEarned} pts
            </div>
          )}
        </>
      ) : (
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey }}>ANSWER SUBMITTED</div>
      )}
      <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey }}>
        {answeredCount}/{totalPlayers} players answered
      </div>
      <div style={{ fontFamily: HAND_FONT, fontSize: 14, color: TC.grey }}>
        Waiting for others…
      </div>
    </div>
  )
}
