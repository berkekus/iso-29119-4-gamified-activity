import { describe, test, expect } from 'vitest'
import { loadCase, type CaseFile } from '../src/engine/caseLoader'

// All 13 campaign cases under audit (matches CASE_ORDER)
import stmtTutorial from '../src/content/cases/stmt-tutorial-01.json'
import stmtHidden from '../src/content/cases/stmt-hidden-branch-01.json'
import branchLoop from '../src/content/cases/branch-loop-trap-01.json'
import decisionAndTrap from '../src/content/cases/decision-and-trap-01.json'
import bcOrThree from '../src/content/cases/bc-or-three-cond-01.json'
import bcNegMask from '../src/content/cases/bc-negation-mask-01.json'
import bccIntro from '../src/content/cases/bcc-intro-01.json'
import bccVsBc from '../src/content/cases/bcc-vs-bc-01.json'
import bccExplosion from '../src/content/cases/bcc-explosion-01.json'
import mcdcTutorial from '../src/content/cases/mcdc-tutorial-01.json'
import mcdcTrapIso from '../src/content/cases/mcdc-trap-isolation-01.json'
import mcdcVault from '../src/content/cases/mcdc-vault-boss-01.json'
import mcdcShowdown from '../src/content/cases/mcdc-showdown-01.json'

const ALL_CASES: { name: string; raw: unknown }[] = [
  { name: 'stmt-tutorial-01', raw: stmtTutorial },
  { name: 'stmt-hidden-branch-01', raw: stmtHidden },
  { name: 'branch-loop-trap-01', raw: branchLoop },
  { name: 'decision-and-trap-01', raw: decisionAndTrap },
  { name: 'bc-or-three-cond-01', raw: bcOrThree },
  { name: 'bc-negation-mask-01', raw: bcNegMask },
  { name: 'bcc-intro-01', raw: bccIntro },
  { name: 'bcc-vs-bc-01', raw: bccVsBc },
  { name: 'bcc-explosion-01', raw: bccExplosion },
  { name: 'mcdc-tutorial-01', raw: mcdcTutorial },
  { name: 'mcdc-trap-isolation-01', raw: mcdcTrapIso },
  { name: 'mcdc-vault-boss-01', raw: mcdcVault },
  { name: 'mcdc-showdown-01', raw: mcdcShowdown },
]

// Phrases that must not appear in CHARGES — they are player-facing
// instructions, hint chatter, or ISO clause name-drops that belong elsewhere.
const BANNED_CHARGE_PHRASES = [
  're-read',
  'law card',
  '§5.3',
  'annex',
  'which condition',
  'build the tally',
  'click ',
]

// Banned phrases for HINTS: ISO/Law-Card cross-references that scaffold but
// don't teach. Hints should still teach the concept directly.
const BANNED_HINT_PHRASES = [
  're-read',
  'law card',
  'annex',
]

// Coerce an unknown row-input into a boolean for decision-expression
// evaluation. Throws if the value is not boolean — so the helper only runs
// on rows from cases that actually use boolean inputs.
function asBoolMap(inputs: Record<string, unknown>): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(inputs)) {
    if (typeof v !== 'boolean') {
      throw new Error(`asBoolMap: key ${k} has non-boolean value ${JSON.stringify(v)}`)
    }
    out[k] = v
  }
  return out
}

function allInputsBoolean(inputs: Record<string, unknown>): boolean {
  return Object.values(inputs).every((v) => typeof v === 'boolean')
}

