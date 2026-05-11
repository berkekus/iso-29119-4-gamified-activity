import { useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import DialogBox from '../ui/DialogBox'
import { JudgeSprite, ProsecutorSprite, BugSprite } from '../ui/CharacterSprites'
import { useGameStore } from '../stores/gameStore'
import type { Screen } from '../stores/gameStore'
import { lawCardForCase } from '../content/lawCards'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

// Pre-load fallback used only when no caseFile is in the store (defensive —
// in normal navigation the campaign map always loads a case first). It is
// intentionally generic so it never bleeds technique-specific (e.g. MCDC)
// language into a screen that is rendering, say, a Statement coverage case.
const fallbackCaseData = {
  title: 'Case Brief',
  narrative:
    'A claim about test coverage has been put before the court. Review the evidence and decide whether the claim is admissible.',
  code: '',
  charges: [
    'Read the case briefing and the source code under review',
    'Apply the required coverage technique for this act',
    'Return a verdict that satisfies the standard of proof',
  ],
}

const fallbackDialogs = [
  { speaker: 'THE JUDGE',   text: 'A new case has reached the bench. The court calls the prosecution to investigate.' },
  { speaker: 'PROSECUTOR',  text: 'Your Honor, I will examine the claim under the required coverage standard.' },
  { speaker: 'THE JUDGE',   text: 'Apply the standard of proof for this act. Anything weaker is inadmissible. Proceed.' },
]

const TECHNIQUE_LABEL: Record<string, string> = {
  STATEMENT: 'Statement coverage (ISO 29119-4 §5.3.1)',
  BRANCH:    'Branch coverage (ISO 29119-4 §5.3.2)',
  DECISION:  'Decision coverage (ISO 29119-4 §5.3.3)',
  BC:        'Branch Condition coverage (ISO 29119-4 §5.3.4)',
  BCC:       'Branch Condition Combination (ISO 29119-4 §5.3.5)',
  MCDC:      'MC/DC (ISO 29119-4 §5.3.6, ISO 26262 ASIL D)',
}

const ACT_LABEL: Record<string, string> = {
  STMT_BRANCH: 'ACT I',
  DECISION_BC: 'ACT II',
  BCC:         'ACT III',
  MCDC:        'ACT IV',
  Combinatorial: 'ACT III',
  DataFlow:    'ACT V',
}

export default function BriefingScreen({ onNavigate, onBack }: Props) {
  const [dialogIdx, setDialogIdx] = useState(0)
  const [showLawCard, setShowLawCard] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const caseFile = useGameStore((s) => s.caseFile)
  const lawCard = lawCardForCase(caseFile?.id)

  const caseData = caseFile
    ? {
        title:      caseFile.scenario.title,
        narrative:  caseFile.scenario.narrative,
        code:       caseFile.scenario.code,
        charges:    (caseFile.charges && caseFile.charges.length > 0)
          ? caseFile.charges
          : caseFile.claim
            ? [caseFile.claim]
            : fallbackCaseData.charges,
      }
    : fallbackCaseData

  const techniqueLine = caseFile?.technique
    ? TECHNIQUE_LABEL[caseFile.technique] ?? `Technique: ${caseFile.technique}`
    : 'Coverage standard pending'
  const actLabel      = caseFile ? ACT_LABEL[caseFile.act] ?? 'ACT' : 'ACT'
  const caseFileNum   = caseFile ? `CASE FILE · ${caseFile.id.toUpperCase()}` : 'CASE FILE'

  const dialogs = caseFile
    ? [
        { speaker: 'THE JUDGE',  text: `Case "${caseFile.scenario.title}". The court calls the prosecution to investigate.` },
        { speaker: 'PROSECUTOR', text: `Your Honor, I will demonstrate the required coverage criterion for this decision logic.` },
        { speaker: 'THE JUDGE',  text: `The standard of proof is ${techniqueLine}. Anything weaker is inadmissible. Proceed.` },
      ]
    : fallbackDialogs

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: 'clamp(16px, 3vw, 30px) clamp(16px, 4vw, 40px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <PixelButton small variant="secondary" onClick={onBack}>← CAMPAIGN</PixelButton>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta, padding: '4px 10px', border: `2px solid ${TC.magenta}` }}>{actLabel}</span>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.grey, padding: '4px 10px', border: `2px solid ${TC.grid}` }}>PHASE 1: BRIEFING</span>
        </div>
      </div>

      <div className="responsive-row" style={{ gap: 30, maxWidth: 1100, margin: '0 auto' }}>
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

            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 6 }}>{caseFileNum}</div>
            <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 18, color: TC.ink, margin: '0 0 18px 0', lineHeight: 1.4 }}>{caseData.title}</h2>

            <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.6, marginBottom: 20 }}>
              {caseData.narrative}
            </div>

            {/* Code exhibit */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.orange, marginBottom: 8 }}>EXHIBIT A — SOURCE CODE</div>
              <div style={{
                background: '#1e1e2e', color: '#cdd6f4', fontFamily: MONO_FONT, fontSize: 13,
                padding: 16, border: `2px solid ${TC.ink}`, lineHeight: 1.6, overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}>
                {caseData.code}
              </div>
            </div>

            {/* Charges */}
            <div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginBottom: 10 }}>CHARGES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {caseData.charges.map((ch, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.5,
                    padding: '6px 0', borderBottom: `1px solid ${TC.grid}`,
                  }}>
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginTop: 4 }}>{i + 1}.</span>
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
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta }}>REQUIRED:</span>
              <span style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.ink }}>{techniqueLine}</span>
            </div>

            {/* Law Reference toggle + panel — reuses the same cream/ink card
                vocabulary used elsewhere on this screen. Only renders when a
                law card is mapped for the active case. */}
            {lawCard && (
              <div style={{ marginTop: 16 }}>
                <PixelButton small variant="secondary" onClick={() => setShowLawCard((v) => !v)}>
                  {showLawCard ? '▲ HIDE LAW REFERENCE' : '▼ LAW REFERENCE'}
                </PixelButton>
                {showLawCard && (
                  <div style={{
                    marginTop: 10,
                    background: `${TC.orange}08`,
                    border: `2px solid ${TC.orange}`,
                    padding: 16,
                  }}>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.orange, marginBottom: 8 }}>
                      LAW CARD · {lawCard.iso_clause}
                    </div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: TC.ink, marginBottom: 12, lineHeight: 1.4 }}>
                      {lawCard.title}
                    </div>
                    <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.55, marginBottom: 10 }}>
                      {lawCard.short_definition}
                    </div>
                    <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, lineHeight: 1.55, marginBottom: 12 }}>
                      {lawCard.long_description}
                    </div>
                    <div style={{
                      fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginBottom: 6,
                    }}>
                      COMMON PITFALL
                    </div>
                    <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, lineHeight: 1.55 }}>
                      {lawCard.pitfall}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Defendant + Dialog */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Defendant */}
          <div style={{
            background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`,
            padding: 16, textAlign: 'center',
          }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 10 }}>THE DEFENDANT</div>
            <BugSprite size={90} type="mcdc" mood="nervous" />
            {caseFile?.defendant_subtitle && caseFile?.claim ? (
              <>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.ink, marginTop: 8, lineHeight: 1.4 }}>
                  {caseFile.defendant_subtitle}
                </div>
                <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey, marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{caseFile.claim}"
                </div>
              </>
            ) : (
              <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey, marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
                "I... I'm sure my tests were enough..."
              </div>
            )}
          </div>

          {/* Dialog */}
          {(() => {
            const currentDialog = dialogs[dialogIdx]
            if (!currentDialog) return null
            return (
              <DialogBox
                speaker={currentDialog.speaker}
                text={currentDialog.text}
                onTypingChange={setIsTyping}
                portrait={
                  dialogIdx === 0 || dialogIdx === 2
                    ? <JudgeSprite size={60} isTalking={isTyping} />
                    : <ProsecutorSprite size={60} isTalking={isTyping} />
                }
                onNext={() => {
                  if (dialogIdx < dialogs.length - 1) setDialogIdx(dialogIdx + 1)
                  else onNavigate('investigation')
                }}
                isLast={dialogIdx === dialogs.length - 1}
              />
            )
          })()}

          {/* Time hint */}
          <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey, textAlign: 'center', padding: 8, letterSpacing: 0.5 }}>
            EST. TIME: 8–12 MIN
          </div>
        </div>
      </div>
    </div>
  )
}
