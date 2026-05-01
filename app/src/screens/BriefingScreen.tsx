import { useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import DialogBox from '../ui/DialogBox'
import { JudgeSprite, ProsecutorSprite, BugSprite } from '../ui/CharacterSprites'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const caseData = {
  title: 'Altitude Hold Disengage',
  narrative:
    'A flight control system disengages altitude hold when certain conditions are met. The decision logic has been flagged for MC/DC coverage under ISO 26262 ASIL D.',
  code: 'if (verticalSpeed > LIMIT && (autopilotEngaged || pilotOverride)) disengage();',
  conditions: [
    { id: 'A', label: 'verticalSpeed > LIMIT' },
    { id: 'B', label: 'autopilotEngaged' },
    { id: 'C', label: 'pilotOverride' },
  ],
  expression: 'A && (B || C)',
  charges: [
    'Prove that each condition independently affects the decision outcome',
    'Achieve MC/DC coverage (N+1 minimum test cases for N conditions)',
    'Detect seeded fault F1: short-circuit evaluation skips condition C',
  ],
}

const dialogs = [
  { speaker: 'THE JUDGE',   text: 'Case #007 — "Altitude Hold Disengage". The court calls the prosecution to investigate.' },
  { speaker: 'PROSECUTOR',  text: 'Your Honor, I will demonstrate that each condition in this flight control decision independently affects the disengage outcome.' },
  { speaker: 'THE JUDGE',   text: 'The standard of proof is MC/DC — Modified Condition/Decision Coverage per §5.3.6. Anything weaker is inadmissible. Proceed.' },
]

export default function BriefingScreen({ onNavigate, onBack }: Props) {
  const [dialogIdx, setDialogIdx] = useState(0)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: '30px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <PixelButton small variant="secondary" onClick={onBack}>← CAMPAIGN</PixelButton>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta, padding: '4px 10px', border: `2px solid ${TC.magenta}` }}>ACT III</span>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.grey, padding: '4px 10px', border: `2px solid ${TC.grid}` }}>PHASE 1: BRIEFING</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 30, maxWidth: 1100 }}>
        {/* Case File */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `5px 5px 0 ${TC.ink}`,
            padding: 24, position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 12, right: 16,
              fontFamily: PIXEL_FONT, fontSize: 7, color: TC.magenta,
              border: `2px solid ${TC.magenta}`, padding: '4px 8px', transform: 'rotate(3deg)',
            }}>CLASSIFIED</div>

            <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.grey, marginBottom: 4 }}>CASE FILE #007</div>
            <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.ink, margin: '0 0 16px 0' }}>{caseData.title}</h2>

            <div style={{ fontFamily: HAND_FONT, fontSize: 20, color: TC.ink, lineHeight: 1.6, marginBottom: 20 }}>
              {caseData.narrative}
            </div>

            {/* Code exhibit */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.orange, marginBottom: 6 }}>EXHIBIT A — SOURCE CODE</div>
              <div style={{
                background: '#1e1e2e', color: '#cdd6f4', fontFamily: MONO_FONT, fontSize: 13,
                padding: 16, border: `2px solid ${TC.ink}`, lineHeight: 1.6, overflow: 'auto',
              }}>
                <span style={{ color: '#cba6f7' }}>if</span>{' '}(
                <span style={{ color: '#f9e2af' }}>verticalSpeed</span>{' '}
                <span style={{ color: '#89b4fa' }}>{'>'}</span>{' '}
                <span style={{ color: '#fab387' }}>LIMIT</span>{' '}
                <span style={{ color: '#89b4fa' }}>{'&&'}</span>{' '}(
                <span style={{ color: '#f9e2af' }}>autopilotEngaged</span>{' '}
                <span style={{ color: '#89b4fa' }}>{'||'}</span>{' '}
                <span style={{ color: '#f9e2af' }}>pilotOverride</span>)){' '}
                <span style={{ color: '#a6e3a1' }}>disengage</span>();
              </div>
            </div>

            {/* Conditions */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.blue, marginBottom: 8 }}>CONDITIONS IDENTIFIED</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {caseData.conditions.map(c => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', background: `${TC.blue}10`, border: `1px solid ${TC.blue}`,
                  }}>
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: TC.blue, width: 28 }}>{c.id}</span>
                    <span style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.ink }}>{c.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.grey, marginTop: 8 }}>
                Decision expression: <strong style={{ color: TC.ink }}>{caseData.expression}</strong>
              </div>
            </div>

            {/* Charges */}
            <div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.magenta, marginBottom: 8 }}>CHARGES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {caseData.charges.map((ch, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    fontFamily: HAND_FONT, fontSize: 18, color: TC.ink,
                    padding: '6px 0', borderBottom: `1px solid ${TC.grid}`,
                  }}>
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta, marginTop: 4 }}>{i + 1}.</span>
                    {ch}
                  </div>
                ))}
              </div>
            </div>

            {/* Technique badge */}
            <div style={{
              marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${TC.magenta}15`, border: `2px solid ${TC.magenta}`, padding: '8px 14px',
            }}>
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.magenta }}>REQUIRED:</span>
              <span style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.ink }}>MC/DC (ISO 26262 ASIL D)</span>
            </div>
          </div>
        </div>

        {/* Right panel: Defendant + Dialog */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Defendant */}
          <div style={{
            background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`,
            padding: 16, textAlign: 'center',
          }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey, marginBottom: 8 }}>THE DEFENDANT</div>
            <BugSprite size={90} type="mcdc" mood="nervous" />
            <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey, marginTop: 8, fontStyle: 'italic' }}>
              "I... I'm sure it was just a short-circuit..."
            </div>
          </div>

          {/* Dialog */}
          {dialogs[dialogIdx] && (() => {
            const dialog = dialogs[dialogIdx]!
            return (
              <DialogBox
                speaker={dialog.speaker}
                text={dialog.text}
                portrait={dialogIdx === 0 || dialogIdx === 2 ? <JudgeSprite size={60} /> : <ProsecutorSprite size={60} />}
                onNext={() => {
                  if (dialogIdx < dialogs.length - 1) setDialogIdx(dialogIdx + 1)
                  else onNavigate('investigation')
                }}
                isLast={dialogIdx === dialogs.length - 1}
              />
            )
          })()}

          {/* Time hint */}
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey, textAlign: 'center', padding: 8 }}>
            EST. TIME: 8–12 MIN
          </div>
        </div>
      </div>
    </div>
  )
}
