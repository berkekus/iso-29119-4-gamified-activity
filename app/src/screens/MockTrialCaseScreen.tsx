import { useEffect } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore, getMyCourt } from '../stores/mockTrialStore'
import CaseUpperPanel from './mock-trial-panels/CaseUpperPanel'
import ProsecutorPanel from './mock-trial-panels/ProsecutorPanel'
import DefensePanel from './mock-trial-panels/DefensePanel'
import JuryPanel from './mock-trial-panels/JuryPanel'
import ScribePanel from './mock-trial-panels/ScribePanel'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function MockTrialCaseScreen({ onNavigate, onBack }: Props) {
  const state = useMockTrialStore()
  const { roomState, currentCase, myRole, reset } = state

  useEffect(() => {
    if (roomState?.status === 'reveal')   onNavigate('mock-trial-reveal')
    if (roomState?.status === 'finished') onNavigate('mock-trial-final')
  }, [roomState?.status, onNavigate])

  const myCourt = getMyCourt(state)
  if (!roomState || !currentCase) {
    return <div style={{ padding: 24, fontFamily: HAND_FONT }}>Loading case…</div>
  }
  if (!myCourt || !myRole) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontFamily: HAND_FONT }}>You're a Spectator. Wait for the next case to claim a slot.</p>
        <PixelButton onClick={() => { reset(); onBack() }} variant="secondary">Leave</PixelButton>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720, margin: '0 auto', zIndex: 1, position: 'relative' }}>
      <CaseUpperPanel
        caseData={currentCase}
        phase={roomState.currentPhase ?? 'briefing'}
        endsAt={roomState.phaseEndsAt}
        courtName={myCourt.name}
        caseIdx={roomState.currentCaseIdx}
        caseCount={roomState.caseCount}
      />

      {roomState.currentPhase === 'briefing' && (
        <div style={{ padding: 16, background: TC.cream, border: `2px solid ${TC.ink}`, fontFamily: HAND_FONT, color: TC.ink, textAlign: 'center' }}>
          <h3 style={{ fontFamily: PIXEL_FONT, color: TC.ink, margin: '0 0 8px 0' }}>Read the case carefully.</h3>
          <p>Argument phase begins when the timer runs out.</p>
        </div>
      )}

      {roomState.currentPhase === 'arguing' && (
        <>
          {myRole === 'prosecutor' && <ProsecutorPanel caseData={currentCase} courtId={myCourt.id} />}
          {myRole === 'defense'    && <DefensePanel    caseData={currentCase} courtId={myCourt.id} />}
          {(myRole === 'jury1' || myRole === 'jury2' || myRole === 'scribe') && (
            <WaitingForArguments courtId={myCourt.id} caseData={currentCase} role={myRole} />
          )}
        </>
      )}

      {roomState.currentPhase === 'deliberating' && (
        <>
          {(myRole === 'jury1' || myRole === 'jury2') && <JuryPanel caseData={currentCase} courtId={myCourt.id} />}
          {myRole === 'scribe' && <ScribePanel caseData={currentCase} courtId={myCourt.id} hasJury={!!myCourt.slots.jury1 || !!myCourt.slots.jury2} />}
          {(myRole === 'prosecutor' || myRole === 'defense') && (
            <div style={{ padding: 16, background: TC.cream, border: `2px solid ${TC.ink}`, fontFamily: HAND_FONT, color: TC.ink, textAlign: 'center' }}>
              Arguments are in. Jury is voting and Scribe is writing the verdict…
            </div>
          )}
        </>
      )}
    </div>
  )
}

function WaitingForArguments({ courtId, caseData, role }: { courtId: string; caseData: import('../mock-trial/types').CasePublic; role: string }) {
  const liveArgs = useMockTrialStore((s) => s.liveArguments[courtId])
  return (
    <div style={{ padding: 12, background: TC.cream, border: `2px solid ${TC.ink}`, fontFamily: HAND_FONT, color: TC.ink }}>
      <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 14, margin: '0 0 8px 0' }}>You are the {role.toUpperCase()} — wait for arguments.</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <SideBox title="Prosecutor" color={TC.magenta} card={liveArgs?.prosecutor ? caseData.prosecutorArguments.find((a) => a.id === liveArgs.prosecutor!.argId)?.text : undefined} note={liveArgs?.prosecutor?.sentence} />
        <SideBox title="Defense"    color={TC.green}   card={liveArgs?.defense    ? caseData.defenseArguments.find((a) => a.id === liveArgs.defense!.argId)?.text    : undefined} note={liveArgs?.defense?.sentence} />
      </div>
    </div>
  )
}

function SideBox({ title, color, card, note }: { title: string; color: string; card?: string; note?: string }) {
  return (
    <div style={{ border: `2px solid ${color}`, padding: 8, background: '#fff', minHeight: 80 }}>
      <strong style={{ color }}>{title}</strong>
      {card ? <div style={{ fontSize: 12, marginTop: 4 }}>{card}</div> : <div style={{ fontStyle: 'italic', fontSize: 12, color: '#999', marginTop: 4 }}>(waiting…)</div>}
      {note ? <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>"{note}"</div> : null}
    </div>
  )
}
