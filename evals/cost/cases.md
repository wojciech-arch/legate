# Cost cases — the workload spread

Legate does not win everywhere, and a test suite that only shows wins proves
nothing. These five cases are chosen to span the full range: two where delegation
should save a lot, one wash, and two where Legate should **tie or lose** — because
the honest claim is not "always cheaper" but "cheaper across a realistic mix, and
never silently worse."

Each case runs at **two CEO tiers** (`opus`, `fable`) × **two arms** (`baseline`,
`legate`) = 4 sessions per case. The CEO tier is the orchestrator/session model.

| #   | Case                  | Shape                         | Prediction (why)                                                                                                                                                                                                                     |
| --- | --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `bulk-version-bump`   | ~40 judgment-free edits       | **Big win.** Baseline burns CEO tokens on mechanical edits; Legate delegates the bulk pass to sonnet/haiku. Fable CEO widens the gap.                                                                                                |
| 2   | `wide-read-survey`    | map many modules, read-heavy  | **Win.** Baseline reads every file into a premium context; Legate fans out to haiku explorers, CEO only synthesizes.                                                                                                                 |
| 3   | `feature-plus-verify` | one bounded TDD feature       | **Modest / wash.** Implementer on sonnet is cheaper than CEO, but Legate adds a verifier spawn. Net small.                                                                                                                           |
| 4   | `trivial-lookup`      | one single-file question      | **Tie (must not lose).** Correct router behavior is NO delegation — both arms answer inline. If Legate delegates here it LOSES; that regression is exactly what this case catches.                                                   |
| 5   | `design-judgment`     | architecture review, judgment | **Wash / slight loss.** The work genuinely needs a premium brain; there is nothing to delegate down. Overhead (contract + synthesis) can make Legate marginally more expensive. Proves Legate doesn't fake savings on judgment work. |

Cases 4 and 5 are load-bearing for credibility. A suite that dropped them would
be measuring a rigged workload.

## Arm definitions

**Baseline arm** — the raw task prompt, run in a session with **no Legate installed**.
The CEO model does everything itself: reads, edits, checks. One agent, one tier.

**Legate arm** — the _same_ task prompt, run in a session **with the legate plugin
installed** so the router fires from SessionStart. The only variable between arms is
Legate's presence. The CEO delegates per the router; total cost = CEO orchestration
tokens + every worker leg at its own tier.

## Prompts

Cases 1–5 reuse existing fixture and prompt files where they exist:

| Case                  | Prompt source                               |
| --------------------- | ------------------------------------------- |
| `bulk-version-bump`   | `evals/cost-gate-bulk-edit/prompt.md`       |
| `wide-read-survey`    | `evals/router-fan-out/prompt.md`            |
| `feature-plus-verify` | `evals/pipeline-implement-verify/prompt.md` |
| `trivial-lookup`      | `evals/router-no-delegate/prompt.md`        |
| `design-judgment`     | `prompts/design-judgment.md` (in this dir)  |

All run against a fresh copy of `evals/fixtures/mini-cli` so the fable baseline
never mutates the canonical fixture.

## Scaling note

The fixtures are deliberately small to keep the fable baseline arm affordable. The
**ratio** between arms is what generalizes, not the absolute dollar figure — a 40-file
bump at `mini-cli` scale and a 400-file bump in a real repo produce the same cost
_shape_, just shifted. When reporting, lead with the savings percentage, not the raw
dollars, and state the fixture size so nobody reads the absolute number as a real-repo
cost.
