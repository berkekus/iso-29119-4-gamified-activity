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
import type { Screen } from '../../stores/gameStore'
import { CASE_ORDER, nextCaseId } from '../../content/caseOrder'
import { achievementById } from '../../content/achievements'
import type { SectionProps } from './types'

type TrialPhase = 'presenting' | 'deliberating' | 'verdict'

const TECHNIQUE_LABEL: Record<string, string> = {
  STATEMENT: 'STATEMENT', BRANCH: 'BRANCH', DECISION: 'DECISION',
  BC: 'BC', BCC: 'BCC', MCDC: 'MC/DC',
}

const TECHNIQUE_TEXTBOOK: Record<string, string> = {
  STATEMENT:
    'Statement coverage requires every executable line of code to run at least once across the test set. It is the weakest structural criterion: 100% statement coverage does NOT mean every branch or condition has been exercised.',
  BRANCH:
    'Branch coverage requires every edge of the control-flow graph to be taken at least once — including the implicit FALSE edge of an if without an else. Reaching every line is not enough; every decision outcome must occur.',
  DECISION:
    'Decision coverage requires every decision in the program to take both TRUE and FALSE outcomes. Stronger than branch coverage when there are short-circuit operators, because each whole decision (not each branch) must flip.',
  BC:
    'Branch Condition coverage requires each individual condition inside a compound decision to be observed as both TRUE and FALSE across the test set. It detects single-condition oversights but not interactions between conditions.',
  BCC:
    'Branch Condition Combination coverage requires every combination of TRUE/FALSE across all N conditions of a decision — i.e. all 2^N rows of the truth table. It is exhaustive but its cost grows exponentially with the number of conditions.',
  MCDC:
    "MC/DC requires that for each condition in a decision, there exist test cases that show the condition independently affects the decision's outcome. \"Independently\" means exactly one condition changes between two test cases while all others remain fixed, and the decision outcome changes.",
}

interface TrialSectionProps extends SectionProps {
  onNavigateOut: (screen: Screen) => void
}

