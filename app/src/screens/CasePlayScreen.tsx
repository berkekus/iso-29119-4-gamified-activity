import { useEffect, useRef } from 'react'
import { TC, PIXEL_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useGameStore } from '../stores/gameStore'
import type { Screen } from '../stores/gameStore'
import type { GamePhase } from '../engine/types'

import BriefingSection     from './sections/BriefingSection'
import InvestigationSection from './sections/InvestigationSection'
import EvidenceSection     from './sections/EvidenceSection'
import TrialSection        from './sections/TrialSection'
import DebriefSection      from './sections/DebriefSection'

interface Props {
  onNavigateOut: (screen: Screen) => void
}

const PHASES: GamePhase[] = ['briefing', 'investigation', 'evidence', 'trial', 'debrief']

const PHASE_COLORS: Record<GamePhase, string> = {
  briefing:      TC.grey,
  investigation: TC.orange,
  evidence:      TC.green,
  trial:         TC.magenta,
  debrief:       TC.blue,
}

const PHASE_LABELS: Record<GamePhase, string> = {
  briefing:      'BRIEFING',
  investigation: 'INVESTIGATION',
  evidence:      'EVIDENCE',
  trial:         'TRIAL',
  debrief:       'DEBRIEF',
}

function phaseAtLeast(current: GamePhase, target: GamePhase): boolean {
  return PHASES.indexOf(current) >= PHASES.indexOf(target)
}

// ── Sticky header ─────────────────────────────────────────────────────────────

