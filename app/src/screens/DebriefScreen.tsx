import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import CoverageMeter from '../ui/CoverageMeter'
import { JudgeSprite } from '../ui/CharacterSprites'
import { useGameStore } from '../stores/gameStore'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export default function DebriefScreen({ onNavigate, onBack }: Props) {
  const { mcdc, resetMcdc } = useGameStore()
  const { verdictResult, faultResults } = mcdc
  const triggeredMisconceptions = mcdc.misconceptions.filter(m => m.triggered)

  const isGuilty = verdictResult?.coverageAchieved && faultResults.every(f => f.detected)
  const coverageVal = verdictResult?.coveragePercent ?? 0

  const handleRetry = () => {
    resetMcdc()
    onNavigate('briefing')
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: '30px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <PixelButton small variant="secondary" onClick={onBack}>← TRIAL</PixelButton>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta, padding: '4px 10px', border: `2px solid ${TC.magenta}` }}>MC/DC</span>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.grey, padding: '4px 10px', border: `2px solid ${TC.grid}` }}>PHASE 5: DEBRIEF</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 30 }}>
        {/* Main content */}
        <div style={{ flex: 1 }}>
          {/* Summary card */}
          <div style={{ background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `5px 5px 0 ${TC.ink}`, padding: 24, marginBottom: 20 }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: TC.magenta, marginBottom: 16 }}>CASE DEBRIEF</div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey, marginBottom: 4 }}>VERDICT</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: isGuilty ? TC.green : TC.magenta }}>
                  {isGuilty ? 'GUILTY' : 'MISTRIAL'}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey, marginBottom: 4 }}>COVERAGE</div>
                <CoverageMeter value={coverageVal} max={100} color={isGuilty ? TC.green : TC.orange} width={140} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey, marginBottom: 4 }}>PAIRS SUBMITTED</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: TC.blue }}>{mcdc.independencePairs.length}/3</div>
              </div>
            </div>

            {/* Textbook */}
            <div style={{ background: `${TC.blue}08`, border: `2px solid ${TC.blue}`, padding: 16, marginBottom: 16 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.blue, marginBottom: 8 }}>WHAT THE TEXTBOOK SAYS</div>
              <div style={{ fontFamily: HAND_FONT, fontSize: 20, color: TC.ink, lineHeight: 1.6 }}>
                MC/DC requires that for each condition in a decision, there exist test cases that show the condition independently affects the decision's outcome. "Independently" means exactly one condition changes between two test cases while all others remain fixed, and the decision outcome changes.
              </div>
            </div>

            {/* ISO Reference */}
            <div style={{ background: `${TC.orange}08`, border: `2px solid ${TC.orange}`, padding: 16 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.orange, marginBottom: 8 }}>ISO/IEC/IEEE 29119-4 REFERENCE</div>
              <div style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.ink, lineHeight: 1.6 }}>
                <strong>§5.3.6</strong> Modified Condition/Decision Coverage (MC/DC)<br />
                <strong>§5.3.6.2</strong> Independence criterion for paired test cases<br />
                <strong>Annex C.2.3.6</strong> Worked example: MC/DC independence pairs<br />
              </div>
            </div>
          </div>

          {/* Fault analysis */}
          {faultResults.length > 0 && (
            <div style={{ background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`, padding: 16, marginBottom: 20 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.ink, marginBottom: 10 }}>FAULT ANALYSIS</div>
              {faultResults.map(f => (
                <div key={f.id} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '8px 10px', marginBottom: 6,
                  background: f.detected ? `${TC.green}10` : `${TC.magenta}10`,
                  border: `2px solid ${f.detected ? TC.green : TC.magenta}`,
                }}>
                  <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: f.detected ? TC.green : TC.magenta }}>{f.id}</span>
                  <div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: f.detected ? TC.green : TC.magenta }}>
                      {f.detected ? 'DETECTED' : 'ESCAPED'}
                    </div>
                    <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, marginTop: 4 }}>
                      Short-circuit evaluation skips C when B is true.
                      {!f.detected && ' To detect this, include a test case where A=T, B=F, C=T — forcing C to be evaluated.'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PixelButton variant="danger" onClick={handleRetry}>RETRY CASE</PixelButton>
            <PixelButton variant="secondary" onClick={() => {}}>OPEN ANNEX C</PixelButton>
            <PixelButton variant="primary" onClick={() => onNavigate('campaign')}>NEXT CASE →</PixelButton>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, border: `3px solid ${TC.ink}`, background: TC.cream, boxShadow: `4px 4px 0 ${TC.ink}` }}>
            <JudgeSprite size={100} pose="verdict" />
            <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, marginTop: 10, lineHeight: 1.5 }}>
              {isGuilty
                ? '"Excellent work, Prosecutor. The standard is satisfied. Case closed."'
                : '"A mistrial is not a failure — it\'s a lesson. Return with stronger evidence."'}
            </div>
          </div>

          {/* Misconception log */}
          {triggeredMisconceptions.length > 0 && (
            <div style={{ padding: 14, border: `3px solid ${TC.magenta}`, background: `${TC.magenta}08`, boxShadow: `4px 4px 0 ${TC.ink}` }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.magenta, marginBottom: 8 }}>MISCONCEPTION LOG</div>
              {mcdc.misconceptions.filter(m => m.triggered).map(m => (
                <div key={m.id}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.ink, marginBottom: 4 }}>{m.id}</div>
                  <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, lineHeight: 1.5 }}>
                    You tested each condition in isolation instead of constructing proper independence pairs where only one condition varies.
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          <div style={{ padding: 14, border: `2px solid ${TC.grid}`, background: TC.cream }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey, marginBottom: 8 }}>PROGRESS</div>
            <CoverageMeter value={isGuilty ? 1 : 0} max={3} label="ACT III CASES" color={TC.magenta} width={220} />
            <div style={{ marginTop: 10 }}>
              <CoverageMeter value={isGuilty ? 3 : 2} max={12} label="TOTAL CASES" color={TC.blue} width={220} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
