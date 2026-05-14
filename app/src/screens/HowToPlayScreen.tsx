import { useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { JudgeSprite, ProsecutorSprite, DefenseSprite, BugSprite } from '../ui/CharacterSprites'

interface Props {
  onBack: () => void
}

interface Step {
  phase: string
  title: string
  color: string
  icon: React.ReactNode
  description: string
  details: string[]
  tip: string
}

const steps: Step[] = [
  {
    phase: 'PHASE 1',
    title: 'BRIEFING',
    color: TC.blue,
    icon: <JudgeSprite size={110} />,
    description:
      'The Judge opens the case. You receive a Case File containing the system under test, the code snippet, and the charges.',
    details: [
      'Read the scenario — understand what the software does',
      'Identify the decision expression (e.g. A && (B || C))',
      'Note each atomic condition: A, B, C…',
      'Check the required technique (e.g. MC/DC for ASIL D)',
      'Read the charges — these are the faults you must expose',
    ],
    tip: 'The Defendant is the bug. The Judge will accept nothing weaker than the mandated coverage criterion.',
  },
  {
    phase: 'PHASE 2',
    title: 'INVESTIGATION',
    color: TC.orange,
    icon: <ProsecutorSprite size={110} pose="pointing" />,
    description:
      'Build the truth table. Click rows to select the test cases you plan to use. You need at least N+1 rows for N conditions.',
    details: [
      'Each row = one combination of condition values',
      'Column D = what the decision evaluates to',
      'For 3 conditions you need at least 4 rows (N+1 rule)',
      'Click a row to include it in your test model',
      'Press VALIDATE MODEL when you have enough rows',
    ],
    tip: 'Pick rows that will let you show each condition flipping independently — you\'ll need those pairs in the next phase.',
  },
  {
    phase: 'PHASE 3',
    title: 'EVIDENCE',
    color: TC.green,
    icon: (
      <div style={{ textAlign: 'center' }}>
        <BugSprite size={90} type="mcdc" mood="nervous" />
      </div>
    ),
    description:
      'Derive independence pairs. Click two rows to form a pair. A valid pair: exactly one condition flips, all others stay fixed, and the decision (D) flips.',
    details: [
      'Click row 1 — it highlights orange',
      'Click row 2 — the game checks the pair',
      'Valid pair → logged in the Evidence Log with a colour tag',
      'Invalid pair → feedback explains which rule was broken',
      'You need one valid pair per condition (3 pairs total for A, B, C)',
    ],
    tip: 'The MC/DC independence rule (§5.3.6.2): only the target condition may differ between the two rows. All others must stay the same.',
  },
  {
    phase: 'PHASE 4',
    title: 'TRIAL',
    color: TC.magenta,
    icon: <JudgeSprite size={110} pose="verdict" />,
    description:
      'Submit your evidence. The Judge runs your test suite against a deterministic simulator with seeded faults and delivers the verdict.',
    details: [
      'GUILTY — full MC/DC coverage + all faults detected',
      'MISTRIAL — coverage gaps or missed faults',
      'Coverage panel: which conditions are independently covered',
      'Faults panel: which seeded bugs your suite catches',
      'Misconception probe: identifies exactly where reasoning failed',
    ],
    tip: 'A Mistrial is not a penalty — it reveals precisely which §5.3.6.2 rule you violated so you can fix it on retry.',
  },
  {
    phase: 'PHASE 5',
    title: 'DEBRIEF',
    color: TC.grey,
    icon: <DefenseSprite size={110} />,
    description:
      'The post-trial summary. Review what the ISO standard says, which faults escaped, and which misconception was triggered.',
    details: [
      'Textbook panel: exact wording of the coverage criterion',
      'ISO Reference: clause numbers you can look up in the standard',
      'Fault Analysis: how to fix your suite to catch escaped bugs',
      'Misconception Log: persistent record across all your cases',
      'RETRY to replay with what you learned, or NEXT CASE to advance',
    ],
    tip: 'Every triggered misconception stays in your Achievements log — use it as a self-assessment checklist before the exam.',
  },
]

export default function HowToPlayScreen({ onBack }: Props) {
  const [current, setCurrent] = useState(0)
  const step = steps[current]
  if (!step) return null
  const isFirst = current === 0
  const isLast = current === steps.length - 1

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: 'clamp(16px, 3vw, 30px) clamp(16px, 4vw, 40px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <PixelButton small variant="secondary" onClick={onBack}>← MENU</PixelButton>
        <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: TC.ink, margin: 0 }}>HOW TO PLAY</h2>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Phase ${i + 1}: ${s.title}`}
              style={{
                width: i === current ? 28 : 12,
                height: 12,
                background: i === current ? s.color : TC.greyLight,
                border: `2px solid ${TC.ink}`,
                cursor: 'pointer',
                padding: 0,
                transition: 'width 0.12s steps(4), background 0.06s steps(2)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Main card */}
      <div
        key={current}
        className="responsive-row"
        style={{
          maxWidth: 960,
          margin: '0 auto',
          gap: 40,
          alignItems: 'flex-start',
          animation: 'slideIn 0.15s steps(4)',
        }}
      >
        {/* Left: character + phase badge */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{
            background: `${step.color}18`,
            border: `3px solid ${step.color}`,
            boxShadow: `5px 5px 0 ${TC.ink}`,
            padding: '24px 16px',
            width: '100%',
            textAlign: 'center',
          }}>
            {step.icon}
          </div>

          {/* Phase label */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.grey }}>{step.phase}</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: step.color, marginTop: 4 }}>{step.title}</div>
          </div>

          {/* Step counter */}
          <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey }}>
            Step {current + 1} of {steps.length}
          </div>
        </div>

        {/* Right: content */}
        <div style={{ flex: 1 }}>
          {/* Description */}
          <div style={{
            background: '#ffffff',
            border: `3px solid ${TC.ink}`,
            boxShadow: `5px 5px 0 ${TC.ink}`,
            padding: 24,
            marginBottom: 20,
          }}>
            <div style={{ fontFamily: HAND_FONT, fontSize: 22, color: TC.ink, lineHeight: 1.6, marginBottom: 20 }}>
              {step.description}
            </div>

            {/* Detail list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {step.details.map((detail, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    padding: '8px 14px',
                    background: `${step.color}0d`,
                    border: `1px solid ${step.color}40`,
                  }}
                >
                  <span style={{
                    fontFamily: PIXEL_FONT,
                    fontSize: 8,
                    color: step.color,
                    marginTop: 3,
                    flexShrink: 0,
                    width: 20,
                    textAlign: 'right',
                  }}>
                    {i + 1}.
                  </span>
                  <span style={{ fontFamily: HAND_FONT, fontSize: 19, color: TC.ink, lineHeight: 1.4 }}>
                    {detail}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip box */}
          <div style={{
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
            padding: '12px 16px',
            background: `${TC.orange}10`,
            border: `2px solid ${TC.orange}`,
            marginBottom: 28,
          }}>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.orange, flexShrink: 0, marginTop: 3 }}>TIP</span>
            <span style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.5 }}>{step.tip}</span>
          </div>

          {/* Navigation arrows */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <PixelButton
              variant="secondary"
              disabled={isFirst}
              onClick={() => setCurrent(c => c - 1)}
            >
              ← PREV
            </PixelButton>

            {/* Progress bar */}
            <div style={{ display: 'flex', gap: 4 }}>
              {steps.map((s, i) => (
                <div
                  key={i}
                  style={{
                    height: 6,
                    width: 48,
                    background: i <= current ? s.color : TC.grid,
                    border: `1.5px solid ${TC.ink}`,
                    transition: 'background 0.08s steps(2)',
                  }}
                />
              ))}
            </div>

            {isLast ? (
              <PixelButton variant="success" onClick={onBack}>
                START PLAYING →
              </PixelButton>
            ) : (
              <PixelButton variant="primary" onClick={() => setCurrent(c => c + 1)}>
                NEXT →
              </PixelButton>
            )}
          </div>
        </div>
      </div>

      {/* ISO footer */}
      <div style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: MONO_FONT,
        fontSize: 9,
        color: TC.greyLight,
      }}>
        ISO/IEC/IEEE 29119-4 · §5.3.6 MC/DC · §5.3.5 BCC · §5.2.5 Combinatorial · §5.3.7 Data Flow
      </div>
    </div>
  )
}
