import { z } from 'zod'
import raw from './achievements.json'

const AchievementSchema = z.object({
  id: z.string(),
  act: z.string(),
  title: z.string(),
  description: z.string(),
  required_cases: z.array(z.string()).nonempty(),
})

const AchievementsFileSchema = z.object({
  achievements: z.array(AchievementSchema),
})

export type Achievement = z.infer<typeof AchievementSchema>

export const ACHIEVEMENTS: readonly Achievement[] = AchievementsFileSchema.parse(raw).achievements

/**
 * Pure: derive the set of achievement ids that are unlocked given the player's
 * completedCases. An achievement unlocks iff every one of its required_cases
 * is present in completedCases.
 */
export function unlockedAchievementIds(completedCases: readonly string[]): string[] {
  const completed = new Set(completedCases)
  return ACHIEVEMENTS.filter((a) => a.required_cases.every((c) => completed.has(c))).map(
    (a) => a.id,
  )
}

export function achievementById(id: string): Achievement | null {
  return ACHIEVEMENTS.find((a) => a.id === id) ?? null
}
