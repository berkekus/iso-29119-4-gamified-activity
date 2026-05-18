import { useEffect } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { JudgeSprite } from '../ui/CharacterSprites'
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
      width: '100%',
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

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 20px',
        gap: 16,
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* ── LOBBY ── */}
        {roomStatus === 'lobby' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 16 }}>
            <RoomCodeDisplay code={roomCode ?? '------'} />

            <div style={{
              background: TC.cream,
              border: `3px solid ${TC.ink}`,
              boxShadow: `4px 4px 0 ${TC.ink}`,
              padding: '20px 28px',
              width: '100%',
              maxWidth: 440,
              boxSizing: 'border-box',
            }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.ink, marginBottom: 14 }}>
                {connectedCount} PLAYER{connectedCount !== 1 ? 'S' : ''} IN LOBBY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto' }}>
                {players.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 0', borderBottom: `1px dashed ${TC.grid}` }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: p.connected ? TC.green : TC.grey,
                      border: `2px solid ${TC.ink}`,
                      display: 'inline-block',
                      flexShrink: 0,
                    }} />
                    {p.avatar && (
                      <img
                        src={`/assets/${p.avatar}.png`}
                        alt={p.nickname}
                        style={{ width: 44, height: 44, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }}
                      />
                    )}
                    <span style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, fontWeight: p.id === playerId ? 700 : 400 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 720 }}>
            <ActiveQuestionView
              question={currentQuestion}
              startedAt={questionStartedAt}
              answeredCount={answeredCount}
              totalPlayers={totalPlayerCount}
              isGrandJury={roomStatus === 'grand_jury'}
            />
            <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey }}>
              Waiting for all counselors to submit depositions…
            </div>
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {roomStatus === 'leaderboard' && roundResult && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
            <div style={{
              background: `${TC.green}15`,
              border: `4px solid ${TC.green}`,
              boxShadow: `8px 8px 0 ${TC.ink}`,
              padding: '28px 36px',
              maxWidth: 600,
              width: '100%',
              boxSizing: 'border-box',
              textAlign: 'center',
              animation: 'fadeIn 0.3s steps(4)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <JudgeSprite size={100} pose="verdict" isTalking />
              </div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.green, marginBottom: 8 }}>
                ROUND {currentRound} VERDICT ON RECORD
              </div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 24, color: TC.green, marginBottom: 16 }}>
                EXHIBIT CERTIFIED
              </div>
              <div style={{
                background: `${TC.green}10`,
                border: `2px solid ${TC.green}`,
                padding: '16px 20px',
                fontFamily: HAND_FONT,
                fontSize: 16,
                color: TC.ink,
                lineHeight: 1.5,
                textAlign: 'left',
              }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.green, marginBottom: 8, textTransform: 'uppercase' }}>
                  OFFICIAL FINDINGS
                </div>
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
      background: TC.cream,
      borderBottom: `3px solid ${TC.ink}`,
      padding: '14px clamp(16px,4vw,40px)',
      width: '100%',
      boxSizing: 'border-box',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      gap: 16,
    }}>
      {/* LEFT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          background: TC.orange, color: '#fff', padding: '6px 10px',
          fontFamily: PIXEL_FONT, fontSize: 10, border: `2px solid ${TC.ink}`,
          boxShadow: `2px 2px 0 ${TC.ink}`
        }}>
          SPEED TRIAL HOST
        </div>
        {currentRound > 0 && (
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: TC.ink }}>
            ROUND {currentRound}/{totalRounds}
          </span>
        )}
      </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {status === 'question' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `2px solid ${TC.ink}`, padding: '4px 10px', boxShadow: `2px 2px 0 ${TC.ink}` }}>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey }}>COUNSELORS:</span>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 11, color: answeredCount === totalPlayers && totalPlayers > 0 ? TC.green : TC.ink }}>
              {answeredCount} / {totalPlayers} ANSWERS
            </span>
          </div>
        )}
        {status === 'grand_jury' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TC.magenta, color: '#fff', border: `2px solid ${TC.ink}`, padding: '4px 10px', boxShadow: `2px 2px 0 ${TC.ink}` }}>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.cream }}>FINAL:</span>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 11 }}>
              GRAND JURY — {answeredCount} / {totalPlayers}
            </span>
          </div>
        )}
        {roomCode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TC.ink, color: TC.cream, padding: '4px 10px' }}>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 10 }}>ROOM:</span>
            <span style={{ fontFamily: MONO_FONT, fontSize: 14, letterSpacing: 2 }}>{roomCode}</span>
          </div>
        )}
      </div>
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
      padding: '24px 32px',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {isGrandJury && (
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, letterSpacing: 1, color: TC.magenta, marginBottom: 12, fontWeight: 700 }}>
          GRAND JURY FINAL
        </div>
      )}
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey, marginBottom: 12 }}>
        {question.technique.replace('_', ' ')} · {question.timeLimitSeconds}s LIMIT
      </div>
      <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 20 }}>
        {question.prompt}
      </div>
      {question.codeSnippet && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.orange, marginBottom: 8 }}>
            EXHIBIT — SOURCE CODE
          </div>
          <pre style={{
            background: '#1e1e2e',
            color: '#cdd6f4',
            fontFamily: MONO_FONT,
            fontSize: 13,
            padding: 20,
            border: `2px solid ${TC.ink}`,
            lineHeight: 1.6,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}>
            {question.codeSnippet}
          </pre>
        </div>
      )}
      <div style={{
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          flex: 1,
          background: TC.grid,
          height: 10,
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
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.ink, whiteSpace: 'nowrap' }}>
          {answeredCount}/{totalPlayers} COUNSELORS
        </span>
      </div>
    </div>
  )
}
