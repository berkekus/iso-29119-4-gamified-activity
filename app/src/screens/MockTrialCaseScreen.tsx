import { useEffect } from 'react'
import { TC, HAND_FONT, PIXEL_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore, getMyCourt } from '../stores/mockTrialStore'
import CaseUpperPanel from './mock-trial-panels/CaseUpperPanel'
import ProsecutorPanel from './mock-trial-panels/ProsecutorPanel'
import DefensePanel from './mock-trial-panels/DefensePanel'
import JuryPanel from './mock-trial-panels/JuryPanel'
import ScribePanel from './mock-trial-panels/ScribePanel'
import { ArgumentDocket } from './mock-trial-panels/MockTrialVisuals'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function MockTrialCaseScreen({ onNavigate, onBack }: Props) {
  const state = useMockTrialStore()
  const { roomState, currentCase, myRole, reset } = state

  useEffect(() => {
    if (roomState?.status === 'reveal') onNavigate('mock-trial-reveal')
    if (roomState?.status === 'finished') onNavigate('mock-trial-final')
  }, [roomState?.status, onNavigate])

  const myCourt = getMyCourt(state)
  if (!roomState || !currentCase) {
    return <div style={{ padding: 24, fontFamily: HAND_FONT }}>Loading case...</div>
  }
  if (!myCourt || !myRole) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontFamily: HAND_FONT }}>You're a Spectator. Wait for the next case to claim a slot.</p>
        <PixelButton onClick={() => { reset(); onBack() }} variant="secondary">Leave</PixelButton>
      </div>
    )
  }

  const hasJury = Boolean(myCourt.slots.jury1 || myCourt.slots.jury2)

  return (
    <div style={{ minHeight: '100vh', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760, margin: '0 auto', zIndex: 1, position: 'relative' }}>
      <CaseUpperPanel
        caseData={currentCase}
        phase={roomState.currentPhase ?? 'briefing'}
        endsAt={roomState.phaseEndsAt}
        courtName={myCourt.name}
        caseIdx={roomState.currentCaseIdx}
        caseCount={roomState.caseCount}
        paused={roomState.phasePaused}
      />

      {roomState.currentPhase === 'briefing' && (
        <div className="mt-argument-card" style={{ padding: 16, background: TC.cream, border: `2px solid ${TC.ink}`, fontFamily: HAND_FONT, color: TC.ink, textAlign: 'center' }}>
          <h3 style={{ fontFamily: PIXEL_FONT, color: TC.ink, margin: '0 0 8px 0' }}>Case file opened.</h3>
          <p>{roomState.phasePaused ? 'Host paused the court clock.' : 'Argument phase begins when the timer runs out.'}</p>
        </div>
      )}

      {roomState.currentPhase === 'arguing' && (
        <>
          {myRole === 'prosecutor' && <ProsecutorPanel caseData={currentCase} courtId={myCourt.id} player={myCourt.slots.prosecutor} />}
          {myRole === 'defense' && <DefensePanel caseData={currentCase} courtId={myCourt.id} player={myCourt.slots.defense} />}
          {(myRole === 'jury1' || myRole === 'jury2' || myRole === 'scribe') && (
            <WaitingForArguments courtId={myCourt.id} caseData={currentCase} role={myRole} />
          )}
        </>
      )}

      {roomState.currentPhase === 'deliberating' && (
        <>
          {(myRole === 'jury1' || myRole === 'jury2') && <JuryPanel caseData={currentCase} courtId={myCourt.id} player={myCourt.slots[myRole]} />}
          {myRole === 'scribe' && <ScribePanel caseData={currentCase} courtId={myCourt.id} hasJury={hasJury} player={myCourt.slots.scribe} />}
          {(myRole === 'prosecutor' || myRole === 'defense') && (
            <WaitingForArguments courtId={myCourt.id} caseData={currentCase} role="deliberation" />
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
      <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 14, margin: '0 0 8px 0' }}>
        {role === 'deliberation' ? 'Argument docket is closed.' : `You are the ${role.toUpperCase()} - watch the argument docket.`}
      </h3>
      <div className="mt-evidence-grid">
        <ArgumentDocket
          title="Prosecutor"
          color={TC.magenta}
          card={liveArgs?.prosecutor ? caseData.prosecutorArguments.find((a) => a.id === liveArgs.prosecutor!.argId)?.text : undefined}
          note={liveArgs?.prosecutor?.sentence}
        />
        <ArgumentDocket
          title="Defense"
          color={TC.green}
          card={liveArgs?.defense ? caseData.defenseArguments.find((a) => a.id === liveArgs.defense!.argId)?.text : undefined}
          note={liveArgs?.defense?.sentence}
        />
      </div>
    </div>
  )
}
