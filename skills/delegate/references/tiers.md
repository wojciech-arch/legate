# Role → Model Tiers

This file and the `model:` field in each `agents/*.md` are the **only two places** model names appear. When Anthropic ships a new tier, edit here and edit the four agent frontmatters — nothing else references a model.

Aliases (`haiku`, `sonnet`, `opus`, `fable`) are used deliberately instead of pinned model IDs so role assignments survive model churn: the alias tracks the current best model in its tier without a plugin-wide find-and-replace.

**Every role is a tier band, not a fixed model.** The agent frontmatter pins the default; escalate (or downgrade) by passing a `model:` override in the spawn call — a per-invocation override takes precedence over frontmatter. Run the role's escalation test below before every spawn.

| Role        | Band                         | Default  | Rationale                                                                                                                                                                                   | Cost tier |
| ----------- | ---------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| explorer    | `haiku` → `sonnet`           | `haiku`  | Most exploration is high-volume, low-judgement pattern-matching — cheap bulk reading.                                                                                                       | $–$$      |
| implementer | `sonnet` → `opus`            | `sonnet` | Near-Opus coding quality at roughly half the cost (Anthropic's multi-agent benchmark: a frontier orchestrator driving `sonnet` workers reached 96% of all-Opus quality at 46% of the cost). | $$–$$$    |
| architect   | `opus` → `fable`⚠            | `opus`   | Design review needs independent judgement — spotting boundary violations, weighing alternatives, disagreeing with a plan. Few spawns, high leverage.                                        | $$$–$$$$  |
| verifier    | `sonnet` ← `opus` → `fable`⚠ | `opus`   | Fresh-context validation of a completion claim; skepticism and thoroughness over speed. Downgrade allowed for low stakes.                                                                   | $$–$$$$   |

⚠ = the `fable` step requires **explicit user confirmation** — see below.

## Cost gate — the orchestrator's own tier

Escalation tests below govern **workers**. This one governs **you**. You know which model you are running on; that makes your own token spend a routing input, not a constant.

**When the work is judgment-free and voluminous — repetitive edits, renames, version bumps, mechanical migrations across many files — the orchestrator's tier is the expensive part.** A frontier-tier session editing 200 files inline can cost two orders of magnitude more than an `implementer` at `sonnet` or an `explorer` at `haiku` doing exactly the same edits.

Before doing bulk mechanical work inline, check:

1. **Does it need judgment?** Ambiguous cases, design decisions, anything where "which change is right" is unclear → it is not mechanical; do it yourself or use the implementer escalation test.
2. **Is it voluminous?** Roughly: more than ~10 similar edits, or a repetitive pass over many files.
3. **What tier are you on?** At `haiku` or `sonnet` there is nothing to save — proceed inline. At `opus` or `fable`, delegate down.

If (1) is no, (2) is yes, and (3) is a premium tier: **delegate down**. Write the contract, spawn the cheapest capable role, verify the result as usual. The synthesis overhead is trivial against the saving.

**If it cannot be delegated** (the work genuinely needs your accumulated context, or no Agent tool is available), say so before starting and give the user the choice:

> This is ~200 mechanical edits. Running them here on the current premium tier is roughly $X; a `sonnet` worker would do the same work for a fraction of it. I can delegate, or you can switch the session model. Proceed inline?

Never silently burn a frontier tier on work a cheap one would do identically. The user cannot approve a cost they were never shown.

## Escalation tests

### explorer: haiku → sonnet

Bump when the search requires **inference rather than pattern-matching**: unclear naming, intent has to be deduced, results need synthesis across modules rather than location. Plain "find X / list Y" stays `haiku`.

### implementer: sonnet → opus

`sonnet` (default) when ALL hold:

- Spec is concrete: named files, clear acceptance criteria, no open design questions.
- Touches ≤ ~2 modules following patterns that already exist in the codebase.
- Failure is cheap to detect (tests or verifier will catch a bad attempt).

`opus` when ANY hold:

- Cross-cutting change (several modules, shared state, public API surface).
- The task requires design judgement the handoff couldn't pin down (ambiguous spec, novel algorithm, concurrency, migrations).
- The work product IS judgement — e.g. authoring evals, rubrics, or skills rather than code against tests.
- **Escalation:** a `sonnet` attempt already failed verification once. Re-handoff the same bounded scope at `opus`; do not retry `sonnet` on the identical task.

Never downgrade an implementer below `sonnet` for real feature/bugfix work — the quality cliff shows up as broken tests and rework that costs more than the model savings.

### verifier: opus → sonnet (downgrade)

Allowed when stakes are low AND the diff is small (non-user-facing, single file). Keep `opus` for anything user-facing or multi-file.

### architect / verifier: opus → fable — ONLY when REALLY needed, ALWAYS with user confirmation

`fable` costs ~2× `opus` per token and runs minutes-long turns. It is justified only when `opus` is demonstrably insufficient, not merely when the task is important:

- An `opus` architect/verifier pass already ran and was **inconclusive or contradicted itself**, and the decision is expensive to reverse (system-wide architecture, data migration, public API commitment).
- The analysis genuinely needs very-long-horizon reasoning across a large surface that `opus` failed to hold together.

**Confirmation is mandatory, never implied.** Before a `fable` spawn, ask the user explicitly — name the task, why `opus` was insufficient, and the cost difference — and proceed only on their yes. Prior approval of one `fable` spawn does not carry over to the next.

Routine upgrades within the band (`haiku`→`sonnet`, `sonnet`→`opus`) need **no** confirmation — the escalation tests are the control; asking would nag on every spawn.
