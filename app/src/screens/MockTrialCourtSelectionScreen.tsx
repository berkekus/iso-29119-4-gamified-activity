import { useEffect } from 'react'
import { TC, PIXEL_FONT, HAND_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore } from '../stores/mockTrialStore'
import type { MockTrialRole } from '../mock-trial/types'
import type { Screen } from '../stores/gameStore'
import { ReadyStamp, RoleAvatar, ROLE_LABEL } from './mock-trial-panels/MockTrialVisuals'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function MockTrialCourtSelectionScreen({ onNavigate, onBack }: Props) {
  const { roomState, claimSlot, releaseSlot, myCourtId, myRole, nickname, playerId, reset, error, clearError } = useMockTrialStore()

  useEffect(() => {
    if (roomState?.status === 'in_case') onNavigate('mock-trial-case')
    if (roomState?.status === 'reveal') onNavigate('mock-trial-reveal')
    if (roomState?.status === 'finished') onNavigate('mock-trial-final')
  }, [roomState?.status, onNavigate])

  const handleBack = () => { reset(); onBack() }

  if (!roomState) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontFamily: HAND_FONT }}>Connecting...</p>
        <PixelButton onClick={handleBack}>Back</PixelButton>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', zIndex: 1, position: 'relative' }}>
      <h1 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 26, margin: 0 }}>Pick Your Court & Role</h1>
      <p style={{ fontFamily: HAND_FONT, color: TC.ink }}>
        Room <strong style={{ fontFamily: 'monospace', fontSize: 22 }}>{roomState.code}</strong> - You: <strong>{nickname}</strong>
      </p>

      {error && (
        <div style={{ background: TC.magenta, color: TC.cream, padding: 8 }}>
          {error} <button onClick={clearError}>x</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 820 }}>
        {roomState.courts.map((court) => {
          const ready = Boolean(court.slots.prosecutor && court.slots.defense && court.slots.scribe)
          return (
            <div key={court.id} style={{ border: `2px solid ${TC.ink}`, padding: 12, background: TC.cream }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 18, color: TC.ink, margin: 0 }}>{court.name}</h2>
                <ReadyStamp ready={ready} />
              </div>

              <div className="mt-court-slot-grid">
                {(Object.keys(court.slots) as MockTrialRole[]).map((role) => {
                  const occupant = court.slots[role]
                  const isMe = occupant?.id === playerId
                  const taken = occupant !== null
                  return (
                    <button
                      key={role}
                      onClick={() => isMe ? releaseSlot() : claimSlot(court.id, role)}
                      disabled={taken && !isMe}
                      style={{
                        padding: 8,
                        fontFamily: HAND_FONT,
                        background: isMe ? '#eaf4ff' : taken ? '#fff' : TC.cream,
                        color: TC.ink,
                        border: `2px solid ${TC.ink}`,
                        boxShadow: isMe ? `4px 4px 0 ${TC.blue}` : undefined,
                        cursor: taken && !isMe ? 'not-allowed' : 'pointer',
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 4,
                        opacity: occupant && !occupant.connected ? 0.62 : 1,
                      }}
                    >
                      <RoleAvatar
                        player={occupant}
                        role={role}
                        size={48}
                        pose={occupant?.connected === false ? 'disconnected' : taken ? 'idle' : 'thinking'}
                      />
                      <div style={{ fontWeight: 'bold' }}>{ROLE_LABEL[role]}</div>
                      <div style={{ fontSize: 11 }}>{occupant ? occupant.nickname : '(empty)'}</div>
                      {occupant && !occupant.connected ? <div style={{ fontSize: 10, color: TC.magenta }}>offline</div> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16, fontFamily: HAND_FONT, color: TC.ink, fontSize: 14 }}>
        {myCourtId && myRole
          ? <>You're in <strong>{roomState.courts.find(c => c.id === myCourtId)?.name}</strong> as <strong>{ROLE_LABEL[myRole]}</strong>. Waiting for host to start...</>
          : <>Pick a slot above to join a court.</>}
      </div>

      <PixelButton onClick={handleBack} variant="secondary">Leave</PixelButton>
    </div>
  )
}
