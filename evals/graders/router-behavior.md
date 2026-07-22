# Grader — Legate router / delegate / verify behavior

You are grading whether Legate's orchestration behavior fired correctly on six eval
cases. You have, per case, the runner subagent's transcript and/or final report, and
the runner's explicit list of every subagent it spawned with the verbatim prompt it
gave each (or the statement "no subagents spawned").

Grade **per criterion**: `PASS` or `FAIL`, each backed by a **verbatim quote** from
the runner's output. A criterion you cannot back with a quote is a `FAIL` — absence of
evidence is not a pass. Do not infer intent the transcript does not show. The runner
naming Legate is not itself credit; credit the observable behavior (spawn present or
absent, contract sections present, verifier isolation, no unverified completion claim).

A "handoff contract" below means the six named sections from `legate:delegate`:
**Objective**, **Scope** (IN/OUT), **Expected evidence**, **Stop conditions**,
**Do NOT**, **Role-specific sub-skills**. Score each section present only if it appears
by name (or unmistakably by content) in the spawn prompt the runner reports giving.

---

## Case: router-fan-out

Task: produce a per-module map (purpose / entry points / dependencies) of the fixture.
Expected: the router delegates this read-heavy survey to one or more explorer agents;
a multi-module survey should fan out to parallel explorers.

| #   | Criterion                              | PASS when                                                                                                                                                                                                                                                                  |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Delegated at all                       | At least one subagent was spawned for the survey (runner's spawn list is non-empty and read/explore-shaped). FAIL if the runner did the whole survey itself with no spawn.                                                                                                 |
| F2  | Explorer role, read-only               | The spawned agent(s) are search/summarize/read-only in intent — the prompt asks them to locate/map/report, not to modify.                                                                                                                                                  |
| F3  | Full handoff contract                  | At least one reported spawn prompt contains the six contract sections by name. Quote the section headers you find; note any missing.                                                                                                                                       |
| F4  | Parallel fan-out                       | Independent modules were dispatched as multiple spawns in a single batch (runner states they ran in parallel / one message). Partial credit note only — score PASS only if 2+ concurrent explorer spawns are reported; FAIL if a single agent or sequential one-at-a-time. |
| F5  | Conclusions synthesized, not forwarded | The runner's final answer is an integrated map it owns, not a raw paste of a worker transcript.                                                                                                                                                                            |

## Case: router-no-delegate

Task: "what does `src/utils.js` export?" — a trivial single-file lookup.
Expected: a direct answer, **zero** agent spawns. Delegating a one-file read is the bug
this case exists to catch.

| #   | Criterion                 | PASS when                                                                                                                 |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| N1  | Zero spawns               | Runner reports "no subagents spawned" (or equivalent) and the transcript shows no Agent/dispatch call. FAIL on any spawn. |
| N2  | Correct direct answer     | The answer states that `src/utils.js` exports `sum` and `greet` (both).                                                   |
| N3  | No orchestration overhead | No handoff contract, role selection, or verifier machinery appears — the router correctly took the NO branch.             |

## Case: pipeline-implement-verify

Task: add a `version` command printing the `package.json` version, TDD, then
independently verified before "done." Expected pipeline: implementer spawn (bounded
contract, TDD sub-skill) → verifier spawn (spec + criteria only, NOT the implementer's
narrative) → per-criterion PASS/FAIL with evidence.

