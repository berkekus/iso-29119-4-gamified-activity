import { useEffect, useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import ScoreChip from '../ui/ScoreChip'
import CoverageMeter from '../ui/CoverageMeter'
import { JudgeSprite, ProsecutorSprite, DefenseSprite, BugSprite } from '../ui/CharacterSprites'
import { validateMcdcCoverage } from '../engine/coverage/mcdc'
import { simulateFaults } from '../engine/faults/simulator'
import { detectMisconceptions } from '../engine/misconceptions/detector'
import { useGameStore } from '../stores/gameStore'
import type { Screen } from '../stores/gameStore'

type Phase = 'presenting' | 'deliberating' | 'verdict'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const TECHNIQUE_LABEL: Record<string, string> = {
  STATEMENT: 'STATEMENT',
  BRANCH:    'BRANCH',
  DECISION:  'DECISION',
  BC:        'BC',
  BCC:       'BCC',
  MCDC:      'MC/DC',
}

export default function TrialScreen({ onNavigate, onBack }: Props) {
  const { mcdc, setVerdict, caseFile } = useGameStore()
  const techniqueLabel =
    (caseFile?.technique && TECHNIQUE_LABEL[caseFile.technique]) ?? 'CASE'
  const [phase, setPhase] = useState<Phase>('presenting')
  const seededFaultMap: Record<string, string> = {}
  if (caseFile) {
    for (const f of caseFile.seeded_faults) seededFaultMap[f.id] = f.description
  }

  useEffect(() => {
    if (phase === 'presenting') {
      const t = setTimeout(() => setPhase('deliberating'), 2500)
      return () => clearTimeout(t)
    }
    if (phase === 'deliberating') {
      const t = setTimeout(() => {
        if (caseFile?.question_type === 'pair_selector') {
          const result    = validateMcdcCoverage({ selectedRows: mcdc.selectedRows, independencePairs: mcdc.independencePairs })
          const faults    = simulateFaults({ selectedRows: mcdc.selectedRows, independencePairs: mcdc.independencePairs })
          const miscList  = detectMisconceptions({ selectedRows: mcdc.selectedRows, independencePairs: mcdc.independencePairs })
          setVerdict(result, faults, miscList)
        }
        setPhase('verdict')
      }, 2000)
      return () => clearTimeout(t)
    }
    return undefined
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const { verdictResult, faultResults, misconceptions } = mcdc
  const isGuilty = verdictResult?.coverageAchieved && faultResults.every(f => f.detected)

  const phaseLabels: Phase[] = ['presenting', 'deliberating', 'verdict']

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: 'clamp(16px, 3vw, 30px) clamp(16px, 4vw, 40px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <PixelButton small variant="secondary" onClick={onBack}>← EVIDENCE</PixelButton>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta, padding: '4px 10px', border: `2px solid ${TC.magenta}` }}>{techniqueLabel}</span>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta, padding: '4px 10px', border: `2px solid ${TC.magenta}`, background: `${TC.magenta}15` }}>PHASE 4: TRIAL</span>
        </div>
        {caseFile?.question_type === 'pair_selector' ? (
          <ScoreChip label="PAIRS" value={mcdc.independencePairs.length} color={TC.blue} />
        ) : (
          <div style={{ width: 60 }} />
        )}
      </div>

      {/* Courtroom scene */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 40 }}>
          <ProsecutorSprite size={110} pose="pointing" isTalking={phase === 'presenting'} />
          <JudgeSprite size={140} pose={phase === 'verdict' ? 'verdict' : 'idle'} isTalking={phase === 'verdict'} />
          <DefenseSprite size={110} pose={phase === 'verdict' && !isGuilty ? 'objecting' : 'idle'} isTalking={phase === 'deliberating'} />
        </div>
      </div>

      {/* Phase indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
        {phaseLabels.map((p, i) => (
          <div key={p} style={{
            fontFamily: PIXEL_FONT, fontSize: 8, padding: '6px 14px',
            background: phase === p ? TC.blue : 'transparent',
            color: phase === p ? '#fff' : TC.grey,
            border: `2px solid ${phase === p ? TC.blue : TC.grid}`,
          }}>
            {['PRESENTING', 'DELIBERATING', 'VERDICT'][i]}
            {phase === p && p !== 'verdict' && <span style={{ animation: 'blink 0.5s steps(2) infinite' }}> ...</span>}
          </div>
        ))}
      </div>

      {/* Verdict content */}
      {phase === 'verdict' && verdictResult && (
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

          {/* Two verdict layers */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            {/* Coverage */}
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

            {/* Faults */}
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

          <div style={{ textAlign: 'center' }}>
            <PixelButton variant="primary" onClick={() => onNavigate('debrief')}>VIEW DEBRIEF →</PixelButton>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40, paddingBottom: 40, animation: 'fadeIn 1s ease-in' }}>
            <BugSprite 
              mood={isGuilty ? 'prisoned' : 'escaped'} 
              className="!w-full !h-auto max-w-[240px] sm:max-w-[300px] md:max-w-[380px] opacity-90 transition-all" 
            />
          </div>
        </div>
      )}
    </div>
  )
}
