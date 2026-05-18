import type { CaseResult, Court, CourtSubmission, MockTrialCase, SelfScore } from './types.js'

export function computeCaseScore(
  caseData: MockTrialCase,
  sub: CourtSubmission,
): CaseResult {
  const verdictScore: 0 | 2 = sub.verdict === caseData.correctVerdict ? 2 : 0

  const prosArg = caseData.prosecutorArguments.find((a) => a.id === sub.prosecutorArgId)
  const prosecutorBonus: 0 | 1 = prosArg?.isStrong ? 1 : 0

  const defArg = caseData.defenseArguments.find((a) => a.id === sub.defenseArgId)
  const defenseBonus: 0 | 1 = defArg?.isStrong ? 1 : 0

  const juryBonus: SelfScore | 0 = sub.selfScore ?? 0

  const caseTotal = verdictScore + prosecutorBonus + defenseBonus + juryBonus

  return {
    caseId: caseData.id,
    submission: sub,
    verdictScore,
    prosecutorBonus,
    defenseBonus,
    juryBonus,
    hostOverride: 0,
    caseTotal,
  }
}

export function applyHostOverride(result: CaseResult, delta: number): CaseResult {
  return { ...result, hostOverride: result.hostOverride + delta, caseTotal: result.caseTotal + delta }
}

export interface LeaderboardEntry {
  id: string
  name: string
  totalScore: number
  lastCaseDelta: number
  rank: number
}

export function buildLeaderboard(courts: Map<string, Court>): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = Array.from(courts.values()).map((c) => {
    const lastEntry = c.caseHistory[c.caseHistory.length - 1]
    return {
      id: c.id,
      name: c.name,
      totalScore: c.totalScore,
      lastCaseDelta: lastEntry?.caseTotal ?? 0,
      rank: 0,
    }
  })
  entries.sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name))
  entries.forEach((e, i) => { e.rank = i + 1 })
  return entries
}
