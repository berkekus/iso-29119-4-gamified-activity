import { useState, useEffect, useRef } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { JudgeSprite, BugSprite } from '../ui/CharacterSprites'
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
    const hostPlayer = players.find((p) => p.isHost)
    const gamePlayers = players.filter((p) => !p.isHost)

    return (
      <CenteredLayout>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey }}>SPEED TRIAL</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 6 }}>ROOM CODE</div>
          <div style={{ fontFamily: MONO_FONT, fontSize: 40, color: TC.ink, letterSpacing: 10 }}>{roomCode}</div>
        </div>

        {/* Host info */}
        {hostPlayer && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: `${TC.orange}18`,
            border: `2px solid ${TC.orange}`,
            padding: '10px 18px',
            width: '100%',
            maxWidth: 380,
            boxSizing: 'border-box',
          }}>
            <div style={{
              background: TC.orange,
              color: '#fff',
              fontFamily: PIXEL_FONT,
              fontSize: 9,
              padding: '3px 8px',
              border: `2px solid ${TC.ink}`,
              flexShrink: 0,
            }}>
              HOST
            </div>
            <span style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink }}>{hostPlayer.nickname}</span>
          </div>
        )}

        <div style={{
          background: TC.cream,
          border: `3px solid ${TC.ink}`,
          boxShadow: `4px 4px 0 ${TC.ink}`,
          padding: '20px 28px',
          width: '100%',
          maxWidth: 380,
          boxSizing: 'border-box',
        }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.ink, marginBottom: 14 }}>
            {gamePlayers.filter((p) => p.connected).length} PLAYER{gamePlayers.filter((p) => p.connected).length !== 1 ? 'S' : ''} IN LOBBY
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gamePlayers.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 0', borderBottom: `1px dashed ${TC.grid}` }}>
                {p.avatar && (
                  <img
                    src={`/assets/${p.avatar}.png`}
                    alt={p.nickname}
                    style={{ width: 44, height: 44, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }}
                  />
                )}
                <span style={{ fontFamily: HAND_FONT, fontSize: 18, color: p.id === playerId ? TC.blue : TC.ink, fontWeight: p.id === playerId ? 700 : 400 }}>
                  {p.nickname}{p.id === playerId ? ' ← YOU' : ''}
                </span>
              </div>
            ))}
            {gamePlayers.length === 0 && (
              <div style={{ fontFamily: HAND_FONT, fontSize: 15, color: TC.grey, textAlign: 'center', padding: '8px 0' }}>
                No players yet…
              </div>
            )}
          </div>
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative', width: '100%' }}>
        {/* Top bar */}
        <PlayerTopBar
          currentRound={currentRound}
          totalRounds={totalRounds}
          timeLeft={timeLeft}
          timeLimitSeconds={currentQuestion.timeLimitSeconds}
          answeredCount={answeredCount}
          totalPlayers={totalPlayerCount}
        />

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
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
      </div>
    )
  }

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  if (roomStatus === 'leaderboard' && roundResult) {
    const myEntry = roundResult.leaderboard.find((e) => e.playerId === playerId)
    const isCorrect = myAnswerAck?.isCorrect ?? false

    return (
      <CenteredLayout>
        {/* Unified Verdict Card */}
        <div style={{
          background: TC.cream,
          border: `4px solid ${isCorrect ? TC.green : TC.magenta}`,
          boxShadow: `8px 8px 0 ${TC.ink}`,
          padding: '28px 36px',
          maxWidth: 600,
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center',
          animation: 'fadeIn 0.3s steps(4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <BugSprite size={100} mood={isCorrect ? 'prisoned' : 'escaped'} />
          </div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.grey, marginBottom: 10 }}>
            ROUND {currentRound} VERDICT
          </div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 32, color: isCorrect ? TC.green : TC.magenta, lineHeight: 1.2, marginBottom: 12 }}>
            {isCorrect ? 'SUSTAINED' : 'OVERRULED'}
          </div>
          {isCorrect && myAnswerAck && (
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 18, color: TC.green, marginBottom: 16 }}>
              +{myAnswerAck.pointsEarned} PTS RECORDED
            </div>
          )}
          {myEntry && (
            <div style={{ fontFamily: MONO_FONT, fontSize: 13, color: TC.grey, marginBottom: 20 }}>
              YOUR RANK: #{myEntry.rank} · {myEntry.score.toLocaleString()} pts total
            </div>
          )}
          <div style={{
            background: isCorrect ? `${TC.green}10` : `${TC.magenta}10`,
            border: `2px solid ${isCorrect ? TC.green : TC.magenta}`,
            padding: '16px 20px',
            fontFamily: HAND_FONT,
            fontSize: 16,
            color: TC.ink,
            lineHeight: 1.5,
            textAlign: 'left',
          }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: isCorrect ? TC.green : TC.magenta, marginBottom: 8, textTransform: 'uppercase' }}>
              EXHIBIT FINDINGS
            </div>
            {roundResult.explanation}
          </div>
        </div>

        <SpeedTrialLeaderboard entries={roundResult.leaderboard} myPlayerId={playerId} />

        {roundResult.isLastRound ? (
          <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey }}>
            Waiting for the bench to commence Grand Jury Final…
          </div>
        ) : (
          <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey }}>
            Waiting for the bench to call the next case…
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
          <JudgeSprite size={120} pose="verdict" />
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: TC.magenta, letterSpacing: 2 }}>GRAND JURY IN SESSION</div>
          <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, textAlign: 'center', maxWidth: 480, lineHeight: 1.5 }}>
            The top 5 counselors are presenting their final arguments to the bench.
            <br /><span style={{ color: TC.grey, fontSize: 15 }}>Watch the live verdict unfold below…</span>
          </div>
        </CenteredLayout>
      )
    }

    const hasAnswered = !!myGrandJuryAnsweredOptionId

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative', width: '100%' }}>
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap',
          background: TC.magenta, color: '#fff', padding: '14px clamp(16px,4vw,40px)', width: '100%', boxSizing: 'border-box',
          position: 'sticky', top: 0, zIndex: 10, justifyContent: 'space-between',
          borderBottom: `3px solid ${TC.ink}`, gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 12, letterSpacing: 2 }}>GRAND JURY FINAL</span>
          </div>
          <TimerChip timeLeft={gjTimeLeft} timeLimitSeconds={grandJuryQuestion?.timeLimitSeconds ?? 45} />
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
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
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      background: TC.cream,
      borderBottom: `3px solid ${TC.ink}`,
      padding: '14px clamp(16px,4vw,40px)',
      width: '100%', boxSizing: 'border-box', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 10,
      gap: 16,
    }}>
      {/* LEFT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          background: TC.orange, color: '#fff', padding: '6px 10px',
          fontFamily: PIXEL_FONT, fontSize: 10, border: `2px solid ${TC.ink}`,
          boxShadow: `2px 2px 0 ${TC.ink}`
        }}>
          SPEED TRIAL
        </div>
        {currentRound > 0 && (
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: TC.ink }}>
            ROUND {currentRound}/{totalRounds}
          </span>
        )}
      </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <TimerChip timeLeft={timeLeft} timeLimitSeconds={timeLimitSeconds} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `2px solid ${TC.ink}`, padding: '4px 10px', boxShadow: `2px 2px 0 ${TC.ink}` }}>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey }}>COUNSELORS:</span>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 11, color: answeredCount === totalPlayers && totalPlayers > 0 ? TC.green : TC.ink }}>
            {answeredCount} / {totalPlayers}
          </span>
        </div>
      </div>
    </div>
  )
}

function TimerChip({ timeLeft, timeLimitSeconds }: {
  timeLeft: number
  timeLimitSeconds: number
}) {
  const ratio = timeLeft / timeLimitSeconds
  const color = ratio > 0.5 ? TC.green : ratio > 0.25 ? TC.orange : TC.magenta
  const secs = Math.ceil(timeLeft)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `2px solid ${TC.ink}`, padding: '4px 8px', boxShadow: `2px 2px 0 ${TC.ink}` }}>
      <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey }}>TIME:</span>
      <div style={{ width: 60, height: 8, background: TC.grid, border: `1px solid ${TC.ink}`, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${ratio * 100}%`, background: color, transition: 'width 0.25s linear, background 0.25s' }} />
      </div>
      <span style={{ fontFamily: MONO_FONT, fontSize: 14, color: TC.ink, minWidth: 28, textAlign: 'right' }}>
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
      background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `6px 6px 0 ${TC.ink}`,
      padding: '32px 36px', maxWidth: 440, width: '100%', textAlign: 'center',
      boxSizing: 'border-box',
    }}>
      <JudgeSprite size={90} pose="idle" />
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey }}>
        COURT IS DELIBERATING<span style={{ animation: 'blink 0.5s steps(2) infinite' }}>...</span>
      </div>
      {ack && (
        <div style={{
          marginTop: 8, padding: '12px 18px', width: '100%', boxSizing: 'border-box',
          background: ack.isCorrect ? `${TC.green}15` : `${TC.magenta}15`,
          border: `2px solid ${ack.isCorrect ? TC.green : TC.magenta}`,
        }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: ack.isCorrect ? TC.green : TC.magenta, marginBottom: 6 }}>
            {ack.isCorrect ? '✓ OBJECTION SUSTAINED!' : '✗ OBJECTION OVERRULED'}
          </div>
          {ack.isCorrect && (
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 22, color: TC.ink }}>
              +{ack.pointsEarned} PTS
            </div>
          )}
        </div>
      )}
      <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, marginTop: 8 }}>
        {answeredCount}/{totalPlayers} counselors have submitted their depositions.
      </div>
    </div>
  )
}