// Tiny boolean evaluator for the decision_expression strings used in the
// content. Supports !, &&, ||, parens. Literal identifiers are looked up in
// the row inputs map (case-sensitive).
function evalExpr(expr: string, inputs: Record<string, boolean>): boolean {
  const tokens: string[] = []
  let i = 0
  while (i < expr.length) {
    const ch: string = expr[i] as string
    if (ch === ' ' || ch === '\t') { i++; continue }
    if (ch === '(' || ch === ')') { tokens.push(ch); i++; continue }
    if (ch === '!') { tokens.push('!'); i++; continue }
    if (ch === '&' && expr[i + 1] === '&') { tokens.push('&&'); i += 2; continue }
    if (ch === '|' && expr[i + 1] === '|') { tokens.push('||'); i += 2; continue }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i
      while (j < expr.length && /[A-Za-z0-9_]/.test(expr[j] as string)) j++
      tokens.push(expr.slice(i, j))
      i = j
      continue
    }
    throw new Error(`Unexpected character in expression "${expr}" at ${i}: ${ch}`)
  }

  let p = 0
  function parseOr(): boolean {
    let left = parseAnd()
    while (tokens[p] === '||') { p++; const right = parseAnd(); left = left || right }
    return left
  }
  function parseAnd(): boolean {
    let left = parseUnary()
    while (tokens[p] === '&&') { p++; const right = parseUnary(); left = left && right }
    return left
  }
  function parseUnary(): boolean {
    if (tokens[p] === '!') { p++; return !parseUnary() }
    return parsePrimary()
  }
  function parsePrimary(): boolean {
    if (tokens[p] === '(') {
      p++
      const v = parseOr()
      if (tokens[p] !== ')') throw new Error(`Missing ) in "${expr}"`)
      p++
      return v
    }
    const tok = tokens[p++]
    if (tok === undefined) throw new Error(`Unexpected end of expression "${expr}"`)
    if (tok in inputs) return inputs[tok] as boolean
    throw new Error(`Unknown identifier "${tok}" in expression "${expr}". Available: ${Object.keys(inputs).join(',')}`)
  }
  const result = parseOr()
  if (p !== tokens.length) throw new Error(`Extra tokens in "${expr}"`)
  return result
}

// Independence-pair check for MCDC.
function hasIndependencePair(
  rows: { inputs: Record<string, boolean>; outcome: boolean }[],
  conditionId: string,
  allCondIds: string[],
): boolean {
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const r1 = rows[i]
      const r2 = rows[j]
      if (r1 === undefined || r2 === undefined) continue
      if (r1.inputs[conditionId] === r2.inputs[conditionId]) continue
      const others = allCondIds.filter((c) => c !== conditionId)
      const fixed = others.every((c) => r1.inputs[c] === r2.inputs[c])
      if (!fixed) continue
      if (r1.outcome !== r2.outcome) return true
    }
  }
  return false
}

// Extract the parameter names from a Python def signature in the source code.
// Returns null if no def-line is present (e.g., inline `if (...)` snippets);
// callers should treat that as "no signature available, use scenario.conditions
// for the alignment check instead".
function extractFunctionParams(code: string): string[] | null {
  const match = code.match(/def\s+\w+\s*\(([^)]*)\)/)
  if (!match) return null
  const params = (match[1] ?? '').split(',').map((p) => p.trim()).filter((p) => p.length > 0)
  return params
}

