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
// Inputs and outcomes are usually booleans (decision-coverage cases), but
// some statement-coverage cases use strings/numbers because the function
// under test takes string/number arguments and returns a string/number.
// Permissive: a test row may carry any JSON value (boolean for decision
// cases, string/number/list for statement cases that exercise non-boolean
// signatures). Engine code that needs booleans casts at the use site.
const InputValueSchema: z.ZodType<unknown> = z.unknown()
const OutcomeValueSchema: z.ZodType<unknown> = z.unknown()

const TestSetRowSchema = z.object({
  id: z.string(),
  inputs: z.record(z.string(), InputValueSchema),
  outcome: OutcomeValueSchema,
})

const QuestionTypeEnum = z.enum([
  'binary_verdict',
  'level_picker',
  'coverage_table',
  'pair_selector',
  'test_designer',
  'numeric_input',
  'dialogue_objection',
  'evidence_board',
  'budget_strategy',
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
  /** Optional per-option explanation shown on submit (correct or wrong). */
  explanation: z.string().optional(),
})

/** Numeric prompt used by numeric_input bridge quizzes. */
const NumericPromptSchema = z.object({
  question: z.string(),
  answer: z.number(),
  unit: z.string().optional(),
})

/** A row in a coverage_table interaction (toggle which test rows to include). */
const CoverageTableRowSchema = z.object({
  id: z.string(),
  inputs: z.record(z.string(), InputValueSchema),
  outcome: OutcomeValueSchema,
  /** True if the row MUST be included to satisfy the case correctness. */
  required: z.boolean(),
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
  /** Multi-choice options for level_picker / binary_verdict / test_designer. */
  options: z.array(OptionSchema).optional(),
  /** Charge sheet — 1-3 sentences describing what the defendant code is alleged to do wrong. Replaces hints in the BriefingScreen CHARGES panel. */
  charges: z.array(z.string()).optional(),
  /** One or more numeric prompts for numeric_input bridge quizzes. */
  numeric_prompts: z.array(NumericPromptSchema).optional(),
  /** Toggle-rows interaction for coverage_table cases. */
  coverage_table: z.array(CoverageTableRowSchema).optional(),
  /** Exact pick count required for test_designer cases (e.g. 5 rows of 16). */
  required_pick_count: z.number().int().positive().optional(),
  /** Short feedback shown when the player submits a wrong answer. */
  wrong_answer_explanation: z.string().optional(),
  /** Short feedback shown when the player submits the correct answer. */
  correct_answer_explanation: z.string().optional(),
  /** Dialogue fragments for dialogue_objection */
  fragments: z.array(z.string()).optional(),
  required_fragments: z.array(z.string()).optional(),
  /** Clues for evidence_board */
  evidence_board_clues: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
  required_connection: z.tuple([z.string(), z.string()]).optional(),
})

export type CaseFile = z.infer<typeof CaseFileSchema>

export function loadCase(json: unknown): CaseFile {
  return CaseFileSchema.parse(json)
}
