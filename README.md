# Test Courthouse

> A browser-based educational game for ISO/IEC/IEEE 29119-4 test design techniques.
> Built for SENG 436 — Learner-as-Designer Project.

---

## Overview

**Test Courthouse** reframes four of the most demanding test design techniques in ISO/IEC/IEEE 29119-4 as criminal trials. A suspected software defect is the *defendant*, the test engineer is the *prosecutor*, and test cases are *evidence*. Coverage is the standard of proof — and a misconception in technique application leads directly to an acquittal: the bug walks free.

The game makes self-concealing misconceptions visible through consequence, not instruction. A player who confuses BCC with MCDC, or mistakes `c-use` for `p-use`, builds a test suite that *looks* correct until the verdict screen reveals the seeded fault was never caught.

**Techniques covered:**

| Act | ISO/IEC/IEEE 29119-4 Clause | Focus |
|---|---|---|
| Statement & Branch Coverage | §5.2.1 – §5.2.2 | Structural foundations |
| Branch Condition Combination (BCC) | §5.3.5 | Full combinatorial truth tables |
| Modified Condition/Decision Coverage (MCDC) | §5.3.6 | Independence pairing |
| *(Data Flow — planned)* | §5.3.7 | Def-use chains |

---

## Screenshots

| Main Menu | Campaign Map | Trial |
|---|---|---|
| *Retro sketchbook aesthetic with pixel chrome* | *Act progression with unlockable cases* | *Verdict screen with misconception probe* |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm (recommended) or npm

### Installation

```bash
git clone https://github.com/ahmetkrkyn0/iso-29119-4-gamified-activity.git
cd iso-29119-4-gamified-activity/app
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
pnpm build
```

The output is a fully static bundle in `app/dist/` — deployable to Vercel, Netlify, or GitHub Pages with no backend.

### Other Commands

```bash
pnpm lint      # ESLint
pnpm test      # Vitest
pnpm format    # Prettier
```

---

## How It Works

A single case follows five phases:

1. **Briefing** — Open a case file: a scenario describing the system under test, the charges (failure modes), and the required coverage criterion.
2. **Investigation (TD1)** — Build the test model. Identify decisions, conditions, and program statements relevant to the technique.
3. **Evidence Derivation (TD2)** — Select and construct test cases from the model (truth table rows, independence pairs, coverage items).
4. **Trial (TD3)** — Submit your test suite. A deterministic simulator runs it against seeded faults and renders a verdict.
5. **Debrief** — See which faults were detected, which coverage items were missed, and which specific misconception (if any) allowed the gap — linked to the exact ISO clause.

---

## Architecture

```
app/src/
├── engine/             # Framework-free TypeScript — the game's logic core
│   ├── coverage/       # Coverage validators per technique
│   ├── faults/         # Deterministic fault simulator
│   ├── misconceptions/ # Misconception detector functions
│   ├── verdict/        # Verdict computation
│   ├── caseLoader.ts   # Zod-validated JSON case file loader
│   └── types.ts        # Shared type definitions
├── content/
│   └── cases/          # JSON case files (one file = one level)
├── screens/            # React screen components
├── ui/                 # Reusable design system components
└── stores/             # Zustand game state
```

The `engine/` directory has no React dependency. It is unit-tested independently and represents the game's interpretation of ISO/IEC/IEEE 29119-4.

### Case Files

Every level is a JSON document. Adding a new case requires no code changes:

```jsonc
{
  "id": "mcdc-altitude-disengage-01",
  "act": "MCDC",
  "difficulty": 2,
  "iso_clauses": ["§5.3.6", "Annex C.2.3.6"],
  "scenario": { "title": "...", "code": "..." },
  "td1_expected": { ... },
  "td2_expected": { ... },
  "seeded_faults": [ ... ],
  "misconceptions": [
    {
      "id": "MCDC-INDEP-AS-ISOLATION",
      "explanation_md": "You tested each condition in isolation, but §5.3.6.2 requires *paired* test cases..."
    }
  ]
}
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) |
| Framework | React 19 |
| Build tool | Vite |
| State management | Zustand + persist middleware |
| Styling | Tailwind CSS |
| Schema validation | Zod |
| Sketchy graphics | Rough.js |
| Tests | Vitest |
| Lint / format | ESLint + Prettier |
| Persistence | localStorage (Zustand persist) |
| Deployment | Static (Vercel / Netlify / GitHub Pages) |

---

## Content

Currently 12 playable cases across three acts:

- **Statement & Branch** — Tutorial walk-through, hidden branch trap, loop edge case
- **BCC** — Three-AND truth table, cost-intuition trap
- **MCDC** — Guided tutorial, altitude disengage scenario, isolation trap, vault boss challenge, and more

The Law Library provides in-game reference cards for key ISO clauses. Achievements track demonstrated mastery per technique.

---

## Visual Design

Test Courthouse uses a **Retro Sketchbook** aesthetic: hand-drawn, monochrome line-art panels rendered with Rough.js, combined with chunky pixel-art interactive chrome (buttons, score chips, coverage meters). The two registers communicate *serious learning content* and *low-stakes, retry-friendly play* simultaneously.

**Colour palette:**

| Role | Hex |
|---|---|
| Cream paper | `#F5F0E1` |
| Notebook ink | `#1A1A1A` |
| Pixel green (pass / detected) | `#34A853` |
| Pixel magenta (misconception / retry) | `#C13584` |
| Pixel orange (info / instructor) | `#F26B1F` |
| Pixel blue (navigation / CTA) | `#2C6FBB` |

---

## Learning Objectives

After playing, participants will be able to:

1. Differentiate the four combinatorial sub-techniques (All Combinations, Pair-wise, Each Choice, Base Choice) by predicting test case counts.
2. Distinguish BCC from MCDC by deriving correct test counts (`2^N` vs `N+1`) and explaining when each is required.
3. Apply the MCDC independence criterion by constructing paired test cases where one condition changes and the decision outcome flips.
4. Build a def-use model, correctly classifying reads as `c-use` or `p-use`, and select the appropriate data flow coverage form.
5. Diagnose a failing test suite by identifying which step of the standard process (TD1 → TD2 → TD3) was performed incorrectly.

---

## Roadmap

- [x] Statement & Branch act (2 cases)
- [x] BCC act (2 cases)
- [x] MCDC act (6+ cases)
- [x] Achievement system with persistence
- [x] Law Library (ISO clause reference cards)
- [x] Debrief screen with coverage statistics
- [ ] Data Flow act (def-use graph editor)
- [ ] Local multiplayer — Mock Trial mode
- [ ] Adaptive difficulty based on misconception history
- [ ] Replay with annotation
- [ ] Class Mode (WebSocket / P2P)

---

## Contributing

This project is a university coursework submission. The case file format is designed so that content contributors do not need to touch application code — see the [Case Files](#case-files) section above.

---

## License

[MIT](LICENSE)
