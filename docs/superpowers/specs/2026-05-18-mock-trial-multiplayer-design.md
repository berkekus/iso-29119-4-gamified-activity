# Mock Trial — Role-Based Multiplayer Mode

**Date:** 2026-05-18
**Status:** Approved design (brainstorming complete)
**Scope:** New multiplayer mode for Test Courthouse, modeled on the PDF proposal "Test Courthouse" (group-based courtroom format aligned with ISO/IEC/IEEE 29119-4 §5.2–§5.3).

---

## 1. Problem Statement

The current multiplayer mode (`Speed Trial`) is a Kahoot-style individual quiz: each player answers multiple-choice questions on their own device, scored by speed and correctness. This does not match the PDF's proposed format, which calls for **groups of 4–5 students** acting as small courts, with **role-specific responsibilities** (Prosecutor / Defense / Jury / Scribe), structured argumentation grounded in Law Cards, and **group-level scoring**.

The goal is to add a new multiplayer mode — **Mock Trial** — that implements the PDF's pedagogical model while keeping the existing Speed Trial mode untouched and operational.

## 2. Goals & Non-Goals

### Goals
- Players form **virtual courts** (groups) of up to 5; each member has a distinct functional role.
- Roles are mechanically differentiated by UI: Prosecutor argues against the coverage claim, Defense argues for it, Jury votes, Scribe submits the final verdict.
- Discussion is **structured**: each side picks a Law-Card-based argument from a curated list **plus** writes a one-sentence justification.
- Scoring is **group-level**: combines automatic verdict correctness, argument-card alignment, and Jury self-assessment of the written justification.
- All players use their own device; everything happens through the app (no face-to-face channel assumed).
- The session fits the PDF's 45–50 minute classroom window (≈5 cases × ~3.5 min each + setup + reveals).

### Non-Goals (YAGNI)
- ❌ Automatic role rotation between rounds (roles are manually chosen).
- ❌ Replacing Speed Trial — Mock Trial is an additive new mode; Speed Trial keeps its current behavior.
- ❌ Voice/video chat or free-form text chat.
- ❌ Persistence beyond a single session (no DB; in-memory state, room destroyed 5 min after last case).
- ❌ Adaptive difficulty, replay, or AI evaluation of free-text justifications.
- ❌ Authentication / user accounts.

## 3. User Flow (High Level)

```
1. LOBBY
   Host opens a room → configures case count + per-phase durations
   Players join with room code → pick a Court slot + a role
   Host clicks "Start" once each active court has at least
   Prosecutor + Defense + Scribe filled

2. CASE LOOP (repeat N times, N from host config)
   a) BRIEFING        (~30 s)  — all players see code + test set + claim
   b) ARGUMENT PHASE  (default 90 s) — role-specific UI, parallel
   c) DELIBERATION    (default 45 s) — Jury votes; Scribe submits verdict + justification
   d) REVEAL          (~30 s)  — official answer + learning note; Jury self-scores
   e) GROUP LEADERBOARD between cases

3. FINAL VERDICT — overall group leaderboard, top 3 highlighted
```

Total core time for 5 cases ≈ `5 × (30 + 90 + 45 + 30) = 16 min 15 s`, plus lobby setup and inter-case leaderboard pauses. Fits within a 45–50 minute class.

## 4. Roles & Screens

All players share an **upper panel** during a case (round badge, countdown, court name, collapsible Law Card hint, code snippet, test set table, claim). The **lower panel** is role-specific:

| Role | Argument Phase | Deliberation Phase | Reveal Phase |
|---|---|---|---|
| **Prosecutor** | Heading "Claim NOT satisfied" + 3–4 Law-Card-based argument cards (radio) + 1-sentence textarea (max 140 chars) + Send | Read-only: own submission; waiting for Jury | Read-only: official answer + learning note |
| **Defense** | Heading "Claim satisfied" + 3–4 counter-argument cards + 1-sentence textarea + Send | Read-only | Read-only |
| **Jury** | Placeholder "Discussion in progress…" → both sides' arguments appear as they're submitted | Side-by-side argument view → "Support Prosecutor / Support Defense" vote button (if 2 Jurys, majority/first-to-vote rule) | Reveal + **Self-Score Widget**: "How aligned is our justification with the official note?" → Aligned (+1) / Partial (+0.5) / Not aligned (0) |
| **Scribe** | Placeholder + sees arguments as they arrive | Active form: Verdict dropdown (Satisfied / Not Satisfied) + 1–2-sentence final justification textarea (max 200 chars) + Submit (enabled once Jury vote arrives) | Read-only: verdict + group score delta |