describe('content audit — all 13 cases', () => {
  for (const { name, raw } of ALL_CASES) {
    describe(name, () => {
      let cf: CaseFile
      test('parses against schema', () => {
        cf = loadCase(raw)
        expect(cf.id).toBe(name)
      })

      test('charges field is present, populated, and free of banned phrases', () => {
        cf = loadCase(raw)
        expect(Array.isArray(cf.charges)).toBe(true)
        expect((cf.charges ?? []).length).toBeGreaterThan(0)
        expect((cf.charges ?? []).length).toBeLessThanOrEqual(3)
        for (const ch of cf.charges ?? []) {
          const lower = ch.toLowerCase()
          for (const banned of BANNED_CHARGE_PHRASES) {
            expect(
              lower.includes(banned),
              `Case ${name}: charges contain banned substring "${banned}":\n  ${ch}`,
            ).toBe(false)
          }
        }
      })

      test('hints are free of ISO/Law-Card cross-references', () => {
        cf = loadCase(raw)
        const hints = cf.hints ?? []
        for (const h of hints) {
          const lower = h.toLowerCase()
          for (const banned of BANNED_HINT_PHRASES) {
            expect(
              lower.includes(banned),
              `Case ${name}: hint contains banned substring "${banned}":\n  ${h}`,
            ).toBe(false)
          }
        }
      })

      test('test_set input keys align with code parameters or scenario conditions', () => {
        cf = loadCase(raw)
        const rows = cf.test_set ?? []
        if (rows.length === 0) return // not applicable

        const params = extractFunctionParams(cf.scenario.code)
        const condIds = cf.scenario.conditions.map((c) => c.id)
        const allowed = new Set<string>([...(params ?? []), ...condIds])

        for (const row of rows) {
          for (const key of Object.keys(row.inputs)) {
            expect(
              allowed.has(key),
              `Case ${name}: row ${row.id} input key "${key}" does not match any code parameter (${(params ?? []).join(',')}) or condition id (${condIds.join(',')})`,
            ).toBe(true)
          }
        }
      })

      test('coverage_table input keys align with code parameters or scenario conditions', () => {
        cf = loadCase(raw)
        const rows = cf.coverage_table ?? []
        if (rows.length === 0) return

        const params = extractFunctionParams(cf.scenario.code)
        const condIds = cf.scenario.conditions.map((c) => c.id)
        const allowed = new Set<string>([...(params ?? []), ...condIds])

        for (const row of rows) {
          for (const key of Object.keys(row.inputs)) {
            expect(
              allowed.has(key),
              `Case ${name}: coverage row ${row.id} input key "${key}" does not match any code parameter (${(params ?? []).join(',')}) or condition id (${condIds.join(',')})`,
            ).toBe(true)
          }
        }
      })

      test('test_set outcomes match the decision expression (boolean cases only)', () => {
        cf = loadCase(raw)
        const expr = cf.scenario.decision_expression
        const rows = cf.test_set ?? []
        if (!expr || rows.length === 0) return // not applicable
        for (const row of rows) {
          if (!allInputsBoolean(row.inputs as Record<string, unknown>)) continue
          if (typeof row.outcome !== 'boolean') continue
          const computed = evalExpr(expr, asBoolMap(row.inputs as Record<string, unknown>))
          expect(
            computed,
            `Case ${name}: row ${row.id} expression "${expr}" with inputs ${JSON.stringify(row.inputs)} computed=${computed} but JSON outcome=${row.outcome}`,
          ).toBe(row.outcome)
        }
      })

      test('coverage_table outcomes match the decision expression (boolean cases only)', () => {
        cf = loadCase(raw)
        const expr = cf.scenario.decision_expression
        const rows = cf.coverage_table ?? []
        if (!expr || rows.length === 0) return
        for (const row of rows) {
          if (!allInputsBoolean(row.inputs as Record<string, unknown>)) continue
          if (typeof row.outcome !== 'boolean') continue
          const computed = evalExpr(expr, asBoolMap(row.inputs as Record<string, unknown>))
          expect(
            computed,
            `Case ${name}: coverage row ${row.id} expression "${expr}" with inputs ${JSON.stringify(row.inputs)} computed=${computed} but JSON outcome=${row.outcome}`,
          ).toBe(row.outcome)
        }
      })

      test('options labelled is_correct: true exist (where options used)', () => {
        cf = loadCase(raw)
        const opts = cf.options ?? []
        if (opts.length === 0) return
        const correct = opts.filter((o) => o.is_correct)
        expect(correct.length, `Case ${name}: must have at least one correct option`).toBeGreaterThan(0)
      })

      test('condition labels do not duplicate the condition id', () => {
        cf = loadCase(raw)
        for (const c of cf.scenario.conditions) {
          const id = c.id
          const label = c.label
          const idLower = id.toLowerCase()
          const labelLower = label.toLowerCase()
          expect(
            labelLower === idLower,
            `Case ${name}: condition "${id}" label is identical to its id ("${label}")`,
          ).toBe(false)
          if (labelLower.startsWith(idLower)) {
            const next = labelLower.charAt(idLower.length)
            const isBoundary = next === '' || /[\s:.,;_-]/.test(next)
            expect(
              isBoundary,
              `Case ${name}: condition "${id}" label starts with the id followed by a boundary ("${label}")`,
            ).toBe(false)
          }
        }
      })
    })
  }
})

