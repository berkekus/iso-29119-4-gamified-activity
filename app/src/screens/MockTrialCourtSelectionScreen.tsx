import { useEffect } from 'react'
import { TC, PIXEL_FONT, HAND_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore } from '../stores/mockTrialStore'
import type { MockTrialRole } from '../mock-trial/types'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const ROLE_LABEL: Record<MockTrialRole, string> = {
  prosecutor: 'Prosecutor',
  defense: 'Defense',
  jury1: 'Jury 1',
  jury2: 'Jury 2',
  scribe: 'Scribe',
}

export default function MockTrialCourtSelectionScreen({ onNavigate, onBack }: Props) {
  const { roomState, claimSlot, releaseSlot, myCourtId, myRole, nickname, playerId, reset, error, clearError } = useMockTrialStore()

  useEffect(() => {
    if (roomState?.status === 'in_case') onNavigate('mock-trial-case')
    if (roomState?.status === 'reveal')  onNavigate('mock-trial-reveal')
    if (roomState?.status === 'finished') onNavigate('mock-trial-final')
  }, [roomState?.status, onNavigate])

  const handleBack = () => { reset(); onBack() }

  if (!roomState) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontFamily: HAND_FONT }}>Connecting…</p>
        <PixelButton onClick={handleBack}>Back</PixelButton>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', zIndex: 1, position: 'relative' }}>
      <h1 style={{ fontFamily: PIXEL_FONT, color: TC.ink, fontSize: 26, margin: 0 }}>Pick Your Court & Role</h1>
      <p style={{ fontFamily: HAND_FONT, color: TC.ink }}>
        Room <strong style={{ fontFamily: 'monospace', fontSize: 22 }}>{roomState.code}</strong> · You: <strong>{nickname}</strong>
      </p>

      {error && (
        <div style={{ background: TC.magenta, color: TC.cream, padding: 8 }}>
          {error} <button onClick={clearError}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 720 }}>
        {roomState.courts.map((court) => {
          const ready = court.slots.prosecutor && court.slots.defense && court.slots.scribe
          return (
            <div key={court.id}
              style={{ border: `2px solid ${TC.ink}`, padding: 12, background: TC.cream }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 18, color: TC.ink, margin: 0 }}>{court.name}</h2>
                <span style={{ fontFamily: HAND_FONT, color: ready ? TC.green : TC.magenta, fontSize: 14 }}>
                  {ready ? '● Ready' : '○ Needs Prosecutor + Defense + Scribe'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {(Object.keys(court.slots) as MockTrialRole[]).map((role) => {
                  const occupant = court.slots[role]
                  const isMe = occupant?.id === playerId
                  const taken = occupant !== null
                  return (
                    <button key={role}
                      onClick={() => isMe ? releaseSlot() : claimSlot(court.id, role)}
                      disabled={taken && !isMe}
                      style={{
                        padding: '8px 4px',
                        fontFamily: HAND_FONT,
                        background: isMe ? TC.blue : taken ? '#ddd' : TC.cream,
                        color: isMe ? TC.cream : TC.ink,
                        border: `2px solid ${TC.ink}`,
                        cursor: taken && !isMe ? 'not-allowed' : 'pointer',
                        minHeight: 50,
                      }}>
                      <div style={{ fontWeight: 'bold' }}>{ROLE_LABEL[role]}</div>
                      <div style={{ fontSize: 11 }}>{occupant ? occupant.nickname : '(empty)'}</div>
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
          ? <>You're in <strong>{roomState.courts.find(c => c.id === myCourtId)?.name}</strong> as <strong>{ROLE_LABEL[myRole]}</strong>. Waiting for host to start…</>
          : <>Pick a slot above to join a court.</>}
      </div>

      <PixelButton onClick={handleBack} variant="secondary">Leave</PixelButton>
    </div>
  )
}