### Role Edge Cases
- **Prosecutor or Defense missing:** Case cannot start; host sees a warning per court.
- **Jury missing (4-person court):** Scribe performs the self-score in reveal phase; no vote step (verdict goes straight to Scribe form).
- **Two Jurys (5-person court):** First Jury to vote sets the side. First Jury to self-score sets the bonus.
- **Player disconnects mid-case:** Slot marked `disconnected`; case continues with available roles. If Scribe drops, a Jury auto-promotes to Scribe; if both Jurys drop, Prosecutor is asked to vote.
- **Player reconnects:** Same `playerId` re-attaches to its slot (socketId may change).
- **Player joins lobby mid-game:** Becomes a Spectator; can claim a slot starting from the next case.

## 5. Case Data Model

New file: `app/server/src/mockTrial/cases.ts`

```ts
export interface MockTrialCase {
  id: string                      // e.g. "mt-bcc-andand-01"
  technique: Technique            // 'STATEMENT' | 'BRANCH' | 'BCC' | 'MCDC' | 'DATA_FLOW'
  difficulty: 'easy' | 'medium' | 'hard'

  // Upper panel (visible to all)
  title: string                   // "The People vs. AND-AND Operator"
  codeSnippet: string
  testSet: Array<{
    label: string                 // "T1"
    inputs: Record<string, string>  // { A: 'T', B: 'T' }
    expected: string              // "result = T"
  }>
  claim: {
    coverage: Technique
    text: string                  // "This test set satisfies BCC."
  }
  lawCardRef: string              // ID of the relevant Law Card (collapsible)

  // Argument cards (separate pools for the two sides)
  prosecutorArguments: Array<{    // 3–4 ready-made attack arguments
    id: string
    text: string
    isStrong: boolean             // aligns with the correct Law Card reading
  }>
  defenseArguments: Array<{
    id: string
    text: string
    isStrong: boolean
  }>

  // Answer (revealed after deliberation)
  correctVerdict: 'satisfied' | 'not_satisfied'
  answerExplanation: string       // markdown learning note
  pitfallTag?: string             // short label for the misconception class

  // Optional per-case timing overrides
  argumentSeconds?: number        // default 90
  deliberationSeconds?: number    // default 45
}
```

**`isStrong` semantics:** Each case has **at least 1, at most 2** `isStrong: true` arguments per side. This rewards arguments grounded in the relevant Law Card without insisting on a single canonical phrasing.

### Initial content
The 5 existing Speed Trial questions (`app/server/src/speedTrialQuestions.ts`) are refactored into Mock Trial cases (~30 min of content authoring per case). Speed Trial keeps its original 5 questions untouched.

## 6. Scoring

For each case, **per court**:

```
verdictScore        = scribe.verdict === case.correctVerdict ? +2 : 0
argumentBonusP      = prosecutor.chosenArg.isStrong ? +1 : 0
argumentBonusD      = defense.chosenArg.isStrong   ? +1 : 0
justificationScore  = jury.selfScore                       // +1 / +0.5 / 0

caseTotal           = verdictScore + argumentBonusP + argumentBonusD + justificationScore
                      (max 5 per case)
```

**Anti-gaming for self-score:** Jury can always pick +1. This is intentional — the PDF treats scoring as illustrative, not exact. As a safeguard, the **host screen** lists every court's submitted justification sentence after each case; the host can manually adjust (override down) any score before clicking "Next Case".

## 7. Host Configuration

Host-controlled defaults set in lobby:

