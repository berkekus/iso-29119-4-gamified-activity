// Canonical play order of all 12 campaign cases. Used by both the campaign
// map (sequential gating) and the Debrief NEXT CASE button (advance to next).
//
// ACT I  : stmt-tutorial-01, stmt-hidden-branch-01, branch-loop-trap-01
// ACT II : decision-and-trap-01, bc-or-three-cond-01, bc-negation-mask-01
// ACT III: bcc-intro-01, bcc-vs-bc-01, bcc-explosion-01
// ACT IV : mcdc-tutorial-01, mcdc-trap-isolation-01, mcdc-vault-boss-01, mcdc-showdown-01

export const CASE_ORDER = [
  'stmt-tutorial-01',
  'stmt-hidden-branch-01',
  'branch-loop-trap-01',
  'decision-and-trap-01',
  'bc-or-three-cond-01',
  'bc-negation-mask-01',
  'bcc-intro-01',
  'bcc-vs-bc-01',
  'bcc-explosion-01',
  'mcdc-tutorial-01',
  'mcdc-trap-isolation-01',
  'mcdc-vault-boss-01',
  'mcdc-showdown-01',
] as const

export type CaseId = (typeof CASE_ORDER)[number]

/**
 * Returns the next case id in the canonical order, or null if `currentId` is
 * the last case (or unknown). Callers treat null as "end of campaign — go
 * back to the campaign map".
 */
export function nextCaseId(currentId: string | null | undefined): string | null {
  if (!currentId) return null
  const idx = CASE_ORDER.indexOf(currentId as CaseId)
  if (idx === -1) return null
  if (idx >= CASE_ORDER.length - 1) return null
  return CASE_ORDER[idx + 1] ?? null
}
