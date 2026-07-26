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

`opus` is the default brain everywhere, including the orchestrator seat. The `fable` step is not "the same job done better" — it is a different job (sustained long-horizon reasoning), and for recency- or latency-sensitive work `opus` is the **better** model outright, not just the cheaper one.

## Cost gate — the orchestrator's own tier

Escalation tests below govern **workers**. This one governs **you**. You know which model you are running on; that makes your own token spend a routing input, not a constant.

**The expense to watch is premium tokens, not file count.** When work makes a premium-tier session process a large token volume with no judgment — reading many files into context, or generating many bespoke files — a cheaper `explorer`/`implementer` does the identical work at a fraction of the token price. That is the case to delegate down.

**Scriptable edits are NOT that case.** Renames, version bumps, mechanical find-and-replace across many files collapse into one `sed`/script command — near-zero work tokens no matter how many files. The cost there is fixed session overhead, and delegating only _adds_ a second session's overhead. Measured (`evals/cost/`): a 20-file version bump on `opus` cost essentially the same delegated or inline, and the delegated arm was slightly _more_ expensive. Do scriptable bulk inline. "Delegating a `sed` is a bug."

Before offloading bulk work, check:

1. **Does it need judgment?** Ambiguous cases, design decisions, anything where "which change is right" is unclear → it is not mechanical; do it yourself or use the implementer escalation test.
2. **Would doing it inline cost many premium tokens?** Not "how many files" — "how many tokens." Reading 40 files into an `opus` context, or generating 40 distinct modules, is expensive; a `sed` over 400 files is not. If a short script does it, it is not voluminous in the sense that matters.
3. **What tier are you on?** At `haiku` or `sonnet` there is nothing to save — proceed inline. At `opus` or `fable`, delegate down.

**If you are orchestrating _on_ `fable`, this gate matters twice as much.** `fable` is a defensible CEO for genuinely long-horizon work, but every token it spends on grunt work is billed at 2× `opus` and 10× `haiku`. Measured on the read-heavy survey (`evals/cost/`): delegating the bulk reads to `haiku` saves **32% with an `opus` CEO and ~48% with a `fable` CEO**. The more expensive the brain you are running, the less of the cheap work it should touch — keep `fable` on the judgment and push everything else down.

If (1) is no, (2) is yes, and (3) is a premium tier: **delegate down**. Write the contract, spawn the cheapest capable role, verify the result as usual. The synthesis overhead is trivial against the saving.

**If it cannot be delegated** (the work genuinely needs your accumulated context, or no Agent tool is available), say so before starting and give the user the choice:

> This is ~200 mechanical edits. Running them here on the current premium tier is roughly $X; a `sonnet` worker would do the same work for a fraction of it. I can delegate, or you can switch the session model. Proceed inline?

Never silently burn a frontier tier on work a cheap one would do identically. The user cannot approve a cost they were never shown.

## Tier fit — small tasks

The cost gate above handles judgment-free **volume**. This handles the opposite shape: a **small** task while you are running on the top tier — a single commit, a push, one file read, a one-line fix.

Do **not** delegate it. Delegation costs a contract, a spawn, and a synthesis pass; on a task this size that overhead exceeds the work no matter what tier you are on. Run it inline.

The only question is whether to mention the tier. Three rules:

1. **Top tier + small task** — do the work, and add one line noting a cheaper model would handle this fine. Suggest the switch; never require it.
2. **Any other tier + small task** — say nothing. `opus` is a normal working tier, not an extravagance. Nagging about a routine tier is noise, and noise gets ignored — which is exactly when you need the top-tier warning to land.
3. **Once per session.** Say it the first time; after that, assume the user has heard it and chosen. Repeating the same suggestion every turn is worse than never saying it.

Phrase it as an aside, after or alongside the result — not a gate in front of it:

> Done. (You are on the top tier for what was a one-command task — `/model opus` would cover work like this at a fraction of the cost.)

The user may be on the top tier deliberately, mid-way through something larger. Inform, then get out of the way.

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

`opus` is the **default brain for everything**, orchestrator included — Anthropic's own guidance is to start there for complex agentic coding and reach for `fable` only when you need the highest available capability. `fable` costs 2× per token and runs slower, so it has to earn the difference on something specific.

**What `fable` is actually for.** It is positioned as next-generation intelligence for **long-running agents** — sustained, long-horizon reasoning held together across a large surface. That is its edge, and it is the only thing worth paying 2× for:

- Long-horizon work where the reasoning must stay coherent over a very large surface (system-wide architecture, a data migration plan, a public API commitment).
- Decisions expensive enough to reverse that the better answer is worth double.

**Where `opus` is the better model, not merely the cheaper one** — do not escalate for these:

- **Recency.** `fable`'s knowledge cutoff is _older_ (Jan 2026 vs `opus`'s May 2026). Anything turning on recent APIs, releases, or ecosystem facts gets a **worse** answer at twice the price.
- **Latency.** `fable` is slower; `opus` is moderate. Interactive or time-boxed work wants `opus`.
- **Throughput guarantees.** Priority Tier covers `opus`, not `fable`.

**Prefer going direct over escalating.** If the task is _already_ recognisable as long-horizon `fable` work, spawn `fable` first rather than running `opus` and escalating after it disappoints. A wasted `opus` pass plus a `fable` pass costs about 1.5× `fable` alone — the reactive path is the expensive one. Escalate-after-failure only when you genuinely could not tell up front.

**On the reactive path, raise effort before you raise tier.** `opus` supports `effort` up to `max`, and a harder-thinking pass costs the same per token as a normal one. An `opus` run at default effort that came back thin is **not** evidence that `opus` is insufficient — it is evidence you have not tried `opus` properly yet. Exhaust that free rung first; only a `max`-effort `opus` pass that still fails justifies escalating. (This is the escalate-after-failure path only — it does not apply when the task was recognisable as `fable` work up front.)

**Confirmation is mandatory, never implied.** Before any `fable` spawn, ask the user explicitly — name the task, say why this is long-horizon work `opus` should not own (or why a `max`-effort `opus` pass was insufficient), and state the cost difference. Proceed only on their yes. Prior approval of one `fable` spawn never carries to the next.

Routine upgrades within the band (`haiku`→`sonnet`, `sonnet`→`opus`) need **no** confirmation — the escalation tests are the control; asking would nag on every spawn.
