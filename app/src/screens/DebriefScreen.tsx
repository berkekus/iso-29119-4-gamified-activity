import { useEffect } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import CoverageMeter from '../ui/CoverageMeter'
import { JudgeSprite } from '../ui/CharacterSprites'
import { useGameStore } from '../stores/gameStore'
import type { Screen } from '../stores/gameStore'
import { CASE_ORDER, nextCaseId } from '../content/caseOrder'
import { achievementById } from '../content/achievements'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

// Maps a CaseFile.technique value to the short label rendered in the
// top-right header chip. Falls back to the act name for older content.
const TECHNIQUE_LABEL: Record<string, string> = {
  STATEMENT: 'STATEMENT',
  BRANCH:    'BRANCH',
  DECISION:  'DECISION',
  BC:        'BC',
  BCC:       'BCC',
  MCDC:      'MC/DC',
}

// Per-technique textbook paragraph rendered in the "WHAT THE TEXTBOOK SAYS"
// panel. Sourced from ISO/IEC/IEEE 29119-4 §5.3.x summaries — kept short
// because the screen also shows the case-specific misconception text below.
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

export default function DebriefScreen({ onNavigate, onBack }: Props) {
  const {
    mcdc, caseFile, completedCases, loadCaseById, markCaseCompleted, resetMcdc,
    newlyUnlockedAchievement, clearNewlyUnlockedAchievement,
  } = useGameStore()
  const newAchievement = newlyUnlockedAchievement
    ? achievementById(newlyUnlockedAchievement)
    : null
  const verdictResult = mcdc.verdictResult
  const faultResults = mcdc.faultResults ?? []
  const triggeredMisconceptions =
    (useGameStore.getState() as { triggeredMisconceptions?: unknown[] }).triggeredMisconceptions ??
    []
  const seededFaultMap: Record<string, string> = {}
  const misconceptionMap: Record<string, string> = {}
  if (caseFile) {
    for (const f of caseFile.seeded_faults) seededFaultMap[f.id] = f.description
    for (const m of caseFile.misconceptions) misconceptionMap[m.id] = m.explanation_md
  }

  const isGuilty = Boolean(
    verdictResult?.coverageAchieved && faultResults.every((f) => f.detected),
  )
  const coverageVal = verdictResult?.coveragePercent ?? 0

  // Record campaign progress only on a passing verdict (GUILTY). MISTRIAL
  // never unlocks the next case — the player must come back and pass.
  useEffect(() => {
    if (isGuilty && caseFile?.id) markCaseCompleted(caseFile.id)
  }, [isGuilty, caseFile?.id, markCaseCompleted])

  const techniqueLabel =
    (caseFile?.technique && TECHNIQUE_LABEL[caseFile.technique]) ??
    (caseFile?.act ? caseFile.act.replace(/_/g, ' ') : 'CASE')

  const nextId = nextCaseId(caseFile?.id)
  const isLastCase = caseFile?.id === CASE_ORDER[CASE_ORDER.length - 1]
  // NEXT CASE only advances on a passing verdict; otherwise it is disabled.
  const canAdvance = isGuilty

  const handleRetry = () => {
    clearNewlyUnlockedAchievement()
    resetMcdc()
    onNavigate('briefing')
  }

  const handleNext = () => {
    if (!canAdvance) return
    clearNewlyUnlockedAchievement()
    if (nextId) {
      try {
        loadCaseById(nextId)
        onNavigate('briefing')
      } catch (err) {
        console.error('[DebriefScreen] Failed to load next case', nextId, err)
      }
    } else {
      // Last case cleared → return to the campaign map (end-of-campaign path).
      onNavigate('campaign')
    }
  }

  const totalCompleted = completedCases.filter((id) =>
    (CASE_ORDER as readonly string[]).includes(id),
  ).length

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: '30px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <PixelButton small variant="secondary" onClick={onBack}>← TRIAL</PixelButton>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.magenta, padding: '4px 10px', border: `2px solid ${TC.magenta}` }}>{techniqueLabel}</span>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.grey, padding: '4px 10px', border: `2px solid ${TC.grid}` }}>PHASE 5: DEBRIEF</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 30 }}>
        {/* Main content */}
        <div style={{ flex: 1 }}>
          {/* Summary card */}
          <div style={{ background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `5px 5px 0 ${TC.ink}`, padding: 24, marginBottom: 20 }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: TC.magenta, marginBottom: 18, lineHeight: 1.4 }}>CASE DEBRIEF</div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 8 }}>VERDICT</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: isGuilty ? TC.green : TC.magenta }}>
                  {isGuilty ? 'GUILTY' : 'MISTRIAL'}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 8 }}>COVERAGE</div>
                <CoverageMeter value={coverageVal} max={100} color={isGuilty ? TC.green : TC.orange} width={140} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 8 }}>
                  {caseFile?.question_type === 'pair_selector' ? 'PAIRS SUBMITTED' : 'ANSWER'}
                </div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: TC.blue }}>
                  {caseFile?.question_type === 'pair_selector'
                    ? `${mcdc.independencePairs.length}/3`
                    : isGuilty ? 'CORRECT' : 'INCORRECT'}
                </div>
              </div>
            </div>

            {/* Achievement unlock — single line, reuses summary-card typography
                and the existing green accent. Renders only when this debrief
                run unlocked a new achievement. */}
            {newAchievement && (
              <div style={{
                fontFamily: PIXEL_FONT, fontSize: 9, color: TC.green,
                border: `2px solid ${TC.green}`, background: `${TC.green}10`,
                padding: '8px 12px', marginBottom: 16,
              }}>
                🏆 ACHIEVEMENT UNLOCKED — {newAchievement.title.toUpperCase()}
              </div>
            )}

            {/* Textbook — per-technique paragraph driven by caseFile.technique */}
            <div style={{ background: `${TC.blue}08`, border: `2px solid ${TC.blue}`, padding: 16, marginBottom: 16 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.blue, marginBottom: 10 }}>WHAT THE TEXTBOOK SAYS</div>
              <div style={{ fontFamily: HAND_FONT, fontSize: 18, color: TC.ink, lineHeight: 1.6 }}>
                {(caseFile?.technique && TECHNIQUE_TEXTBOOK[caseFile.technique]) ??
                  'Apply the coverage technique required for this act and confirm the claim against the standard of proof.'}
              </div>
            </div>

            {/* ISO Reference — pulled from the case JSON's iso_clauses */}
            <div style={{ background: `${TC.orange}08`, border: `2px solid ${TC.orange}`, padding: 16 }}>
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
          </div>

          {/* Fault analysis */}
          {faultResults.length > 0 && (
            <div style={{ background: TC.cream, border: `3px solid ${TC.ink}`, boxShadow: `4px 4px 0 ${TC.ink}`, padding: 16, marginBottom: 20 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.ink, marginBottom: 12 }}>FAULT ANALYSIS</div>
              {faultResults.map(f => (
                <div key={f.id} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '8px 10px', marginBottom: 6,
                  background: f.detected ? `${TC.green}10` : `${TC.magenta}10`,
                  border: `2px solid ${f.detected ? TC.green : TC.magenta}`,
                }}>
                  <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: f.detected ? TC.green : TC.magenta }}>{f.id}</span>
                  <div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: f.detected ? TC.green : TC.magenta }}>
                      {f.detected ? 'DETECTED' : 'ESCAPED'}
                    </div>
                    <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, marginTop: 4, lineHeight: 1.55 }}>
                      {seededFaultMap[f.id] ?? 'Seeded fault — see case file for details.'}
                      {!f.detected && ' To detect this, construct a test that exercises the masked path.'}
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
            <PixelButton variant="primary" onClick={handleNext} disabled={!canAdvance}>
              {isLastCase ? 'CAMPAIGN MAP →' : 'NEXT CASE →'}
            </PixelButton>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, border: `3px solid ${TC.ink}`, background: TC.cream, boxShadow: `4px 4px 0 ${TC.ink}` }}>
            <JudgeSprite size={100} pose="verdict" />
            <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, marginTop: 10, lineHeight: 1.55 }}>
              {isGuilty
                ? '"Excellent work, Prosecutor. The standard is satisfied. Case closed."'
                : '"A mistrial is not a failure — it\'s a lesson. Return with stronger evidence."'}
            </div>
          </div>

          {/* Misconception log */}
          {triggeredMisconceptions.length > 0 && (
            <div style={{ padding: 14, border: `3px solid ${TC.magenta}`, background: `${TC.magenta}08`, boxShadow: `4px 4px 0 ${TC.ink}` }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.magenta, marginBottom: 10 }}>MISCONCEPTION LOG</div>
              {mcdc.misconceptions.filter(m => m.triggered).map(m => (
                <div key={m.id}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.ink, marginBottom: 6 }}>{m.id}</div>
                  <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.ink, lineHeight: 1.55 }}>
                    {misconceptionMap[m.id] ?? m.explanation ?? 'A reasoning trap was triggered — re-read the hint chain in the case file.'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          <div style={{ padding: 14, border: `2px solid ${TC.grid}`, background: TC.cream }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 10 }}>PROGRESS</div>
            <CoverageMeter value={totalCompleted} max={CASE_ORDER.length} label="TOTAL CASES" color={TC.blue} width={220} />
          </div>
        </div>
      </div>
    </div>
  )
}