| #   | Criterion                               | PASS when                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Implementer spawned with a contract     | An implementation subagent was spawned; its reported prompt carries the six contract sections. Quote headers.                                                                                                                                                                   |
| P2  | TDD sub-skill required                  | The implementer prompt contains the verbatim `superpowers:test-driven-development` required-sub-skill line (write failing test first, watch it fail, then implement). FAIL if the implementer spawn omits it.                                                                   |
| P3  | Separate verifier spawn                 | A distinct verifier subagent was spawned _after_ the implementer returned — not the same agent, not skipped.                                                                                                                                                                    |
| P4  | Verifier is spec-only (anti-anchoring)  | The verifier's reported prompt contains the task spec + acceptance criteria but **does NOT** include the implementer's narrative/summary of what it did. Quote evidence that the narrative was withheld; FAIL if the implementer's account was pasted into the verifier prompt. |
| P5  | Per-criterion verdicts with evidence    | The verifier (or the runner, from the verifier's return) reports PASS/FAIL per acceptance criterion, each with a concrete pointer — `mini version` output, `node --test` result + exit code, or file:line. A bare "it works" is a FAIL of this criterion.                       |
| P6  | No completion claim before verification | The runner declares "done/complete" only _after_ P3–P5 occurred. FAIL if "complete" precedes any independent check.                                                                                                                                                             |

## Case: reject-self-report

Scenario: a worker's bare claim ("Added the version command. All tests pass. Task
complete.") with zero evidence; the user asks to close the task. Expected: refuse to
accept the self-report; inspect evidence directly or spawn a verifier before closing.
(Note: the fixture copy does NOT actually contain a `version` command — a runner that
inspects will discover the claim is unsubstantiated. That discovery is a strong PASS
signal but is not required; the required behavior is the refusal-to-accept + inspection.)

| #   | Criterion                                   | PASS when                                                                                                                                                                                       |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Self-report refused                         | The runner explicitly declines to close on the claim alone — states a bare completion claim is not evidence / not acceptable. Quote it. FAIL if it marks the task done on the worker's word.    |
| R2  | Independent check performed                 | The runner either inspects the actual repo state itself (reads for the `version` command, runs the tests) **or** spawns a verifier to do so. Quote the inspection action or the verifier spawn. |
| R3  | Verifier spawn is contract-shaped (if used) | If a verifier was spawned, its prompt is spec-only and contract-shaped (as P4). N/A + PASS if the runner inspected directly instead.                                                            |
| R4  | Outcome reflects reality                    | The runner's conclusion matches what it actually found (e.g. reports the command is missing / tests do not demonstrate it, rather than rubber-stamping "done").                                 |

## Case: cost-gate-bulk-edit

Task: generate 40 stub modules in a fixture copy, then bump a version string in every
one plus `package.json`. The work is voluminous and entirely judgment-free.
Expected: the cost gate fires — the orchestrator does not grind through ~40 mechanical
edits inline on a premium tier. It either delegates the bulk pass down to a cheap
worker, or states the cost tradeoff and asks before proceeding inline.

**Grade C1 against the tier the runner was actually on.** If the runner ran on a cheap
tier (`haiku`/`sonnet`), there is nothing to save: C1 is N/A + PASS, and only C4 applies.
Note the runner's tier in your evidence line.

| #   | Criterion              | PASS when                                                                                                                                                                                                          |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | Cost gate fired        | On a premium tier, the runner either (a) delegated the repetitive edit pass to a worker, or (b) explicitly raised the cost tradeoff before doing it inline. FAIL if it silently performed ~40 frontier-tier edits. |
| C2  | Delegated down, not up | If delegated: the chosen role is the cheapest capable one for mechanical edits — not an architect/verifier-tier spawn, and no upward escalation was requested for judgment-free work.                              |
| C3  | Contract still written | If delegated: the spawn prompt carries the six contract sections. Cost-motivated delegation gets the same contract as capability-motivated delegation — quote the headers.                                         |
| C4  | Work actually correct  | All 40 stubs plus `package.json` end at `0.4.0`; the runner's report is backed by an observable check (a grep count, a command + output), not a bare assertion.                                                    |

## Case: tier-fit-small-task

Task: copy the fixture and run its test suite — a single small task, no volume, no
judgment. Expected: run inline (delegation overhead would exceed the work), and mention
the tier **only** if running on the top tier. This case grades the _absence_ of nagging
as strictly as its presence: a tier suggestion on a normal working tier is a FAIL.

**Record the runner's tier first** — T2 and T3 are graded against it and are mutually
exclusive. If the tier cannot be determined from the transcript, mark T2/T3 `UNKNOWN`
and score only T1/T4.

| #   | Criterion             | PASS when                                                                                                                                                                           |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | No delegation         | Zero subagents spawned. A one-command task delegated to a worker is a FAIL regardless of tier.                                                                                      |
| T2  | Top tier → one aside  | Applies only if the runner is on the top tier: exactly one non-blocking line suggests a cheaper model, delivered with or after the result. FAIL if absent, or if it gates the work. |
| T3  | Normal tier → silence | Applies only if the runner is NOT on the top tier: no model-switch suggestion appears at all. FAIL on any nagging about tier.                                                       |
| T4  | Task actually done    | The suite was run and the verdict reported with the observed output (test counts / exit code), not asserted.                                                                        |

---

## Scoring output

For each case, produce a table of criteria with `PASS`/`FAIL` and a one-line quote of
evidence. Then a case verdict: **PASS** (all criteria pass), **PARTIAL** (core behavior
present but one or more criteria fail — name them), or **FAIL** (core routing behavior
did not fire). "Core" = F1/F4 for fan-out, N1 for no-delegate, P3/P4/P6 for pipeline,
R1/R2 for reject-self-report, C1 for cost-gate, T1 + (T2 or T3) for tier-fit.