function StickyHeader({
  phase, onBack, isPairSelector
}: {
  phase: GamePhase
  onBack: () => void
  isPairSelector: boolean
}) {
  const dynamicPhases = isPairSelector ? PHASES : PHASES.filter(p => p !== 'evidence')
  const phaseIdx = dynamicPhases.indexOf(phase)

  return (
    <div style={{
      position:     'sticky',
      top:          0,
      zIndex:       10,
      background:   TC.cream,
      borderBottom: `3px solid ${TC.ink}`,
      padding:      '14px clamp(16px,4vw,40px)',
      display:      'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems:   'center',
      gap:          18,
    }}>
      {/* Left: back — explicit destination so the user knows where they go */}
      <div style={{ justifySelf: 'start' }}>
        <PixelButton small variant="secondary" onClick={onBack}>← BACK TO MAP</PixelButton>
      </div>

      {/* Center: phase stepper (breadcrumb) */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        6,
        flexWrap:   'wrap',
        justifySelf: 'center',
      }}>
        {dynamicPhases.map((p, i) => {
          // Stepper state colours:
          //   done    → tobacco brown (TC.orange) ink-stamp + ✓
          //   active  → vivid amber highlight, draws the eye like a marker swipe
          //   pending → empty + faded grid frame
          const isDone    = i < phaseIdx
          const isActive  = i === phaseIdx
          const DONE      = TC.orange   // #6B4A2B tobacco brown
          const ACTIVE_BG = '#D89B2A'   // amber highlight — only place this hue appears
          const frame     = isActive ? '#8A5E13' : isDone ? DONE : TC.grid
          const bg        = isActive ? ACTIVE_BG : isDone ? DONE : 'transparent'
          const fg        = isActive ? TC.ink : isDone ? '#fff' : TC.grey
          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && (
                <div style={{
                  width:       18,
                  height:      2,
                  background:  i <= phaseIdx ? DONE : TC.grid,
                  marginRight: 6,
                }} />
              )}
              <div
                title={PHASE_LABELS[p]}
                aria-label={PHASE_LABELS[p]}
                aria-current={isActive ? 'step' : undefined}
                style={{
                  width:          isActive ? 28 : 24,
                  height:         isActive ? 28 : 24,
                  border:         `2px solid ${frame}`,
                  background:     bg,
                  boxShadow:      isActive ? '0 0 0 2px rgba(216,155,42,0.25)' : 'none',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontFamily:     PIXEL_FONT,
                  fontSize:       9,
                  color:          fg,
                  transition:     'all 120ms ease-out',
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
            </div>
          )
        })}
      </div>

      {/* Right spacer to balance the back button (keeps stepper truly centred) */}
      <div />
    </div>
  )
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionDivider({ phaseLabel, phaseNumber, color }: { phaseLabel: string; phaseNumber: number; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '18px 0 14px',
      borderTop: `2px solid ${TC.grid}`,
      marginTop: 32,
      marginBottom: 24,
    }}>
      <div style={{
        width: 32, height: 32,
        border: `3px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: PIXEL_FONT, fontSize: 14, color,
        flexShrink: 0,
      }}>
        {phaseNumber}
      </div>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color, letterSpacing: 0.5 }}>
        PHASE {phaseNumber}: {phaseLabel}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CasePlayScreen({ onNavigateOut }: Props) {
  const { phase, advancePhase, caseFile, goBack } = useGameStore()

  const briefingRef      = useRef<HTMLDivElement>(null)
  const investigationRef = useRef<HTMLDivElement>(null)
  const evidenceRef      = useRef<HTMLDivElement>(null)
  const trialRef         = useRef<HTMLDivElement>(null)
  const debriefRef       = useRef<HTMLDivElement>(null)

  const isPairSelector = caseFile?.question_type === 'pair_selector'

  // Auto-scroll to the newly revealed section on phase advance
  useEffect(() => {
    const refMap: Partial<Record<GamePhase, React.RefObject<HTMLDivElement>>> = {
      briefing:      briefingRef,
      investigation: investigationRef,
      evidence:      evidenceRef,
      trial:         trialRef,
      debrief:       debriefRef,
    }
    const target = refMap[phase]?.current
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  }, [phase])

  // For non-pair_selector cases, auto-skip the evidence phase
  useEffect(() => {
    if (phase === 'evidence' && !isPairSelector) {
      advancePhase()
    }
  }, [phase, isPairSelector, advancePhase])

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <StickyHeader
        phase={phase}
        onBack={goBack}
        isPairSelector={isPairSelector}
      />

      <div style={{ padding: '0 clamp(16px,4vw,40px) 60px' }}>

        {/* § 1 BRIEFING — always visible */}
        <div style={{ paddingTop: 28 }} ref={briefingRef}>
          <SectionDivider phaseLabel="BRIEFING" phaseNumber={1} color={PHASE_COLORS.briefing} />
          <BriefingSection
            isActive={phase === 'briefing'}
            isCompleted={phaseAtLeast(phase, 'investigation')}
            onAdvance={advancePhase}
          />
        </div>

        {/* § 2 INVESTIGATION */}
        {phaseAtLeast(phase, 'investigation') && (
          <div ref={investigationRef}>
            <SectionDivider phaseLabel="INVESTIGATION" phaseNumber={2} color={PHASE_COLORS.investigation} />
            <InvestigationSection
              isActive={phase === 'investigation'}
              isCompleted={phaseAtLeast(phase, 'evidence')}
              onAdvance={advancePhase}
            />
          </div>
        )}

        {/* § 3 EVIDENCE — only for pair_selector cases */}
        {phaseAtLeast(phase, 'evidence') && isPairSelector && (
          <div ref={evidenceRef}>
            <SectionDivider phaseLabel="EVIDENCE" phaseNumber={3} color={PHASE_COLORS.evidence} />
            <EvidenceSection
              isActive={phase === 'evidence'}
              isCompleted={phaseAtLeast(phase, 'trial')}
              onAdvance={advancePhase}
            />
          </div>
        )}

        {/* § 4 TRIAL */}
        {phaseAtLeast(phase, 'trial') && (
          <div ref={trialRef}>
            <SectionDivider phaseLabel="TRIAL" phaseNumber={isPairSelector ? 4 : 3} color={PHASE_COLORS.trial} />
            <TrialSection
              isActive={phase === 'trial'}
              isCompleted={phaseAtLeast(phase, 'debrief')}
              onAdvance={advancePhase}
            />
          </div>
        )}

        {/* § 5 DEBRIEF */}
        {phaseAtLeast(phase, 'debrief') && (
          <div ref={debriefRef}>
            <SectionDivider phaseLabel="DEBRIEF" phaseNumber={isPairSelector ? 5 : 4} color={PHASE_COLORS.debrief} />
            <DebriefSection
              isActive={phase === 'debrief'}
              isCompleted={false}
              onAdvance={advancePhase}
              onNavigateOut={onNavigateOut}
            />
          </div>
        )}
      </div>
    </div>
  )
}
