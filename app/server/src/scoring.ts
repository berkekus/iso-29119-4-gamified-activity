// Server-side scoring — Kahoot-style, uses server timestamps, never trusts client clock.
//
// Correct answer:  500 (base) + up to 500 (speed bonus) = 500–1000 pts
// Wrong / no answer: 0 pts
// Answered instantly → 1000 pts  |  answered at last second → ~500 pts

const MIN_CORRECT_POINTS = 500   // guaranteed for any correct answer
const SPEED_BONUS_MAX    = 500   // extra for answering fast

export interface ScoreResult {
  isCorrect: boolean
  pointsEarned: number
}

/**
 * Compute points for a submitted answer.
 * @param optionId     The option the player chose
 * @param correctId    The ground-truth correct option
 * @param submittedAt  Server.Date.now() when the event arrived
 * @param startedAt    Server.Date.now() when the question was broadcast
 * @param timeLimitMs  Question time limit in milliseconds
 */
export function computeScore(
  optionId: string,
  correctId: string,
  submittedAt: number,
  startedAt: number,
  timeLimitMs: number,
): ScoreResult {
  const isCorrect = optionId === correctId

  if (!isCorrect) return { isCorrect: false, pointsEarned: 0 }

  const elapsed = Math.max(0, submittedAt - startedAt)
  const remaining = Math.max(0, timeLimitMs - elapsed)
  const ratio = remaining / timeLimitMs
  const speedBonus = Math.round(ratio * SPEED_BONUS_MAX)

  return { isCorrect: true, pointsEarned: MIN_CORRECT_POINTS + speedBonus }
}

/** Build a sorted leaderboard from the player map. */
export function buildLeaderboard(
  players: Map<string, { id: string; nickname: string; avatar: import('./types.js').AvatarId; score: number; answers: Record<string, { isCorrect: boolean }> }>,
  prevScores: Map<string, number>,
): import('./types.js').LeaderboardEntry[] {
  const entries = Array.from(players.values()).map((p) => {
    const correctAnswers = Object.values(p.answers).filter((a) => a.isCorrect).length
    const prev = prevScores.get(p.id) ?? 0
    return {
      playerId: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
      correctAnswers,
      delta: p.score - prev,
      rank: 0,
    }
  })

  entries.sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname))
  entries.forEach((e, i) => { e.rank = i + 1 })

  return entries
}
