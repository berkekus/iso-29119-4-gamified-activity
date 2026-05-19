# Test Courthouse ⚖️

> A browser-based educational game that teaches ISO/IEC/IEEE 29119-4 test design techniques through courtroom-inspired play.

Test Courthouse turns software testing concepts into interactive trial scenarios. Players investigate a suspected defect, build evidence through test cases, submit their reasoning, and receive a verdict that exposes whether their test design actually detects the seeded fault.

The project was built as a learner-as-designer educational activity for SENG 436, with an emphasis on misconception-driven feedback, replayable practice, and lightweight classroom use.

---

## ✨ Highlights

- **Gamified ISO 29119-4 learning** through a courtroom metaphor.
- **15 single-player campaign cases** covering structural and combinatorial test design techniques.
- **Misconception-aware feedback** that explains why an answer failed, not only that it failed.
- **Law Library** with unlockable ISO clause reference cards.
- **Achievements and progress persistence** via local storage.
- **Speed Trial multiplayer mode** powered by Socket.IO for live classroom competition.
- **Framework-independent TypeScript engine** for coverage, verdict, and misconception logic.

---

## 🎯 Learning Scope

| Area | ISO/IEC/IEEE 29119-4 Focus | In-Game Activity |
| --- | --- | --- |
| Statement Coverage | Section 5.2.1 | Identify executable statements and cover required paths. |
| Branch Coverage | Section 5.2.2 | Exercise true and false outcomes, including hidden branches and loop traps. |
| Decision Coverage | Section 5.3 | Distinguish decisions from individual conditions. |
| Branch Condition Coverage | Section 5.3.4 | Track individual condition outcomes without confusing it with full combinations. |
| Branch Condition Combination | Section 5.3.5 | Build full truth-table coverage and reason about combinatorial growth. |
| Modified Condition/Decision Coverage | Section 5.3.6 | Construct independence pairs where exactly one condition changes and the decision flips. |
| Mixed Coverage Review | Multiple clauses | Diagnose which coverage criterion is appropriate for a scenario. |

---

## 🕹️ Gameplay

Each case follows a compact trial flow:

1. **Briefing** - read the scenario, failure mode, and relevant test-design objective.
2. **Investigation** - inspect the system behavior and identify the testing model.
3. **Evidence** - choose rows, values, fragments, or pairs depending on the technique.
4. **Trial** - submit the proposed test evidence.
5. **Debrief** - review the verdict, detected faults, missed coverage, and triggered misconception.

Passing cases unlocks progress, law cards, and achievements. Failed attempts are designed to be informative and retry-friendly.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or newer
- npm, or pnpm if you prefer it

### Install the Frontend

```bash
git clone https://github.com/ahmetkrkyn0/iso-29119-4-gamified-activity.git
cd iso-29119-4-gamified-activity/app
npm install
```

### Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

The production bundle is generated in `app/dist/` and can be deployed as a static site.

### Quality Checks

```bash
npm run lint
npm run test
npm run format
```

---

## ⚡ Speed Trial Multiplayer

Speed Trial is the live classroom mode. A host creates a room, players join with a room code, and timed questions award points based on correctness and response speed.

### Start Manually

Terminal 1:

```bash
cd app/server
npm install
npm run dev
```

Terminal 2:

```bash
cd app
npm run dev
```

The Socket.IO server runs on [http://localhost:3001](http://localhost:3001) by default, while the frontend runs on [http://localhost:5173](http://localhost:5173).

### Configure the Socket URL

Create `app/.env.local` when the frontend should connect to a deployed or non-default server:

```env
VITE_SOCKET_URL=http://localhost:3001
```

### Windows Launcher

From the repository root, you can also start both services with:

```powershell
.\start-speed-trial.ps1
```

---

## 🧱 Architecture

```text
app/
  src/
    App.tsx                  # Screen-level navigation shell
    content/
      cases/                 # JSON case files, one file per campaign case
      achievements.*         # Achievement definitions and unlock logic
      lawCards.*             # ISO law-card content and case mappings
      caseOrder.ts           # Canonical campaign order
    engine/
      coverage/              # Coverage and MC/DC helpers
      faults/                # Deterministic seeded-fault simulation
      misconceptions/        # Misconception detection
      verdict/               # Verdict computation
      caseLoader.ts          # Zod-validated case parsing
      types.ts               # Shared domain types
    screens/                 # React screens for campaign, case play, library, achievements, Speed Trial
    stores/                  # Zustand stores and persisted campaign progress
    ui/                      # Reusable visual components
    speed-trial/             # Socket client and multiplayer types
  server/
    src/                     # Express + Socket.IO Speed Trial server
  tests/                     # Vitest coverage for engine, stores, content, and screens
```

The core game engine is kept separate from React so that coverage rules, verdict logic, and misconception detection can be tested independently.

---

## 🧩 Case Content

Campaign cases are JSON-driven. Most new learning scenarios can be added by creating a case file, registering it in the case registry, and placing it in the campaign order.

Example shape:

```jsonc
{
  "id": "mcdc-vault-boss-01",
  "act": "MCDC",
  "difficulty": 3,
  "iso_clauses": ["Section 5.3.6"],
  "scenario": {
    "title": "Vault Access Decision",
    "decision_expression": "M && (K || T)",
    "conditions": ["M", "K", "T"]
  },
  "seeded_faults": [
    {
      "id": "FAULT-001",
      "description": "A decision condition is implemented incorrectly."
    }
  ],
  "misconceptions": [
    {
      "id": "MCDC-INDEP-AS-ISOLATION",
      "explanation_md": "MC/DC requires paired tests that isolate one condition while the decision outcome changes."
    }
  ]
}
```

---

## 🧪 Testing Strategy

The test suite focuses on the educational logic rather than only UI rendering:

- **Engine tests** validate truth-table generation, MC/DC coverage, seeded-fault simulation, verdicts, and misconception detection.
- **Store tests** cover navigation state, answer submission, progress persistence, law-card unlocks, and achievement unlocks.
- **Content tests** ensure campaign cases, case ordering, law cards, and achievements remain consistent.
- **Screen tests** verify user-visible behavior for key views such as the Law Library, Achievements, and case briefings.

Run all tests from `app/`:

```bash
npm run test
```

---

## 🎨 Visual Direction

Test Courthouse uses a retro sketchbook courtroom style: paper-like surfaces, hand-drawn visual framing, pixel-inspired buttons, and readable high-contrast UI elements. The tone is intentionally playful without reducing the seriousness of the testing concepts.

Core interface colors:

| Role | Hex |
| --- | --- |
| Paper | `#F5F0E1` |
| Ink | `#1A1A1A` |
| Success | `#34A853` |
| Misconception / Retry | `#C13584` |
| Information | `#F26B1F` |
| Navigation / CTA | `#2C6FBB` |

---

## 🤝 Contributing

This repository is primarily an academic project, but the structure is intentionally content-friendly. New scenarios should keep domain logic in JSON where possible and reserve code changes for new interaction types, coverage rules, or shared engine behavior.

Before submitting changes, run:

```bash
cd app
npm run lint
npm run test
npm run build
```

---

## 👥 Project Team

Test Courthouse was designed and developed with care by:

- Alin Kısakürek
- Ahmet Karakoyun
- İzzettin Berke Kuş

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
