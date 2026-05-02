import { z } from 'zod'

const ConditionSchema = z.object({
  id: z.string(),
  label: z.string(),
})

const FaultTriggerSchema = z.object({
  condition: z.string(),
  requiredDecisionFlip: z.boolean(),
})

const SeededFaultSchema = z.object({
  id: z.string(),
  description: z.string(),
  trigger: FaultTriggerSchema,
})

const MisconceptionSchema = z.object({
  id: z.string(),
  explanation_md: z.string(),
})

// ─── Single-player extension schemas ──────────────────────────────────
const TestSetRowSchema = z.object({
  id: z.string(),
  inputs: z.record(z.string(), z.boolean()),
  outcome: z.boolean(),
})

const QuestionTypeEnum = z.enum([
  'binary_verdict',
  'level_picker',
  'coverage_table',
  'pair_selector',
  'test_designer',
  'numeric_input',
])

const TechniqueEnum = z.enum([
  'STATEMENT',
  'BRANCH',
  'DECISION',
  'BC',
  'BCC',
  'MCDC',
])

/** Multi-choice option used by level_picker (and other discrete-choice) cases. */
const OptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  is_correct: z.boolean(),
})

export const CaseFileSchema = z.object({
  id: z.string(),
  // 'act' is the campaign chapter; we keep legacy values + add hierarchy acts
  act: z.enum(['MCDC', 'BCC', 'Combinatorial', 'DataFlow', 'STMT_BRANCH', 'DECISION_BC']),
  difficulty: z.number().int().min(1).max(3),
  iso_clauses: z.array(z.string()),
  scenario: z.object({
    title: z.string(),
    narrative: z.string(),
    code: z.string(),
    conditions: z.array(ConditionSchema),
    decision_expression: z.string(),
  }),
  seeded_faults: z.array(SeededFaultSchema),
  misconceptions: z.array(MisconceptionSchema),

  // ─── NEW (optional, single-player) ────────────────────────────────
  technique: TechniqueEnum.optional(),
  layer: z.number().int().min(1).max(4).optional(),
  question_type: QuestionTypeEnum.optional(),
  misconception_target: z.string().optional(),
  test_set: z.array(TestSetRowSchema).optional(),
  claim: z.string().optional(),
  /** 3-tier progressive hint chain: general → specific → worked solution. */
  hints: z.array(z.string()).optional(),
  /** Estimated time-to-solve in seconds (UX pacing). */
  estimated_time_sec: z.number().int().positive().optional(),
  /** Concept Analysis cross-reference, e.g. §3 row index. */
  concept_ref: z.string().optional(),
  /** Multi-choice options for level_picker / similar question types. */
  options: z.array(OptionSchema).optional(),
})

export type CaseFile = z.infer<typeof CaseFileSchema>

export function loadCase(json: unknown): CaseFile {
  return CaseFileSchema.parse(json)
}