| Setting | Options | Default |
|---|---|---|
| Case count | 3 / 5 / 7 | **5** |
| Argument phase duration | 60 / 90 / 120 s | **90** |
| Deliberation duration | 30 / 45 / 60 s | **45** |
| Briefing duration | fixed | **30 s** |
| Reveal duration | fixed | **30 s** |
| Max courts | fixed | **12** |
| Slots per court | fixed | **5** (Prosecutor, Defense, Jury 1, Jury 2, Scribe) |
| Min playable court | fixed | **3 slots filled** (P + D + S) |

## 8. Architecture

### Server (`app/server/src/`)

New directory:
```
mockTrial/
├── types.ts              # MockTrialRoom, Court, Verdict, Argument, phase enums
├── cases.ts              # MockTrialCase[] content (initial 5)
├── courtManager.ts       # createCourt, claimSlot, releaseSlot, validateStart
├── mockTrialScoring.ts   # per-case + cumulative + leaderboard builders
└── mockTrialServer.ts    # socket event registration + phase timers
```

**Integration:** `socketServer.ts` adds 2 lines:
```ts
import { registerMockTrial } from './mockTrial/mockTrialServer.js'
registerMockTrial(io)
```
Speed Trial code is **not modified**.

**Namespace:** `/mock-trial` (Socket.IO namespace). Speed Trial remains on the default namespace.

**Room state shape:**
```ts
interface MockTrialRoom {
  code: string
  hostSocketId: string
  status: 'lobby' | 'in_case' | 'reveal' | 'finished'
  config: { caseCount: number; defaultArgumentSec: number; defaultDeliberationSec: number }
  courts: Map<string, Court>
  cases: MockTrialCase[]            // selected/shuffled pool
  currentCaseIdx: number
  currentPhase: 'briefing' | 'arguing' | 'deliberating' | 'reveal' | null
  phaseEndsAt: number | null
  phaseTimer: NodeJS.Timeout | null
}

interface Court {
  id: string                        // "court-1"
  name: string                      // "Court 1"
  slots: {
    prosecutor: PlayerInfo | null
    defense: PlayerInfo | null
    jury1: PlayerInfo | null
    jury2: PlayerInfo | null
    scribe: PlayerInfo | null
  }
  caseHistory: CaseResult[]
  totalScore: number
}
```

**Phase transitions:** Server-driven via `setTimeout`. A phase ends early when every active court has submitted its required action (mirror of `endRound` in current `socketServer.ts`).

### Socket Events

| C → S | Payload | Notes |
|---|---|---|
| `mt_create_room` | `{ nickname, avatar, config }` | Host only |
| `mt_join_room` | `{ code, nickname, avatar }` | Returns Spectator if mid-game |
| `mt_claim_slot` | `{ courtId, role }` | Lobby-only; rejects if filled |
| `mt_release_slot` | `{}` | Lobby-only |
| `mt_add_court` | `{}` | Host; up to max 12 |
| `mt_start_game` | `{}` | Host; validates min slots |
| `mt_submit_argument` | `{ argId, sentence }` | Prosecutor or Defense |
| `mt_submit_vote` | `{ side: 'prosecutor' \| 'defense' }` | Jury |
| `mt_submit_verdict` | `{ verdict, justification }` | Scribe |
| `mt_submit_selfscore` | `{ score: 1 \| 0.5 \| 0 }` | Jury (or Scribe fallback) |
| `mt_host_override_score` | `{ courtId, delta }` | Host adjustment in reveal |
| `mt_next_case` | `{}` | Host |
| `mt_finish_game` | `{}` | Host (early end) |

| S → C | Payload |
|---|---|
| `mt_room_state` | `{ courts, config, status, spectators }` (full snapshot) |
| `mt_court_updated` | `{ court }` (lobby delta) |
| `mt_case_start` | `{ case, caseIdx, phase: 'briefing', endsAt }` |
| `mt_phase_change` | `{ phase, endsAt }` |
| `mt_argument_received` | `{ courtId, role, argId, sentence }` (broadcast to that court only) |
| `mt_vote_received` | `{ courtId, side }` |
| `mt_case_reveal` | `{ correctVerdict, answerExplanation, courtResults: [...] }` |
| `mt_leaderboard` | `{ courts: [{ id, name, totalScore, lastCaseDelta }], caseIdx }` |
| `mt_game_finished` | `{ finalLeaderboard }` |
| `mt_error` | `{ message }` |

