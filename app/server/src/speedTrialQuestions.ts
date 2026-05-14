import type { SpeedTrialQuestion } from './types.js'

// ─── 5 round questions — ISO 29119-4 test design techniques ─────────────────

export const ROUND_QUESTIONS: SpeedTrialQuestion[] = [
  {
    id: 'q-stmt-01',
    round: 1,
    technique: 'STATEMENT',
    difficulty: 'easy',
    timeLimitSeconds: 25,
    prompt:
      'Statement Coverage requires every executable statement to run at least once.\n\nFor the function below, what is the MINIMUM number of test cases needed for 100% Statement Coverage?',
    codeSnippet:
      'function classify(score: number) {\n  if (score >= 90) return "A";\n  if (score >= 70) return "B";\n  return "C";\n}',
    options: [
      { id: 'a', text: '1 — any single test case is enough' },
      { id: 'b', text: '2 — one ≥90 and one <70' },
      { id: 'c', text: '3 — one per return statement' },
      { id: 'd', text: '4 — full boundary coverage' },
    ],
    correctOptionId: 'c',
    explanation:
      'There are 3 return statements — each is an executable statement in a separate branch. To cover all of them you need: score≥90 (→"A"), 70≤score<90 (→"B"), and score<70 (→"C"). That is 3 test cases minimum.',
  },

  {
    id: 'q-branch-01',
    round: 2,
    technique: 'BRANCH',
    difficulty: 'easy',
    timeLimitSeconds: 25,
    prompt:
      'Branch Coverage (ISO 29119-4 §5.3.2) requires every branch outcome (TRUE and FALSE) to be exercised at least once.\n\nFor the loop below, what does Branch Coverage require that pure Statement Coverage does NOT?',
    codeSnippet:
      'while (queue.length > 0) {\n  process(queue.shift());\n}',
    options: [
      { id: 'a', text: 'A test where the queue starts EMPTY (loop body never entered)' },
      { id: 'b', text: 'A test where queue.length is exactly 1' },
      { id: 'c', text: 'A test where queue contains null elements' },
      { id: 'd', text: 'A test where queue.length is very large (>100)' },
    ],
    correctOptionId: 'a',
    explanation:
      'Statement Coverage only requires the loop body to execute — a non-empty queue satisfies it. Branch Coverage additionally requires the FALSE branch (loop never entered), i.e. an initially empty queue. This catches bugs that only trigger when the loop is skipped entirely.',
  },

  {
    id: 'q-bcc-01',
    round: 3,
    technique: 'BCC',
    difficulty: 'medium',
    timeLimitSeconds: 30,
    prompt:
      'Given these 3 test cases for  `if (A && B)`:\n  • T1: A=T, B=T  → result = T\n  • T2: A=T, B=F  → result = F\n  • T3: A=F, B=T  → result = F\n\nDo T1–T3 satisfy Branch Condition Coverage (BCC)?',
    options: [
      { id: 'a', text: 'YES — A covers {T,F}, B covers {T,F}, decision covers {T,F}' },
      { id: 'b', text: 'NO — we also need A=F,B=F (all four combinations)' },
      { id: 'c', text: 'NO — the decision only reaches F twice, so it is unbalanced' },
      { id: 'd', text: 'YES — any 2 tests always suffice for BCC' },
    ],
    correctOptionId: 'a',
    explanation:
      'BCC = Branch Coverage + Condition Coverage. Check: A takes T (T1,T2) and F (T3) ✓. B takes T (T1,T3) and F (T2) ✓. The decision takes T (T1) and F (T2,T3) ✓. All BCC criteria are met with just 3 tests. Full combination coverage (A=F,B=F) is required by MCC/BCC-exhaustive, not standard BCC.',
  },

  {
    id: 'q-mcdc-01',
    round: 4,
    technique: 'MCDC',
    difficulty: 'hard',
    timeLimitSeconds: 35,
    prompt:
      'For MC/DC (ISO 29119-4 §5.3.6), a valid independence pair for condition B must demonstrate exactly what?',
    codeSnippet:
      'if (A && B && C)  // Find the MC/DC pair for B',
    options: [
      { id: 'a', text: 'B changes T→F while A and C also change, and the decision changes' },
      { id: 'b', text: 'B changes T→F while A and C stay the SAME, and the decision changes' },
      { id: 'c', text: 'B changes T→F while the decision stays the SAME' },
      { id: 'd', text: 'All three conditions change simultaneously to cover B' },
    ],
    correctOptionId: 'b',
    explanation:
      'The MC/DC independence requirement: to prove B independently affects the decision, find two test rows where (1) ONLY B changes — all other conditions remain fixed, and (2) the decision outcome flips. If any other condition also changes, you cannot attribute the decision change to B alone.',
  },

  {
    id: 'q-dataflow-01',
    round: 5,
    technique: 'DATA_FLOW',
    difficulty: 'medium',
    timeLimitSeconds: 30,
    prompt:
      'In Data Flow Testing, a "definition-killed" variable is one that is redefined before its previous definition is used. Which code snippet contains a definition-kill for variable `x`?',
    options: [
      { id: 'a', text: 'x = 5;\nprint(x);' },
      { id: 'b', text: 'x = 5;\nx = 10;\nprint(x);' },
      { id: 'c', text: 'if (x > 0) { y = x; }' },
      { id: 'd', text: 'return x + y;' },
    ],
    correctOptionId: 'b',
    explanation:
      'In option B, x is first defined as 5 and then immediately redefined as 10 before the original value is ever used — that first definition is "killed". The du-path (definition→use) for x=5 never completes. Data Flow Testing specifically looks for these orphaned definitions to uncover potential logic errors.',
  },
]

// ─── Grand Jury boss question ─────────────────────────────────────────────────

export const GRAND_JURY_QUESTION: SpeedTrialQuestion = {
  id: 'gj-mcdc-boss-01',
  round: 6,
  technique: 'MCDC',
  difficulty: 'hard',
  timeLimitSeconds: 45,
  prompt:
    'GRAND JURY — Flight Clearance System\n\nFor MC/DC coverage of condition `runway_clear (R)` in the expression below, which pair of rows from the truth table proves R independently affects the decision?',
  codeSnippet:
    '// Decision: R && (W || F)\n// R = runway_clear, W = weather_ok, F = fuel_ok\n\nRow | R | W | F | Decision\n  1 | T | T | T |    T\n  2 | T | T | F |    T\n  3 | T | F | T |    T\n  4 | T | F | F |    F\n  5 | F | T | T |    F\n  6 | F | T | F |    F\n  7 | F | F | T |    F\n  8 | F | F | F |    F',
  options: [
    { id: 'a', text: 'Rows 1 and 5  (R: T→F, W=T, F=T, Decision: T→F)' },
    { id: 'b', text: 'Rows 4 and 8  (R: T→F, W=F, F=F, Decision: F→F)' },
    { id: 'c', text: 'Rows 1 and 4  (R same=T, W changes, F changes)' },
    { id: 'd', text: 'All of A, B, and C are valid independence pairs for R' },
  ],
  correctOptionId: 'a',
  explanation:
    'For R\'s independence pair: R must be the ONLY changing input while W and F stay fixed, AND the decision must flip. Rows 1→5: R changes T→F, W=T (same), F=T (same), Decision changes T→F ✓. Row pairs 2→6 and 3→7 are also valid. Row 4→8 is INVALID because the decision stays F→F (no flip). Option D is therefore wrong.',
}