// Helper for technique tests below.
function booleanRows(cf: CaseFile, source: 'test_set' | 'coverage_table'): { id: string; inputs: Record<string, boolean>; outcome: boolean }[] {
  const raw = (source === 'test_set' ? cf.test_set : cf.coverage_table) ?? []
  return raw
    .filter((r) => allInputsBoolean(r.inputs as Record<string, unknown>) && typeof r.outcome === 'boolean')
    .map((r) => ({
      id: r.id,
      inputs: asBoolMap(r.inputs as Record<string, unknown>),
      outcome: r.outcome as boolean,
    }))
}

// Technique-specific correctness checks: re-derive the right answer from
// first principles and assert the JSON's correctness key matches.
describe('technique correctness — recomputed from first principles', () => {
  test('decision-and-trap-01: only Set B satisfies both Decision and BC for is_logged_in && has_permission', () => {
    const cf = loadCase(decisionAndTrap)
    const expr = cf.scenario.decision_expression
    const sets: Record<string, [boolean, boolean][]> = {
      'opt-only-false':  [[true, false], [false, true]],
      'opt-bc-correct':  [[true, true], [true, false], [false, true]],
      'opt-only-true':   [[true, true]],
      'opt-only-a-flips':[[true, true], [false, true]],
    }
    for (const opt of cf.options ?? []) {
      const tests = sets[opt.id] ?? []
      const outcomes = tests.map(([a, b]) => evalExpr(expr, { is_logged_in: a as boolean, has_permission: b as boolean }))
      const decisionOk = outcomes.includes(true) && outcomes.includes(false)
      const aValues = tests.map((t) => t[0])
      const bValues = tests.map((t) => t[1])
      const bcOk = aValues.includes(true) && aValues.includes(false)
                && bValues.includes(true) && bValues.includes(false)
      const bothOk = decisionOk && bcOk
      expect(
        bothOk,
        `decision-and-trap-01: option ${opt.id} bothOk=${bothOk} but is_correct=${opt.is_correct}`,
      ).toBe(opt.is_correct)
    }
  })

  test('bc-or-three-cond-01: T1..T4 are exactly the rows required for BC of a||b||c', () => {
    const cf = loadCase(bcOrThree)
    const required = (cf.coverage_table ?? []).filter((r) => r.required)
    const ids = required.map((r) => r.id).sort()
    expect(ids).toEqual(['T1', 'T2', 'T3', 'T4'])
    const condIds = cf.scenario.conditions.map((c) => c.id)
    const requiredBool = booleanRows(cf, 'coverage_table').filter((r) => ids.includes(r.id))
    for (const c of condIds) {
      const vals = requiredBool.map((r) => r.inputs[c])
      expect(vals.includes(true), `BC: ${c} must be TRUE in some required row`).toBe(true)
      expect(vals.includes(false), `BC: ${c} must be FALSE in some required row`).toBe(true)
    }
  })

  test('bc-negation-mask-01: BC is satisfied but MCDC for has_override is NOT (short-circuit mask)', () => {
    const cf = loadCase(bcNegMask)
    const condIds = cf.scenario.conditions.map((c) => c.id)
    const rows = booleanRows(cf, 'test_set')
    for (const c of condIds) {
      const vals = rows.map((r) => r.inputs[c])
      expect(vals.includes(true)).toBe(true)
      expect(vals.includes(false)).toBe(true)
    }
    expect(hasIndependencePair(rows, 'is_admin', condIds)).toBe(true)
    expect(hasIndependencePair(rows, 'has_override', condIds)).toBe(false)
  })

  test('bcc-explosion-01: 16-row truth table for 4 AND-conditions', () => {
    const cf = loadCase(bccExplosion)
    const N = cf.scenario.conditions.length
    expect(N).toBe(4)
    const rows = cf.coverage_table ?? []
    expect(rows.length).toBe(2 ** N) // 16
    expect(cf.required_pick_count).toBe(3)
    // The decision is a 4-input AND, so exactly one row should evaluate TRUE.
    const trueRows = rows.filter((r) => r.outcome === true)
    expect(trueRows.length).toBe(1)
  })

  test('bcc-vs-bc-01: required connection reconstructs the missing F-F combination', () => {
    const cf = loadCase(bccVsBc)
    const conn = cf.required_connection
    expect(conn).toBeDefined()
    if (!conn) return
    // Both ids must point to FALSE-valued evidence cards.
    const clues = cf.evidence_board_clues ?? []
    const labels = conn.map((id) => clues.find((c) => c.id === id)?.label ?? '')
    for (const l of labels) {
      expect(l.toLowerCase()).toContain('false')
    }
  })

  test('mcdc-vault-boss-01: required 4-row selection satisfies MCDC for all three conditions', () => {
    const cf = loadCase(mcdcVault)
    const condIds = cf.scenario.conditions.map((c) => c.id)
    const required = (cf.coverage_table ?? []).filter((r) => r.required)
    expect(required.length).toBe(4)
    expect(cf.required_pick_count).toBe(4)
    const requiredBool = booleanRows(cf, 'coverage_table').filter((r) => required.some((rr) => rr.id === r.id))
    for (const c of condIds) {
      expect(
        hasIndependencePair(requiredBool, c, condIds),
        `mcdc-vault-boss-01: required selection missing MCDC pair for ${c}`,
      ).toBe(true)
    }
  })

  test('mcdc-showdown-01: required 5-row selection satisfies MCDC for all four conditions', () => {
    const cf = loadCase(mcdcShowdown)
    const condIds = cf.scenario.conditions.map((c) => c.id)
    const required = (cf.coverage_table ?? []).filter((r) => r.required)
    expect(required.length).toBe(5)
    expect(cf.required_pick_count).toBe(5)
    const requiredBool = booleanRows(cf, 'coverage_table').filter((r) => required.some((rr) => rr.id === r.id))
    for (const c of condIds) {
      expect(
        hasIndependencePair(requiredBool, c, condIds),
        `mcdc-showdown-01: required selection missing MCDC pair for ${c}`,
      ).toBe(true)
    }
  })

  test('bcc-intro-01: dialogue fragments construct an objection naming the missing mixed combination', () => {
    const cf = loadCase(bccIntro)
    const required = cf.required_fragments ?? []
    expect(required.length).toBeGreaterThan(0)
    const sentence = required.join(' ').toLowerCase()
    // Should reference "NOT VIP" and "LARGE" (the missing F-T combination)
    expect(sentence).toContain('not vip')
    expect(sentence).toContain('large')
  })

  test('mcdc-tutorial-01: dialogue fragments name the both-flipped flaw', () => {
    const cf = loadCase(mcdcTutorial)
    const required = cf.required_fragments ?? []
    const sentence = required.join(' ').toLowerCase()
    expect(sentence).toContain('badge')
    expect(sentence).toContain('fingerprint')
  })

  test('mcdc-trap-isolation-01: required pair flips Override only, with Auto held OFF', () => {
    const cf = loadCase(mcdcTrapIso)
    const required = cf.required_connection
    expect(required).toBeDefined()
    if (!required) return
    const clues = cf.evidence_board_clues ?? []
    const labels = required.map((id) => clues.find((c) => c.id === id)?.label ?? '')
    // Both labels must hold Auto=OFF (the masking guard) AND must differ in Override.
    for (const l of labels) {
      expect(l.includes('Auto=OFF')).toBe(true)
    }
    const overrideValues = labels.map((l) => l.includes('Override=ON'))
    expect(new Set(overrideValues).size).toBe(2) // one ON, one OFF
  })
})
