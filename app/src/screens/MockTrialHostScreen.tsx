import { useEffect } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore } from '../stores/mockTrialStore'
import type { Screen } from '../stores/gameStore'
import type { CourtPublic, CourtResult, MockTrialRole } from '../mock-trial/types'
import { ReadyStamp, RoleAvatar, ROLE_LABEL, ScoreChip, VerdictStamp } from './mock-trial-panels/MockTrialVisuals'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const ROLES: MockTrialRole[] = ['prosecutor', 'defense', 'jury1', 'jury2', 'scribe']

export default function MockTrialHostScreen({ onNavigate, onBack }: Props) {
  const {
    roomState, addCourt, startGame, nextCase, finishGame, hostOverride,
    revealData, reset, error, clearError, skipPhase, togglePause,
  } = useMockTrialStore()

  useEffect(() => {
    if (roomState?.status === 'finished') onNavigate('mock-trial-final')
  }, [roomState?.status, onNavigate])

  const handleBack = () => { reset(); onBack() }

  if (!roomState) {
    return <div style={{ padding: 24 }}><p style={{ fontFamily: HAND_FONT }}>Connecting...</p></div>
  }

  const allReady = roomState.courts.some(isCourtReady)
  const activeCourts = roomState.courts.filter(isCourtReady).length

  return (
    <div style={{ minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 1, position: 'relative' }}>
      <div style={{ border: `3px solid ${TC.ink}`, background: TC.cream, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 26, margin: '0 0 8px' }}>Host Console</h1>
            <p style={{ fontFamily: HAND_FONT, color: TC.ink, margin: 0 }}>
              Room <strong style={{ fontFamily: MONO_FONT, fontSize: 22 }}>{roomState.code}</strong>
              {' | '}Status: <strong>{roomState.status}</strong>
              {roomState.currentPhase ? <> {' | '}Phase: <strong>{roomState.currentPhase}</strong></> : null}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span style={metricStyle}>{activeCourts} ready courts</span>
            <span style={metricStyle}>{roomState.spectators.length} spectators</span>
            {roomState.phasePaused ? <span style={{ ...metricStyle, color: TC.orange }}>paused</span> : null}
          </div>
        </div>

        {roomState.status === 'in_case' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <PixelButton onClick={togglePause} variant={roomState.phasePaused ? 'success' : 'warning'}>
              {roomState.phasePaused ? 'Resume Clock' : 'Pause Clock'}
            </PixelButton>
            <PixelButton onClick={skipPhase} variant="secondary" disabled={!roomState.currentPhase || roomState.currentPhase === 'reveal'}>
              Skip Phase
            </PixelButton>
            <PixelButton onClick={finishGame} variant="danger">End Game</PixelButton>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: TC.magenta, color: TC.cream, padding: 8, fontFamily: HAND_FONT }}>
          {error} <button onClick={clearError} style={{ marginLeft: 8 }}>x</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {roomState.courts.map((court) => (
          <CourtHostCard key={court.id} court={court} />
        ))}
      </div>

      {roomState.status === 'lobby' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <PixelButton onClick={addCourt} disabled={roomState.courts.length >= 12}>Add Court</PixelButton>
          <PixelButton onClick={startGame} disabled={!allReady} variant="success">Start Game</PixelButton>
        </div>
      )}

      {roomState.status === 'reveal' && revealData && (
        <div style={{ border: `3px solid ${TC.ink}`, padding: 14, background: TC.cream }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 18, margin: 0, color: TC.ink }}>
              Official Answer
            </h2>
            <VerdictStamp verdict={revealData.correctVerdict} />
          </div>
          <p style={{ fontFamily: HAND_FONT, color: TC.ink, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {revealData.answerExplanation}
          </p>
          <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 14, margin: '12px 0 8px', color: TC.ink }}>
            Court Justifications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {revealData.courtResults.map((result) => (
              <HostRevealRow key={result.courtId} result={result} onOverride={hostOverride} />
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <PixelButton onClick={nextCase}>Next Case</PixelButton>
            <PixelButton onClick={finishGame} variant="secondary">End Game</PixelButton>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <PixelButton onClick={handleBack} variant="secondary">Close Room</PixelButton>
      </div>
    </div>
  )
}

function CourtHostCard({ court }: { court: CourtPublic }) {
  const ready = isCourtReady(court)
  return (
    <div style={{ border: `2px solid ${ready ? TC.green : TC.ink}`, padding: 10, background: ready ? '#f6ffe8' : TC.cream }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <div>
          <strong style={{ fontFamily: PIXEL_FONT, color: TC.ink }}>{court.name}</strong>
          <span style={{ fontFamily: MONO_FONT, color: TC.blue, marginLeft: 10 }}>Score: {court.totalScore}</span>
        </div>
        <ReadyStamp ready={ready} />
      </div>
      <div className="mt-court-slot-grid">
        {ROLES.map((role) => {
          const player = court.slots[role]
          return (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <RoleAvatar
                role={role}
                player={player}
                size={42}
                pose={player?.connected === false ? 'disconnected' : player ? 'idle' : 'thinking'}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 9 }}>{ROLE_LABEL[role]}</div>
                <div style={{ fontFamily: HAND_FONT, color: player?.connected === false ? TC.magenta : TC.grey, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player ? `${player.nickname}${player.connected ? '' : ' (offline)'}` : 'Open'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HostRevealRow({
  result,
  onOverride,
}: {
  result: CourtResult
  onOverride: (courtId: string, delta: number) => void
}) {
  return (
    <div style={{ border: `2px solid ${TC.ink}`, padding: 10, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <strong style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 12 }}>{result.courtName}</strong>
        <span style={{ fontFamily: MONO_FONT, color: TC.blue }}>Final +{result.caseTotal}</span>
      </div>
      <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginTop: 6 }}>
        <strong>{formatVerdict(result.submission.verdict)}</strong>
        <em> "{result.submission.justification || 'No justification submitted'}"</em>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <ScoreChip label="verdict" value={result.verdictScore} tone={TC.blue} />
        <ScoreChip label="prosecutor" value={result.prosecutorBonus} tone={TC.magenta} />
        <ScoreChip label="defense" value={result.defenseBonus} tone={TC.green} />
        <ScoreChip label="self-score" value={result.juryBonus} tone={TC.orange} />
        {result.hostOverride !== 0 ? <ScoreChip label="override" value={result.hostOverride} tone={TC.grey} /> : null}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={() => onOverride(result.courtId, -1)} style={tinyButton}>-1</button>
        <button onClick={() => onOverride(result.courtId, +1)} style={tinyButton}>+1</button>
      </div>
    </div>
  )
}

function isCourtReady(court: CourtPublic): boolean {
  return Boolean(court.slots.prosecutor && court.slots.defense && court.slots.scribe)
}

function formatVerdict(verdict: string | null): string {
  if (verdict === 'satisfied') return 'Satisfied'
  if (verdict === 'not_satisfied') return 'Not Satisfied'
  return 'No verdict'
}

const metricStyle = {
  border: `2px solid ${TC.ink}`,
  background: '#fff',
  color: TC.ink,
  padding: '5px 8px',
  fontFamily: MONO_FONT,
  fontSize: 12,
}

const tinyButton = {
  border: `2px solid ${TC.ink}`,
  background: TC.cream,
  color: TC.ink,
  fontFamily: MONO_FONT,
  cursor: 'pointer',
  padding: '3px 8px',
}
