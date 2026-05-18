import { useEffect } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import SpeedTrialLeaderboard from './SpeedTrialLeaderboard'
import { useSpeedTrialStore } from '../stores/speedTrialStore'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function SpeedTrialHostScreen({ onNavigate, onBack }: Props) {
  const {
    roomCode, players, roomStatus, playerId,
    currentRound, totalRounds,
    currentQuestion, questionStartedAt, answeredCount, totalPlayerCount,
    roundResult, finalLeaderboard,
    startTournament, nextRound, startGrandJury, finishTournament, reset,
  } = useSpeedTrialStore()

  // Navigate to winner screen when tournament finishes
  useEffect(() => {
    if (roomStatus === 'finished') onNavigate('speed-trial-winner')
  }, [roomStatus, onNavigate])

  const handleBack = () => { reset(); onBack() }

  const connectedCount = players.filter((p) => p.connected).length

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      zIndex: 1,
      padding: '16px 20px',
      gap: 16,
    }}>
      {/* Top bar */}
      <TopBar
        roomCode={roomCode}
        currentRound={currentRound}
        totalRounds={totalRounds}
        answeredCount={answeredCount}
        totalPlayers={totalPlayerCount}
        status={roomStatus}
      />

      {/* ── LOBBY ── */}
      {roomStatus === 'lobby' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 16 }}>
          <RoomCodeDisplay code={roomCode ?? '------'} />

          <div style={{
            background: TC.cream,
            border: `3px solid ${TC.ink}`,
            boxShadow: `4px 4px 0 ${TC.ink}`,
            padding: '16px 24px',
            width: '100%',
            maxWidth: 380,
          }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.ink, marginBottom: 12 }}>
              {connectedCount} PLAYER{connectedCount !== 1 ? 'S' : ''} IN LOBBY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {players.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: p.connected ? TC.green : TC.grey,
                    border: `1px solid ${TC.ink}`,
                    display: 'inline-block',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink }}>
                    {p.nickname}{p.id === playerId ? ' (HOST)' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <PixelButton variant="warning" onClick={startTournament} disabled={connectedCount < 1}>
            START TOURNAMENT ({connectedCount} ready)
          </PixelButton>
          <PixelButton variant="secondary" small onClick={handleBack}>← EXIT ROOM</PixelButton>
        </div>
      )}

      {/* ── ACTIVE QUESTION ── */}
      {(roomStatus === 'question' || roomStatus === 'grand_jury') && currentQuestion && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 580 }}>
          <ActiveQuestionView
            question={currentQuestion}
            startedAt={questionStartedAt}
            answeredCount={answeredCount}
            totalPlayers={totalPlayerCount}
            isGrandJury={roomStatus === 'grand_jury'}
          />
          <div style={{ fontFamily: HAND_FONT, fontSize: 15, color: TC.grey }}>
            Waiting for all players to answer…
          </div>
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {roomStatus === 'leaderboard' && roundResult && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
          <div style={{
            background: `${TC.green}22`,
            border: `3px solid ${TC.green}`,
            padding: '10px 18px',
            maxWidth: 480,
            width: '100%',
          }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.green }}>CORRECT ANSWER</div>
            <div style={{ fontFamily: HAND_FONT, fontSize: 15, color: TC.ink, marginTop: 4 }}>
              {roundResult.explanation}
            </div>
          </div>

          <SpeedTrialLeaderboard
            entries={roundResult.leaderboard}
            myPlayerId={playerId}
          />

          {!roundResult.isLastRound ? (
            <PixelButton variant="primary" onClick={nextRound}>
              NEXT ROUND →
            </PixelButton>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <PixelButton variant="warning" onClick={startGrandJury}>
                START GRAND JURY FINAL
              </PixelButton>
              <PixelButton variant="success" onClick={finishTournament}>
                FINISH NOW
              </PixelButton>
            </div>
          )}
        </div>
      )}

      {roomStatus === 'finished' && finalLeaderboard.length > 0 && (
        <SpeedTrialLeaderboard
          entries={finalLeaderboard}
          myPlayerId={playerId}
          isPodium
        />
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TopBar({ roomCode, currentRound, totalRounds, answeredCount, totalPlayers, status }: {
  roomCode: string | null
  currentRound: number
  totalRounds: number
  answeredCount: number
  totalPlayers: number
  status: string
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: TC.ink,
      color: TC.cream,
      padding: '8px 16px',
      width: '100%',
      boxSizing: 'border-box',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    }}>
      <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.orange }}>SPEED TRIAL</span>
      {currentRound > 0 && (
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 10 }}>
          ROUND {currentRound}/{totalRounds}
        </span>
      )}
      {status === 'question' && (
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.green }}>
          {answeredCount}/{totalPlayers} ANSWERED
        </span>
      )}
      {status === 'grand_jury' && (
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta }}>
          GRAND JURY — {answeredCount}/{totalPlayers}
        </span>
      )}
      {roomCode && (
        <span style={{ fontFamily: MONO_FONT, fontSize: 10, color: TC.greyLight }}>
          ROOM: {roomCode}
        </span>
      )}
    </div>
  )
}

function RoomCodeDisplay({ code }: { code: string }) {
  return (
    <div style={{
      background: TC.cream,
      border: `3px solid ${TC.ink}`,
      boxShadow: `6px 6px 0 ${TC.ink}`,
      padding: '20px 36px',
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 8 }}>
        JOIN AT · ROOM CODE
      </div>
      <div style={{
        fontFamily: MONO_FONT,
        fontSize: 48,
        color: TC.ink,
        letterSpacing: 12,
        lineHeight: 1,
      }}>
        {code}
      </div>
      <div style={{ fontFamily: HAND_FONT, fontSize: 14, color: TC.grey, marginTop: 10 }}>
        Share this code with students to join the tournament
      </div>
    </div>
  )
}

function ActiveQuestionView({ question, startedAt, answeredCount, totalPlayers, isGrandJury }: {
  question: NonNullable<ReturnType<typeof useSpeedTrialStore>['currentQuestion']>
  startedAt: number | null
  answeredCount: number
  totalPlayers: number
  isGrandJury: boolean
}) {
  return (
    <div style={{
      background: TC.cream,
      border: `3px solid ${isGrandJury ? TC.magenta : TC.ink}`,
      boxShadow: `6px 6px 0 ${isGrandJury ? TC.magenta : TC.ink}`,
      padding: '16px 20px',
      width: '100%',
    }}>
      {isGrandJury && (
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginBottom: 8 }}>
          ⚖ GRAND JURY FINAL
        </div>
      )}
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 8 }}>
        {question.technique.replace('_', ' ')} · {question.timeLimitSeconds}s
      </div>
      <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
        {question.prompt}
      </div>
      {question.codeSnippet && (
        <pre style={{
          fontFamily: MONO_FONT,
          fontSize: 11,
          background: '#1A1A1A',
          color: TC.cream,
          padding: '10px 14px',
          marginTop: 10,
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
        }}>
          {question.codeSnippet}
        </pre>
      )}
      <div style={{
        marginTop: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          flex: 1,
          background: TC.grid,
          height: 8,
          border: `2px solid ${TC.ink}`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            background: TC.green,
            width: totalPlayers > 0 ? `${(answeredCount / totalPlayers) * 100}%` : '0%',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.ink, whiteSpace: 'nowrap' }}>
          {answeredCount}/{totalPlayers}
        </span>
      </div>
    </div>
  )
}