### Client (`app/src/`)

New files:
```
mock-trial/
├── types.ts              # client-side mirror of server types
└── socket.ts             # io('/mock-trial') factory + lifecycle
stores/
└── mockTrialStore.ts     # zustand store (mirrors speedTrialStore.ts pattern)
screens/
├── MockTrialLobbyScreen.tsx              # entry: create or join
├── MockTrialCourtSelectionScreen.tsx     # court + role slot picker
├── MockTrialHostScreen.tsx               # host control panel
├── MockTrialCaseScreen.tsx               # case briefing + role-specific lower panel
│   └── components/
│       ├── ProsecutorPanel.tsx
│       ├── DefensePanel.tsx
│       ├── JuryPanel.tsx
│       └── ScribePanel.tsx
├── MockTrialRevealScreen.tsx             # answer + learning note + Jury self-score
└── MockTrialFinalScreen.tsx              # group-based final leaderboard
```

**App.tsx changes:**
- Add 6 new screen values to `gameStore` screen enum: `mock-trial-lobby`, `mock-trial-court-select`, `mock-trial-host`, `mock-trial-case`, `mock-trial-reveal`, `mock-trial-final`.
- Add 6 cases to the `renderScreen` switch.
- Add a "Mock Trial" entry on `MainMenuScreen` alongside "Speed Trial".

**Reuse:** Existing `ui/` primitives (`PixelButton`, `Badge`, `DialogBox`, `ScoreChip`, `CoverageMeter`) are reused. New components are domain-specific only (`CourtSlotPicker`, `ArgumentCard`, `JurySelfScoreWidget`, `CourtLeaderboardRow`).

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Players don't fill required slots (game can't start) | Lobby shows a per-court "Ready" badge (green when P+D+S filled). Host start button disabled until at least one court is ready. |
| Jury self-score is gameable (everyone picks +1) | Host override panel during reveal. Score is illustrative, not exact (consistent with PDF). |
| Phase timers desync between server and slow clients | Server is source of truth; client renders countdown from `endsAt` timestamp. Phase ends server-side; clients receive `mt_phase_change` event. |
| Disconnect during case breaks flow | Slot marked `disconnected`; auto-promote rules (Jury→Scribe, etc.) keep case playable. Reconnect by `playerId` restores slot. |
| Content authoring takes longer than estimated | MVP starts with 5 cases (Speed Trial refactors). Adding more is content-only, no code change. |
| Speed Trial regression from shared socket infra | Mock Trial uses a separate `/mock-trial` namespace and separate file tree. Only 2 lines added to `socketServer.ts`. |

## 10. Testing Strategy

- **Unit tests (Vitest):** `courtManager` (slot claim/release/validation), `mockTrialScoring` (case score formula, leaderboard ordering, host override math).
- **Integration test:** Spin up server + 5 mock socket clients, run one full case end-to-end (lobby → briefing → arguing → deliberating → reveal → leaderboard), assert state transitions.
- **Manual smoke test (in-browser, 2 tabs minimum):**
  - Create room as host, join as 4 players in one court (P, D, J1, S).
  - Verify each role's argument-phase UI matches §4 table.
  - Run one case to completion; verify score = expected sum.
  - Disconnect Scribe mid-deliberation; verify Jury auto-promotes.
- **Regression check:** Speed Trial smoke test (existing flow) after Mock Trial integration.

## 11. Out of Scope (Future Work)

- Automatic role rotation between cases.
- LLM-based evaluation of free-text justifications.
- Data Flow act cases (waiting on Data Flow case content in the campaign).
- Tournament mode (multiple sessions stacked).
- Persistent group history / class roster integration.

## 12. Open Questions

None at design time. All key decisions (group model, discussion channel, group/role assignment, scoring approach, mode coexistence, host config defaults, court limits, content scope) were resolved during brainstorming.