export default function TrialSection({ isCompleted, onNavigateOut }: TrialSectionProps) {
  const {
    mcdc, setVerdict, caseFile, completedCases,
    loadCaseById, markCaseCompleted, resetMcdc,
    newlyUnlockedAchievement, clearNewlyUnlockedAchievement,
    lastDialogueMatchIndex,
    lastBudgetStrategyIncludedHighRisk,
    lastVaultEvaluation,
  } = useGameStore()

  const [trialPhase, setTrialPhase] = useState<TrialPhase>('presenting')

  const seededFaultMap: Record<string, string> = {}
  const misconceptionMap: Record<string, string> = {}
  if (caseFile) {
    for (const f of caseFile.seeded_faults) seededFaultMap[f.id] = f.description
    for (const m of caseFile.misconceptions) misconceptionMap[m.id] = m.explanation_md
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
  }, [trialPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  const { verdictResult, faultResults, misconceptions } = mcdc
  const isGuilty = Boolean(verdictResult?.coverageAchieved && faultResults.every(f => f.detected))

  // Side effect: mark case complete on the first GUILTY verdict
  useEffect(() => {
    if (isGuilty && caseFile?.id) markCaseCompleted(caseFile.id)
  }, [isGuilty, caseFile?.id, markCaseCompleted])

  const techniqueLabel =
    (caseFile?.technique && TECHNIQUE_LABEL[caseFile.technique]) ?? 'CASE'

  const newAchievement = newlyUnlockedAchievement
    ? achievementById(newlyUnlockedAchievement)
    : null

  // Per-path dialogue debrief — set on a passing dialogue_objection answer
  const dialogueDebrief =
    isGuilty &&
    caseFile &&
    lastDialogueMatchIndex !== null &&
    caseFile.dialogue_correct_explanations &&
    lastDialogueMatchIndex < caseFile.dialogue_correct_explanations.length
      ? caseFile.dialogue_correct_explanations[lastDialogueMatchIndex]
      : null

  const budgetDebriefBlock = caseFile?.budget_debrief
  const budgetDebrief =
    isGuilty &&
    budgetDebriefBlock &&
    lastBudgetStrategyIncludedHighRisk !== null
      ? `${budgetDebriefBlock.fraction_paragraph}\n\n${
          lastBudgetStrategyIncludedHighRisk
            ? budgetDebriefBlock.when_high_risk_included
            : budgetDebriefBlock.when_high_risk_missed
        }\n\n${budgetDebriefBlock.mc_dc_bridge}`
      : null

  const vaultPartialOk =
    lastVaultEvaluation
      ? (lastVaultEvaluation.m_ok || lastVaultEvaluation.k_ok || lastVaultEvaluation.t_ok)
      : false
  const vaultBorderColor = lastVaultEvaluation
    ? lastVaultEvaluation.all_ok ? TC.green : vaultPartialOk ? TC.orange : TC.magenta
    : TC.grid

  const triggeredMisconceptions = misconceptions.filter(m => m.triggered)
  const totalCompleted = completedCases.filter((id) =>
    (CASE_ORDER as readonly string[]).includes(id),
  ).length

  const nextId = nextCaseId(caseFile?.id)
  const isLastCase = caseFile?.id === CASE_ORDER[CASE_ORDER.length - 1]
  const canAdvance = isGuilty

  const handleRetry = () => {
    clearNewlyUnlockedAchievement()
    resetMcdc()
    // phase resets to 'briefing' via resetMcdc — CasePlayScreen scrolls to top
  }

  const handleNext = () => {
    if (!canAdvance) return
    clearNewlyUnlockedAchievement()
    if (nextId) {
      try {
        loadCaseById(nextId)
      } catch (err) {
        console.error('[TrialSection] Failed to load next case', nextId, err)
      }
    } else {
      onNavigateOut('campaign')
    }
  }

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

      {/* Phase indicator (pair_selector only) */}
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

            {(faultResults.length > 0 || !isGuilty) && (
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
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px',
                    background: `${TC.magenta}10`,
                    border: `1px solid ${TC.magenta}`,
                  }}>
                    <BugSprite size={30} type="mcdc" mood="escaped" />
                    <div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta }}>
                        INCORRECT VERDICT
                      </div>
                      <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey, marginTop: 3, lineHeight: 1.5 }}>
                        {caseFile?.wrong_answer_explanation ??
                          'Your answer did not satisfy the required coverage criterion. Re-examine the claim and the test set.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* VERDICT CONSISTENT — separate full-width panel for GUILTY + no seeded faults */}
          {isGuilty && faultResults.length === 0 && (
            <div style={{
              background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`,
              padding: 16, marginBottom: 20,
            }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.green, marginBottom: 12 }}>VERDICT BASIS</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: `${TC.green}10`,
                border: `1px solid ${TC.green}`,
              }}>
                <BugSprite size={30} type="mcdc" mood="caught" />
                <div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.green }}>
                    VERDICT CONSISTENT
                  </div>
                  <div style={{ fontFamily: MONO_FONT, fontSize: 11, color: TC.grey, marginTop: 3, lineHeight: 1.5 }}>
                    {caseFile?.correct_answer_explanation ?? 'Your answer satisfies the required coverage criterion.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievement unlock */}
          {newAchievement && (
            <div style={{
              fontFamily: PIXEL_FONT, fontSize: 9, color: TC.green,
              border: `2px solid ${TC.green}`, background: `${TC.green}10`,
              padding: '10px 14px', marginBottom: 20,
            }}>
              🏆 ACHIEVEMENT UNLOCKED — {newAchievement.title.toUpperCase()}
            </div>
          )}

          {/* Dialogue debrief */}
          {dialogueDebrief && (
            <div style={{
              background: `${TC.green}08`,
              border: `2px solid ${TC.green}`,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.green, marginBottom: 10 }}>
                OBJECTION SUSTAINED — CASE RECAP
              </div>
              <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {dialogueDebrief}
              </div>
            </div>
          )}

          {/* Budget debrief */}
          {budgetDebrief && (
            <div style={{
              background: `${TC.orange}08`,
              border: `2px solid ${TC.orange}`,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.orange, marginBottom: 10 }}>
                SUBPOENA STRATEGY — COVERAGE DEBRIEF
              </div>
              <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {budgetDebrief}
              </div>
            </div>
          )}

          {/* Vault evaluation */}
          {lastVaultEvaluation && (
            <div style={{
              background: `${vaultBorderColor}08`,
              border: `2px solid ${vaultBorderColor}`,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: vaultBorderColor, marginBottom: 10 }}>
                INDEPENDENT EFFECT ANALYSIS
              </div>
              <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {lastVaultEvaluation.all_ok
                  ? 'You selected 4 rows that form valid independence pairs for M, K, and T.\n\nThis shows how a carefully interlocked N+1 suite can achieve MC/DC with fewer tests than full 2^N BCC. One test can participate in multiple independence pairs.'
                  : vaultPartialOk
                    ? `Your 4 tests demonstrated independence for some inputs, but not all three.\n\nPassed: ${(['M','K','T'] as const).filter(c => lastVaultEvaluation[`${c.toLowerCase()}_ok` as 'm_ok' | 'k_ok' | 't_ok']).join(', ')}.\nFailed: ${(['M','K','T'] as const).filter(c => !lastVaultEvaluation[`${c.toLowerCase()}_ok` as 'm_ok' | 'k_ok' | 't_ok']).join(', ')}.\n\nLook for a row pair where ONLY the missing condition flips and the decision flips — that is what proves independent effect.`
                    : 'With your chosen 4 tests, none of the three inputs was shown to independently affect the decision.\n\nThis is the "single flip" trap from the earlier tutorial: you changed too much at once, or picked rows where the decision never flipped. Find pairs where exactly one input changes and the outcome flips.'}
              </div>
            </div>
          )}

          {/* Textbook */}
          <div style={{ background: `${TC.blue}08`, border: `2px solid ${TC.blue}`, padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.blue, marginBottom: 10 }}>WHAT THE TEXTBOOK SAYS</div>
            <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.6 }}>
              {(caseFile?.technique && TECHNIQUE_TEXTBOOK[caseFile.technique]) ??
                'Apply the coverage technique required for this act and confirm the claim against the standard of proof.'}
            </div>
          </div>

          {/* ISO Reference */}
          <div style={{ background: `${TC.orange}08`, border: `2px solid ${TC.orange}`, padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.orange, marginBottom: 10 }}>ISO/IEC/IEEE 29119-4 REFERENCE</div>
            <div style={{ fontFamily: MONO_FONT, fontSize: 13, color: TC.ink, lineHeight: 1.6 }}>
              {(caseFile?.iso_clauses ?? []).map((cl) => (
                <div key={cl}><strong>{cl}</strong></div>
              ))}
              {(caseFile?.iso_clauses?.length ?? 0) === 0 && (
                <div><strong>§5.3</strong> Test design techniques</div>
              )}
            </div>
          </div>

          {/* Misconception probe */}
          {triggeredMisconceptions.length > 0 && (
            <div style={{
              background: `${TC.magenta}08`, border: `2px solid ${TC.magenta}`,
              padding: 16, marginBottom: 20,
            }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginBottom: 10 }}>MISCONCEPTION DETECTED</div>
              {triggeredMisconceptions.map(m => (
                <div key={m.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.ink, marginBottom: 6 }}>{m.id}</div>
                  <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.55 }}>
                    {misconceptionMap[m.id] ?? m.explanation ?? 'A reasoning trap was triggered — re-read the hint chain in the case file.'}
                  </div>
                </div>
              ))}
              <div style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.grey, marginTop: 10 }}>
                See ISO 29119-4 {(caseFile?.iso_clauses && caseFile.iso_clauses[0]) ?? '§5.3'} for the coverage criterion definition.
              </div>
            </div>
          )}

          {/* Campaign progress */}
          <div style={{ padding: 14, border: `2px solid ${TC.grid}`, background: TC.cream, marginBottom: 20 }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 10, textAlign: 'center' }}>CAMPAIGN PROGRESS</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CoverageMeter value={totalCompleted} max={CASE_ORDER.length} label="TOTAL CASES" color={TC.blue} width={260} />
            </div>
          </div>

          {/* Action buttons */}
          {!isCompleted && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
              <PixelButton variant="danger" onClick={handleRetry}>RETRY CASE</PixelButton>
              <PixelButton variant="secondary" onClick={() => onNavigateOut('law-library')}>OPEN ANNEX C</PixelButton>
              <PixelButton variant="primary" onClick={handleNext} disabled={!canAdvance}>
                {isLastCase ? 'CAMPAIGN MAP →' : 'NEXT CASE →'}
              </PixelButton>
            </div>
          )}
          {!canAdvance && !isCompleted && (
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey, textAlign: 'center', marginBottom: 20 }}>
              Retry this case to unlock the next one
            </div>
          )}

          {/* Technique label */}
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.grey, textAlign: 'center', marginBottom: 20 }}>
            {techniqueLabel}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, paddingBottom: 20, animation: 'fadeIn 1s ease-in' }}>
            <BugSprite
              mood={isGuilty ? 'prisoned' : 'escaped'}
              className="!w-full !h-auto max-w-[240px] sm:max-w-[300px] md:max-w-[380px] opacity-90 transition-all"
            />
          </div>
        </div>
      )}

      {trialPhase === 'presenting' && !isCompleted && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <PixelButton variant="primary" onClick={() => setTrialPhase('deliberating')}>
            SUBMIT EVIDENCE →
          </PixelButton>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.grey, marginTop: 12 }}>
            The court is ready to hear your case.
          </div>
        </div>
      )}

      {trialPhase === 'deliberating' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey }}>
            COURT IS DELIBERATING...
          </div>
        </div>
      )}
    </div>
  )
}
