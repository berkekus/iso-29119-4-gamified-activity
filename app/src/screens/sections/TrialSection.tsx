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
import { CASE_ORDER, nextCaseId } from '../../content/caseOrder'
import type { SectionProps } from './types'

type TrialPhase = 'presenting' | 'deliberating' | 'verdict'

const TECHNIQUE_LABEL: Record<string, string> = {
  STATEMENT: 'STATEMENT', BRANCH: 'BRANCH', DECISION: 'DECISION',
  BC: 'BC', BCC: 'BCC', MCDC: 'MC/DC',
}

const TECHNIQUE_TEXTBOOK: Record<string, string> = {
  STATEMENT: 'Statement coverage requires every executable statement in the code to be executed at least once.',
  BRANCH: 'Branch coverage requires every possible branch (True and False outcomes of decisions) to be executed.',
  DECISION: 'Decision coverage requires every decision to take all possible outcomes at least once.',
  BC: 'Branch Condition (BC) coverage requires every individual condition within a decision to take both True and False outcomes.',
  BCC: 'Branch Condition Combination (BCC) coverage requires all possible combinations of conditions to be tested.',
  MCDC: 'Modified Condition/Decision Coverage (MC/DC) requires each condition to independently affect the decision outcome.',
}

export default function TrialSection({ isCompleted, onAdvance, onNavigateOut }: SectionProps) {
  const { mcdc, setVerdict, caseFile, markCaseCompleted, completedCases, loadCaseById, resetMcdc } = useGameStore()
  const techniqueLabel = (caseFile?.technique && TECHNIQUE_LABEL[caseFile.technique]) ?? 'CASE'
  const [trialPhase, setTrialPhase] = useState<TrialPhase>('presenting')

  const seededFaultMap: Record<string, string> = {}
  if (caseFile) {
    for (const f of caseFile.seeded_faults) seededFaultMap[f.id] = f.description
  }

  useEffect(() => {
    if (trialPhase === 'deliberating') {
      const t = setTimeout(() => {
        if (caseFile?.question_type === 'pair_selector') {
          const result   = validateMcdcCoverage({ selectedRows: mcdc.selectedRows, independencePairs: mcdc.independencePairs })
          const faults   = simulateFaults({ selectedRows: mcdc.selectedRows, independencePairs: mcdc.independencePairs })
          const miscList = detectMisconceptions({ selectedRows: mcdc.selectedRows, independencePairs: mcdc.independencePairs })
          setVerdict(result, faults, miscList)
        }
        setTrialPhase('verdict')
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [trialPhase, caseFile, mcdc.independencePairs, mcdc.selectedRows, setVerdict])

  const { verdictResult, faultResults, misconceptions } = mcdc
  const isGuilty = Boolean(verdictResult?.coverageAchieved && faultResults.every(f => f.detected))

  useEffect(() => {
    if (trialPhase === 'verdict' && isGuilty && caseFile) {
      markCaseCompleted(caseFile.id)
    }
  }, [trialPhase, isGuilty, caseFile, markCaseCompleted])

  const phaseLabels: TrialPhase[] = ['presenting', 'deliberating', 'verdict']

  const totalCompleted = completedCases.length
  const canAdvance = isGuilty || (caseFile && completedCases.includes(caseFile.id))
  const isLastCase = caseFile && nextCaseId(caseFile.id) === null

  const handleRetry = () => {
    if (!caseFile) return
    resetMcdc()
  }

  const handleNext = () => {
    if (!caseFile || !canAdvance) return
    const next = nextCaseId(caseFile.id)
    if (next) {
      loadCaseById(next)
    } else {
      if (onNavigateOut) onNavigateOut('map')
    }
  }

  return (
    <div>
      {/* Courtroom scene */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 40, flexWrap: 'wrap' }}>
          <ProsecutorSprite size={110} pose="pointing" isTalking={trialPhase === 'presenting'} />
          <JudgeSprite size={140} pose={trialPhase === 'verdict' ? 'verdict' : 'idle'} isTalking={trialPhase === 'verdict'} />
          <DefenseSprite size={110} pose={trialPhase === 'verdict' && !isGuilty ? 'objecting' : 'idle'} isTalking={trialPhase === 'deliberating'} />
        </div>
      </div>

      {/* Phase indicator */}
      {caseFile?.question_type === 'pair_selector' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
          <ScoreChip label="PAIRS" value={mcdc.independencePairs.length} color={TC.blue} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
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

      {/* VERDICT UI: Combined Trial Conclusion */}
      {trialPhase === 'verdict' && verdictResult && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          maxWidth: 800,
          margin: '0 auto',
          animation: 'fadeIn 0.3s steps(4)'
        }}>
          {/* Verdict Box */}
          <div style={{
            textAlign: 'center', padding: '24px 30px',
            background: isGuilty ? `${TC.green}15` : `${TC.magenta}15`,
            border: `4px solid ${isGuilty ? TC.green : TC.magenta}`,
            boxShadow: `6px 6px 0 ${TC.ink}`,
          }}>
             <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.grey, marginBottom: 10 }}>THE VERDICT IS</div>
             <div style={{ fontFamily: PIXEL_FONT, fontSize: 32, color: isGuilty ? TC.green : TC.magenta, lineHeight: 1.2 }}>
               {isGuilty ? 'GUILTY' : 'MISTRIAL'}
             </div>
             <div style={{ fontFamily: HAND_FONT, fontSize: 16, fontWeight: 400, color: TC.ink, marginTop: 16, lineHeight: 1.5 }}>
               {isGuilty
                 ? 'The defendant has been found guilty. All faults detected.'
                 : 'The defendant walks free. Your evidence was incomplete — the bug escapes.'}
             </div>
          </div>

          {/* Coverage & ISO side by side */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Coverage Achieved (50%) */}
            <div style={{ flex: '1 1 300px', background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`, padding: 16 }}>
               <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.blue, marginBottom: 16 }}>COVERAGE ACHIEVED</div>
               <CoverageMeter value={verdictResult.coveragePercent} max={100} color={TC.green} width="100%" />
               {caseFile?.question_type === 'pair_selector' && (
                 <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                   {(['A', 'B', 'C'] as const).map(cond => {
                     const hit = verdictResult.conditionsCovered.includes(cond)
                     return (
                       <div key={cond} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO_FONT, fontSize: 12 }}>
                         <span style={{ color: hit ? TC.green : TC.magenta, fontFamily: PIXEL_FONT, fontSize: 10 }}>
                           {hit ? '✓' : '✗'}
                         </span>
                         <span style={{ color: TC.ink }}>Cond {cond}</span>
                       </div>
                     )
                   })}
                 </div>
               )}
            </div>

            {/* ISO Reference (50%) */}
            <div style={{ flex: '1 1 300px', background: `${TC.orange}08`, border: `2px solid ${TC.orange}`, padding: 16 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.orange, marginBottom: 12 }}>ISO 29119-4 REFERENCE</div>
              <div style={{ fontFamily: MONO_FONT, fontSize: 13, color: TC.ink, lineHeight: 1.6 }}>
                {(caseFile?.iso_clauses ?? []).map((cl) => (
                  <div key={cl}><strong>{cl}</strong></div>
                ))}
                {(caseFile?.iso_clauses?.length ?? 0) === 0 && (
                  <div><strong>§5.3</strong> Test design</div>
                )}
              </div>
            </div>
          </div>

          {/* UNIFIED REPORT CARD */}
          <div style={{ background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`, padding: 20 }}>
             {/* VERDICT BASIS & FAULTS */}
             <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.magenta, marginBottom: 16 }}>VERDICT BASIS & FAULTS</div>
             {faultResults.length > 0 ? (
               faultResults.map(f => (
                 <div key={f.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', background: f.detected ? `${TC.green}10` : `${TC.magenta}10`, border: `1px solid ${f.detected ? TC.green : TC.magenta}`, marginBottom: 12 }}>
                   <BugSprite size={36} type="mcdc" mood={f.detected ? 'caught' : 'nervous'} />
                   <div>
                     <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: f.detected ? TC.green : TC.magenta }}>{f.id}: {f.detected ? 'CAUGHT' : 'ESCAPED'}</div>
                     <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, marginTop: 6, lineHeight: 1.5 }}>
                       {seededFaultMap[f.id] ?? 'Seeded fault'}
                       {!f.detected && ' To detect this, construct a test that exercises the masked path.'}
                     </div>
                   </div>
                 </div>
               ))
             ) : (
                 <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', background: isGuilty ? `${TC.green}10` : `${TC.magenta}10`, border: `1px solid ${isGuilty ? TC.green : TC.magenta}`, marginBottom: 12 }}>
                   <BugSprite size={36} type="mcdc" mood={isGuilty ? 'caught' : 'nervous'} />
                   <div>
                     <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: isGuilty ? TC.green : TC.magenta }}>
                       {isGuilty ? 'VERDICT CONSISTENT' : 'INCORRECT VERDICT'}
                     </div>
                     <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, marginTop: 6, lineHeight: 1.5 }}>
                       {isGuilty ? (caseFile?.correct_answer_explanation ?? 'Your answer satisfies the required coverage criterion.') : (caseFile?.wrong_answer_explanation ?? 'Your answer did not satisfy the required coverage criterion.')}
                     </div>
                   </div>
                 </div>
             )}

             {/* Misconceptions */}
             {!isGuilty && misconceptions.some(m => m.triggered) && (
               <>
                 <div style={{ height: 2, borderBottom: `2px dashed ${TC.grid}`, margin: '20px 0' }} />
                 <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.magenta, marginBottom: 10 }}>MISCONCEPTION LOG</div>
                 {misconceptions.filter(m => m.triggered).map(m => (
                   <div key={m.id} style={{ fontFamily: HAND_FONT, fontSize: 16, fontWeight: 400, color: TC.ink, lineHeight: 1.5, marginBottom: 8 }}>
                     {m.explanation ?? 'A reasoning trap was triggered — re-read the hint chain in the case file.'}
                   </div>
                 ))}
               </>
             )}

             {/* What The Textbook Says */}
             <div style={{ height: 2, borderBottom: `2px dashed ${TC.grid}`, margin: '20px 0' }} />
             <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.magenta, marginBottom: 12 }}>WHAT THE TEXTBOOK SAYS</div>
             <div style={{ fontFamily: HAND_FONT, fontSize: 16, fontWeight: 400, color: TC.ink, lineHeight: 1.5 }}>
               {(caseFile?.technique && TECHNIQUE_TEXTBOOK[caseFile.technique]) ?? 'Apply the coverage technique required for this act.'}
             </div>
          </div>

          {/* Bug in jail (Moved to bottom above buttons) */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0', background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}` }}>
            <BugSprite
              mood={isGuilty ? 'prisoned' : 'escaped'}
              className="!w-full !h-auto max-w-[240px] opacity-90"
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PixelButton variant="danger" onClick={handleRetry}>RETRY CASE</PixelButton>
            <PixelButton variant="secondary" onClick={() => onNavigateOut && onNavigateOut('law-library')}>OPEN ANNEX C</PixelButton>
            <PixelButton variant="primary" onClick={handleNext} disabled={!canAdvance}>
              {isLastCase ? 'CAMPAIGN MAP →' : 'NEXT CASE →'}
            </PixelButton>
          </div>
        </div>
      )}

      {/* Trial presenting state */}
      {trialPhase === 'presenting' && !isCompleted && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <PixelButton variant="primary" onClick={() => setTrialPhase('deliberating')}>
            SUBMIT EVIDENCE →
          </PixelButton>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.grey, marginTop: 16 }}>
            The court is ready to hear your case.
          </div>
        </div>
      )}

      {/* Trial deliberating state */}
      {trialPhase === 'deliberating' && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.grey }}>
            COURT IS DELIBERATING...
          </div>
        </div>
      )}
    </div>
  )
}
