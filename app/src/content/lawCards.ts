import { z } from 'zod'
import raw from './lawCards.json'

// ── Zod schema ───────────────────────────────────────────────────────────────
const LawCardSchema = z.object({
  id: z.string(),
  technique: z.enum(['STATEMENT', 'BRANCH', 'DECISION', 'BC', 'BCC', 'MCDC']),
  title: z.string(),
  iso_clause: z.string(),
  short_definition: z.string(),
  long_description: z.string(),
  pitfall: z.string(),
  example_note: z.string(),
})

const LawCardsFileSchema = z.object({
  lawCards: z.array(LawCardSchema),
})

export type LawCard = z.infer<typeof LawCardSchema>

// Parse-once at module load — surfaces malformed content immediately.
export const LAW_CARDS: readonly LawCard[] = LawCardsFileSchema.parse(raw).lawCards

// ── Case → law card mapping ──────────────────────────────────────────────────
// One entry per case in CASE_ORDER. Mapping lifted verbatim from the spec —
// when the case's `technique` field cleanly disambiguates we still pin the
// id explicitly so future edits don't drift.
export const CASE_TO_LAW: Record<string, string> = {
  'stmt-tutorial-01':           'law-statement',
  'stmt-hidden-branch-01':      'law-branch',
  'branch-loop-trap-01':        'law-branch',
  'decision-and-trap-01':       'law-decision',
  'bc-or-three-cond-01':        'law-bc',
  'bc-negation-mask-01':        'law-bc',
  'bcc-intro-01':               'law-bcc',
  'bcc-vs-bc-01':               'law-bcc',
  'bcc-explosion-01':           'law-bcc',
  'mcdc-tutorial-01':           'law-mcdc',
  'mcdc-altitude-disengage-01': 'law-mcdc',
  'mcdc-trap-isolation-01':     'law-mcdc',
  'mcdc-vault-boss-01':         'law-mcdc',
}

export function lawCardForCase(caseId: string | null | undefined): LawCard | null {
  if (!caseId) return null
  const lawId = CASE_TO_LAW[caseId]
  if (!lawId) return null
  return LAW_CARDS.find((c) => c.id === lawId) ?? null
}

export function lawCardById(id: string): LawCard | null {
  return LAW_CARDS.find((c) => c.id === id) ?? null
}
