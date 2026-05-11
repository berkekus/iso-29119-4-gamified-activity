import { useEffect, useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../../ui/tokens'
import PixelButton from '../../ui/PixelButton'
import ScoreChip from '../../ui/ScoreChip'
import CoverageMeter from '../../ui/CoverageMeter'
import { JudgeSprite, ProsecutorSprite, DefenseSprite, BugSprite } from '../../ui/CharacterSprites'
import { validateMcdcCoverage } from '../../engine/coverage/mcdc'
import { simulateFaults } from '../../engine/faults/simulator'
import { detectMisconceptions } from '../../engine/misconceptions/detector'
import { useGameStore } from '../../stores/gameStore'
import type { SectionProps } from './types'

type TrialPhase = 'presenting' | 'deliberating' | 'verdict'

const TECHNIQUE_LABEL: Record<string, string> = {
  STATEMENT: 'STATEMENT', BRANCH: 'BRANCH', DECISION: 'DECISION',
  BC: 'BC', BCC: 'BCC', MCDC: 'MC/DC',
}

export default function TrialSection({ isCompleted, onAdvance }: SectionProps) {
  const { mcdc, setVerdict, caseFile } = useGameStore()
  const techniqueLabel =
    (caseFile?.technique && TECHNIQUE_LABEL[caseFile.technique]) ?? 'CASE'
  const [trialPhase, setTrialPhase] = useState<TrialPhase>('presenting')

  const seededFaultMap: Record<string, string> = {}
  if (caseFile) {
    for (const f of caseFile.seeded_faults) seededFaultMap[f.id] = f.description
  }

  useEffect(() => {
    if (trialPhase === 'presenting') {
      const t = setTimeout(() => setTrialPhase('deliberating'), 2500)
      return () => clearTimeout(t)
    }
    if (trialPhase === 'deliberating') {
      const t = setTimeout(() => {
        if (caseFile?.question_type === 'pair_selector') {
          const result   = validateMcdcCoverage({ selectedRows: mcdc.selectedRows, independencePairs: mcdc.independencePairs })
          const faults   = simulateFaults({ selectedRows: mcdc.selectedRows, independencePairs: mcdc.independencePairs })
          const miscList = detectMisconceptions({ selectedRows: mcdc.selectedRows, independencePairs: mcdc.independencePairs })
          setVerdict(result, faults, miscList)
        }
        setTrialPhase('verdict')
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [trialPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  const { verdictResult, faultResults, misconceptions } = mcdc
  const isGuilty = verdictResult?.coverageAchieved && faultResults.every(f => f.detected)

  const phaseLabels: TrialPhase[] = ['presenting', 'deliberating', 'verdict']

  return (
    <div style={{
      opacity: isCompleted ? 0.65 : 1,
      pointerEvents: isCompleted ? 'none' : 'auto',
      transition: 'opacity 0.2s',
    }}>
      {isCompleted && (
        <div style={{
          fontFamily: PIXEL_FONT, fontSize: 8, color: TC.green,
          border: `2px solid ${TC.green}`, padding: '4px 10px',
          background: `${TC.green}10`, display: 'inline-block', marginBottom: 14,
        }}>
          ✓ COMPLETED — scroll up to review
        </div>
      )}

      {/* Courtroom scene */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 40 }}>
          <ProsecutorSprite size={110} pose="pointing" isTalking={trialPhase === 'presenting'} />
          <JudgeSprite size={140} pose={trialPhase === 'verdict' ? 'verdict' : 'idle'} isTalking={trialPhase === 'verdict'} />
          <DefenseSprite size={110} pose={trialPhase === 'verdict' && !isGuilty ? 'objecting' : 'idle'} isTalking={trialPhase === 'deliberating'} />
        </div>
      </div>

      {/* Phase indicator */}
      {caseFile?.question_type === 'pair_selector' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, maxWidth: 600, margin: '0 auto 24px' }}>
          <ScoreChip label="PAIRS" value={mcdc.independencePairs.length} color={TC.blue} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {phaseLabels.map((p, i) => (
              <div key={p} style={{
                fontFamily: PIXEL_FONT, fontSize: 8, padding: '6px 14px',
                background: trialPhase === p ? TC.blue : 'transparent',
                color: trialPhase === p ? '#fff' : TC.grey,
                border: `2px solid ${trialPhase === p ? TC.blue : TC.grid}`,
              }}>
                {['PRESENTING', 'DELIBERATING', 'VERDICT'][i]}
                {trialPhase === p && p !== 'verdict' && <span style={{ animation: 'blink 0.5s steps(2) infinite' }}> ...</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verdict content */}
      {trialPhase === 'verdict' && verdictResult && (
        <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.3s steps(4)' }}>
          {/* Verdict banner */}
          <div style={{
            textAlign: 'center', padding: '20px 30px', marginBottom: 20,
            background: isGuilty ? `${TC.green}15` : `${TC.magenta}15`,
            border: `4px solid ${isGuilty ? TC.green : TC.magenta}`,
            boxShadow: `6px 6px 0 ${TC.ink}`,
          }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey, marginBottom: 10 }}>THE VERDICT IS</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 26, color: isGuilty ? TC.green : TC.magenta, lineHeight: 1.2 }}>
              {isGuilty ? 'GUILTY' : 'MISTRIAL'}
            </div>
            <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, marginTop: 12, lineHeight: 1.55 }}>
              {isGuilty
                ? 'The defendant has been found guilty. All faults detected.'
                : 'The defendant walks free. Your evidence was incomplete — the bug escapes.'}
            </div>
          </div>

          {/* Coverage + Faults */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`, padding: 16 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.blue, marginBottom: 12 }}>COVERAGE ACHIEVED</div>
              <CoverageMeter value={verdictResult.coveragePercent} max={100} color={TC.green} width={200} />
              {caseFile?.question_type === 'pair_selector' && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(['A', 'B', 'C'] as const).map(cond => {
                    const hit = verdictResult.conditionsCovered.includes(cond)
                    return (
                      <div key={cond} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO_FONT, fontSize: 12 }}>
                        <span style={{ color: hit ? TC.green : TC.magenta, fontFamily: PIXEL_FONT, fontSize: 10 }}>
                          {hit ? '✓' : '✗'}
                        </span>
                        <span style={{ color: TC.ink }}>Condition {cond} independence</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ flex: 1, background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`, padding: 16 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginBottom: 12 }}>FAULTS DETECTED</div>
              {faultResults.length > 0 ? (
                faultResults.map(f => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px',
                    background: f.detected ? `${TC.green}10` : `${TC.magenta}10`,
                    border: `1px solid ${f.detected ? TC.green : TC.magenta}`,
                  }}>
                    <BugSprite size={30} type="mcdc" mood={f.detected ? 'caught' : 'nervous'} />
                    <div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: f.detected ? TC.green : TC.magenta }}>
                        {f.id}: {f.detected ? 'CAUGHT' : 'ESCAPED'}
                      </div>
                      <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey, marginTop: 3, lineHeight: 1.5 }}>
                        {seededFaultMap[f.id] ?? 'Seeded fault — see case file.'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.grey }}>
                  {isGuilty ? 'No faults escaped.' : 'No fault detection data on record.'}
                </div>
              )}
            </div>
          </div>

          {/* Misconception probe */}
          {!isGuilty && misconceptions.some(m => m.triggered) && (
            <div style={{
              background: `${TC.magenta}10`, border: `3px solid ${TC.magenta}`,
              boxShadow: `4px 4px 0 ${TC.ink}`, padding: 16, marginBottom: 20,
            }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginBottom: 10 }}>MISCONCEPTION DETECTED</div>
              {misconceptions.filter(m => m.triggered).map(m => (
                <div key={m.id} style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.55, marginBottom: 8 }}>
                  {m.explanation}
                </div>
              ))}
              <div style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.grey, marginTop: 10 }}>
                See ISO 29119-4 {(caseFile?.iso_clauses && caseFile.iso_clauses[0]) ?? '§5.3'} for the coverage criterion definition.
              </div>
            </div>
          )}

          {!isCompleted && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <PixelButton variant="primary" onClick={onAdvance}>READ DEBRIEF →</PixelButton>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, paddingBottom: 20, animation: 'fadeIn 1s ease-in' }}>
            <BugSprite
              mood={isGuilty ? 'prisoned' : 'escaped'}
              className="!w-full !h-auto max-w-[240px] sm:max-w-[300px] md:max-w-[380px] opacity-90 transition-all"
            />
          </div>
        </div>
      )}

      {trialPhase !== 'verdict' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey }}>
            {trialPhase === 'presenting' ? 'PRESENTING EVIDENCE...' : 'COURT IS DELIBERATING...'}
          </div>
        </div>
      )}
    </div>
  )
}
