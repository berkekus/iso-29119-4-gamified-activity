import type { MockTrialCase } from './types.js'

export const MOCK_TRIAL_CASES: MockTrialCase[] = [
  // ─── Case 1: Statement Coverage ──────────────────────────────────────────
  {
    id: 'mt-stmt-classify-01',
    technique: 'STATEMENT',
    difficulty: 'easy',
    title: 'The People vs. Three Returns',
    codeSnippet:
      'function classify(score: number) {\n  if (score >= 90) return "A";\n  if (score >= 70) return "B";\n  return "C";\n}',
    testSet: [
      { label: 'T1', inputs: { score: '85' }, expected: '"B"' },
      { label: 'T2', inputs: { score: '95' }, expected: '"A"' },
    ],
    claim: {
      coverage: 'STATEMENT',
      text: 'These 2 tests achieve 100% Statement Coverage.',
    },
    lawCardRef: 'law-statement',
    prosecutorArguments: [
      { id: 'p1', text: 'The `return "C"` statement on line 4 is never executed — one statement is uncovered.', isStrong: true },
      { id: 'p2', text: 'Two tests cannot cover three branches; we need at least three.', isStrong: true },
      { id: 'p3', text: 'Boundary values 70 and 90 are not tested.', isStrong: false },
    ],
    defenseArguments: [
      { id: 'd1', text: 'Both tests reach a return statement — every line in the active path executes.', isStrong: false },
      { id: 'd2', text: 'Statement Coverage only counts unique line executions; T1 and T2 cover lines 2 and 3.', isStrong: false },
      { id: 'd3', text: 'The default branch is implicit and does not count toward coverage.', isStrong: false },
    ],
    correctVerdict: 'not_satisfied',
    answerExplanation:
      'Statement Coverage requires **every executable statement** to run at least once. The three `return` statements are each executable statements. T1 hits `return "B"`, T2 hits `return "A"`, but `return "C"` is never reached. We need a third test with `score < 70` to satisfy 100% Statement Coverage.',
    pitfallTag: 'Missed default-path statement',
  },

  // ─── Case 2: Branch Coverage ─────────────────────────────────────────────
  {
    id: 'mt-branch-empty-queue-01',
    technique: 'BRANCH',
    difficulty: 'easy',
    title: 'The People vs. The Skipped Loop',
    codeSnippet:
      'while (queue.length > 0) {\n  process(queue.shift());\n}',
    testSet: [
      { label: 'T1', inputs: { 'queue.length': '5' }, expected: 'all 5 processed' },
      { label: 'T2', inputs: { 'queue.length': '1' }, expected: '1 processed' },
    ],
    claim: {
      coverage: 'BRANCH',
      text: 'These 2 tests achieve 100% Branch Coverage of the while loop.',
    },
    lawCardRef: 'law-branch',
    prosecutorArguments: [
      { id: 'p1', text: 'The FALSE branch of the loop condition (queue empty at entry) is never exercised.', isStrong: true },
      { id: 'p2', text: 'No test starts with an empty queue, so the loop-skip path is uncovered.', isStrong: true },
      { id: 'p3', text: 'The `process` function is called with different values but never inspected.', isStrong: false },
    ],
    defenseArguments: [
      { id: 'd1', text: 'Both true and false outcomes of the condition happen at runtime — the loop terminates.', isStrong: false },
      { id: 'd2', text: 'Branch coverage only requires loop body execution; both tests achieve this.', isStrong: false },
      { id: 'd3', text: 'A queue length of 1 covers the boundary case sufficiently.', isStrong: false },
    ],
    correctVerdict: 'not_satisfied',
    answerExplanation:
      'Branch Coverage (ISO 29119-4 §5.2.2) requires **every branch outcome — TRUE and FALSE — to be exercised at the entry** of a decision. A non-empty queue always enters the loop (TRUE), then exits when empty. But to take the FALSE branch *as a branch decision*, the loop must be entered with an empty queue and skipped entirely. T1 and T2 only show TRUE-at-entry. A T3 with `queue.length = 0` is required.',
    pitfallTag: 'Loop FALSE branch at entry missed',
  },

  // ─── Case 3: Branch Condition Coverage (BCC) ─────────────────────────────
  {
    id: 'mt-bcc-and-three-01',
    technique: 'BCC',
    difficulty: 'medium',
    title: 'The People vs. Conjunction',
    codeSnippet: 'if (A && B) { /* ... */ }',
    testSet: [
      { label: 'T1', inputs: { A: 'T', B: 'T' }, expected: 'decision = T' },
      { label: 'T2', inputs: { A: 'T', B: 'F' }, expected: 'decision = F' },
      { label: 'T3', inputs: { A: 'F', B: 'T' }, expected: 'decision = F' },
    ],
    claim: {
      coverage: 'BCC',
      text: 'These 3 tests satisfy Branch Condition Coverage for `A && B`.',
    },
    lawCardRef: 'law-bcc',
    prosecutorArguments: [
      { id: 'p1', text: 'A=F,B=F is missing — without it, we lack full combinatorial coverage.', isStrong: false },
      { id: 'p2', text: 'The decision outcome F appears twice but T only once — coverage is unbalanced.', isStrong: false },
      { id: 'p3', text: 'BCC requires all 2^N combinations; only 3 of 4 are present.', isStrong: false },
    ],
    defenseArguments: [
      { id: 'd1', text: 'A takes both T (T1,T2) and F (T3); B takes both T (T1,T3) and F (T2); decision takes T (T1) and F (T2,T3) — all BCC criteria met.', isStrong: true },
      { id: 'd2', text: 'BCC = Branch Coverage + Condition Coverage; both decision outcomes and both values of each operand are present.', isStrong: true },
      { id: 'd3', text: 'Only MCC (Multiple Condition Coverage) requires all 2^N combinations; BCC does not.', isStrong: false },
    ],
    correctVerdict: 'satisfied',
    answerExplanation:
      'BCC requires (1) every **decision** outcome (T and F) to occur, and (2) every **condition** to independently take both T and F. Audit: A takes T in T1,T2 and F in T3 ✓; B takes T in T1,T3 and F in T2 ✓; decision is T in T1 and F in T2,T3 ✓. All three BCC clauses are satisfied. Full combinatorial coverage (A=F,B=F included) is required by MCC/BCC-exhaustive, not by standard BCC.',
    pitfallTag: 'Confusing BCC with MCC',
  },

  // ─── Case 4: MCDC Independence ───────────────────────────────────────────
  {
    id: 'mt-mcdc-and-three-01',
    technique: 'MCDC',
    difficulty: 'hard',
    title: 'The People vs. The Isolated Variable',
    codeSnippet: 'if (A && B && C) { /* ... */ }',
    testSet: [
      { label: 'T1', inputs: { A: 'T', B: 'T', C: 'T' }, expected: 'decision = T' },
      { label: 'T2', inputs: { A: 'F', B: 'T', C: 'T' }, expected: 'decision = F' },
      { label: 'T3', inputs: { A: 'T', B: 'F', C: 'T' }, expected: 'decision = F' },
      { label: 'T4', inputs: { A: 'T', B: 'T', C: 'F' }, expected: 'decision = F' },
    ],
    claim: {
      coverage: 'MCDC',
      text: 'These 4 tests demonstrate MC/DC independence for each condition A, B, C.',
    },
    lawCardRef: 'law-mcdc',
    prosecutorArguments: [
      { id: 'p1', text: 'The independence pairs (T1,T2), (T1,T3), (T1,T4) only show each variable changing — they do not prove independent effect against a fixed baseline.', isStrong: false },
      { id: 'p2', text: 'For B independence: only T1 vs T3 — but T2 also exists where B=T,A=F — there is no contradiction.', isStrong: false },
      { id: 'p3', text: 'Tests cover only the "one condition flips" pattern; we need additional rows to show stability.', isStrong: false },
    ],
    defenseArguments: [
      { id: 'd1', text: 'For A: T1(T,T,T)→T vs T2(F,T,T)→F — only A changes, decision flips ✓. For B: T1 vs T3 (only B changes, flips) ✓. For C: T1 vs T4 (only C changes, flips) ✓.', isStrong: true },
      { id: 'd2', text: 'MC/DC requires N+1 tests for N conditions; we have 4 tests for 3 conditions, exactly matching the criterion.', isStrong: true },
      { id: 'd3', text: 'All decision outcomes T and F are reached, and each variable appears in both T and F states.', isStrong: false },
    ],
    correctVerdict: 'satisfied',
    answerExplanation:
      'MC/DC (ISO 29119-4 §5.3.6) requires that each condition be shown to **independently affect the decision**. The proof for each is a pair of test rows where (1) only that condition changes, all others stay fixed, and (2) the decision outcome flips. For A: T1(T,T,T) and T2(F,T,T) — only A changes T→F, decision flips T→F ✓. For B: T1 and T3 — only B changes, decision flips ✓. For C: T1 and T4 — only C changes, decision flips ✓. All three independence requirements are met with exactly N+1=4 tests.',
    pitfallTag: 'MCDC independence pair structure',
  },

  // ─── Case 5: Data Flow ───────────────────────────────────────────────────
  {
    id: 'mt-dataflow-killed-def-01',
    technique: 'DATA_FLOW',
    difficulty: 'medium',
    title: 'The People vs. The Orphan Definition',
    codeSnippet:
      'function fee(amount: number) {\n  let total = amount * 0.05;  // def 1\n  total = amount * 0.08;       // def 2\n  return total;\n}',
    testSet: [
      { label: 'T1', inputs: { amount: '100' }, expected: 'returns 8' },
      { label: 'T2', inputs: { amount: '200' }, expected: 'returns 16' },
    ],
    claim: {
      coverage: 'DATA_FLOW',
      text: 'These 2 tests achieve full All-Definitions (all-defs) coverage for variable `total`.',
    },
    lawCardRef: 'law-dataflow',
    prosecutorArguments: [
      { id: 'p1', text: 'Definition 1 (`total = amount * 0.05`) is immediately killed by definition 2 — no def-use path from def 1 to a use is ever reachable, so def 1 cannot be covered by any test.', isStrong: true },
      { id: 'p2', text: 'All-defs coverage requires at least one du-path per definition to reach a use. Def 1 has zero reachable uses.', isStrong: true },
      { id: 'p3', text: 'The tests do not vary the input enough to expose data flow issues.', isStrong: false },
    ],
    defenseArguments: [
      { id: 'd1', text: 'Both tests reach the return statement, exercising the live value of total.', isStrong: false },
      { id: 'd2', text: 'All-defs coverage is satisfied because def 2 reaches the use in `return total`.', isStrong: false },
      { id: 'd3', text: 'Killed definitions are still considered "covered" if the variable is later used.', isStrong: false },
    ],
    correctVerdict: 'not_satisfied',
    answerExplanation:
      'All-Definitions coverage requires that **every definition reaches at least one use via a definition-clear path**. Definition 1 (`total = amount * 0.05`) is killed by definition 2 on the very next line, before any use of `total`. There is no path from def 1 to a use without an intervening redefinition — so def 1 is **unreachable** for coverage purposes. This is a classic dead-store / killed-definition pattern. The claim is false because def 1 cannot be covered by any test (it is a code-smell that should be removed).',
    pitfallTag: 'Killed definition coverage',
  },
]
