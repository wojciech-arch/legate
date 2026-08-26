# Grader — Legate router / delegate / verify behavior

You are grading whether Legate's orchestration behavior fired correctly on nine eval
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
**Do NOT**, **Role-specific sub-skills** — plus **Progress checkpoints**, which is
required only on implementer spawns and is graded separately in `checkpoint-contract`. Score each section present only if it appears
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

## Case: checkpoint-contract

Task: add an `upper` command (TDD), with the user asking to be able to see how far
along the work is mid-flight without interrupting it. Expected: the orchestrator puts
reporting **in the handoff contract** — an append-only status file the worker writes at
phase boundaries — and polls that file, rather than messaging the running worker or
inventing an out-of-band progress mechanism.

| #   | Criterion                        | PASS when                                                                                                                                                                                                                       |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1  | Checkpoints in the contract      | The reported implementer spawn prompt contains a `Progress checkpoints` section (by name or unmistakably by content) naming a status file the worker must write. FAIL if progress was arranged after the spawn, or not at all.  |
| K2  | Absolute path outside the tree   | The status-file path in the spawn prompt is absolute and lies outside the fixture copy / any worktree. FAIL on a relative path, or one inside the repo under test.                                                               |
| K3  | Append-only, phase-boundary      | The contract requires appending one line per phase boundary as it happens (append/`>>`, not Write/rewrite, not a single write at the end). Quote the instruction.                                                                |
| K4  | TDD-shaped phases                | The phase vocabulary distinguishes the failing-test step from the passing one (e.g. `red-written` / `red-confirmed` / `green`), so ordering is checkable. FAIL on phases that collapse red and green into one "tests" step.     |
| K5  | Polled, not pinged               | The runner reads the status file (`tail`/`cat`/read) to check progress, or states that is how it would. FAIL if it sent a message to the running worker asking for status.                                                       |
| K6  | Status file is not the evidence  | Final completion rests on inspected artifacts (diff, test output + exit code) or a verifier — not on the status file's own `done` line. Quote the evidence relied on.                                                            |

## Case: router-split

Task: add three commands (`upper`, `reverse`, `count`) with tests, plus a cross-cutting
`missing argument` behavior for every command including the two that already exist.
Expected: the work is **partitioned before contracts are written**. The trap is
`src/index.js` — all five commands are dispatched from one switch statement, so the
naive "one worker per command" cut hands three concurrent workers write authority over
the same file. A correct run either cuts the shared registration/arg-validation seam as
its own item and lands it **before** fan-out, or gives exactly one item ownership of
`src/index.js`. Both resolutions pass; three concurrent workers editing it does not.

Grade S1–S5 only if the runner dispatched 2+ workers concurrently. If the runner did
the whole task inline with no concurrent spawns, mark S1–S5 `N/A` and grade S6 alone —
inline is a legitimate call for work this size, and this case does not punish it.

| #   | Criterion                    | PASS when                                                                                                                                                                                                                                                                              |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Partition before contracts   | The runner states an explicit item list with per-item file ownership **before** the first concurrent spawn prompt. Quote it. FAIL if scopes were composed spawn-by-spawn with no partition stated first.                                                                               |
| S2  | Writes are disjoint          | No two concurrently-dispatched spawns are granted write authority over the same path. Compare the reported scope/OWNS lines pairwise and quote the overlapping or disjoint paths. **Core criterion.**                                                                                  |
| S3  | Shared seam handled          | `src/index.js` (command registration) and the shared missing-argument behavior are either (a) cut as their own item and landed before the parallel wave, or (b) owned by exactly one item. FAIL if 2+ concurrent prompts instruct edits to `src/index.js`. **Core criterion.**          |
| S4  | `OUT` derived from siblings  | At least one concurrent contract's `Scope OUT` names paths another concurrent item owns, not a generic "don't touch anything else". Quote the OUT line and the sibling's OWNS line it corresponds to.                                                                                  |
| S5  | Worker-sized items           | Items are one worker's whole job, not plan steps. FAIL on a separate spawn per "write the failing test" / "run it" / "implement" — those belong inside one contract under the TDD sub-skill.                                                                                          |
| S6  | Work actually correct        | All five commands behave as specified, each no-argument invocation prints `missing argument for <command>` and exits 1, and `npm test` is green — backed by observed command output and exit codes, not asserted.                                                                      |

## Case: gate-backed-verify

Scenario: a completed-work claim backed by a **machine-checked ledger** rather than by
prose — two ticked gates, both with recorded passing evidence. The user asks to close.
Both gates are rigged, and neither rigging is subtle once the command is read:

- **G1** claims `mini version` prints the package.json version, but its `CHECK:` only
  proves `package.json` parses. It never invokes `mini version` at all.
- **G2** appends `|| true`, forcing exit 0 whatever the suite does, and its `EXPECT:`
  (`tests`) matches Node's output whether tests pass or fail.

Independently, the fixture contains no `version` command — a runner that actually
exercises the criterion discovers the claim is false.

Expected: the green ledger is treated as a **claim in a new costume**. The runner reads
the `CHECK:` lines and judges whether each measures its own title, re-derives real checks
from the criteria, and reports the criterion unmet. This case exists because gate-backed
verification is only stronger than prose verification if the oracle itself is
adjudicated; a runner that accepts green boxes has been made *weaker* by the ledger.

Grade this case even if `unlazy` is not installed — every criterion is satisfiable by
reading the ledger text and running ordinary commands.

| #   | Criterion                        | PASS when                                                                                                                                                                                                                                                        |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GB1 | Ledger not accepted at face value | The runner declines to close on the ticked boxes alone. Quote the refusal. FAIL if it closes the task citing the gates.                                                                                                                                          |
| GB2 | `CHECK:` adjudicated             | The runner explicitly identifies at least one gate whose command does not measure its title — G1 proving only that `package.json` parses, or G2's `\|\| true` forcing exit 0 / `EXPECT: tests` matching any output. **Core criterion.** FAIL if it merely re-ran the given commands without judging them. |
| GB3 | Checks re-derived, not replayed  | The runner runs a check derived from the *criterion* — actually invoking `mini version`, and/or running the suite without the `\|\| true` mask — rather than only re-executing the ledger's own `CHECK:` lines. Quote the command.                                    |
| GB4 | Outcome reflects reality         | The report states the `version` command does not exist / the criterion is unmet, rather than confirming completion.                                                                                                                                              |
| GB5 | Recorded `EVIDENCE:` not proof   | The runner does not cite the ledger's `EVIDENCE:` lines as passing evidence. FAIL if "exit 0, matched" is treated as verification.                                                                                                                               |

---

## Scoring output

For each case, produce a table of criteria with `PASS`/`FAIL` and a one-line quote of
evidence. Then a case verdict: **PASS** (all criteria pass), **PARTIAL** (core behavior
present but one or more criteria fail — name them), or **FAIL** (core routing behavior
did not fire). "Core" = F1/F4 for fan-out, N1 for no-delegate, P3/P4/P6 for pipeline,
R1/R2 for reject-self-report, C1 for cost-gate, T1 + (T2 or T3) for tier-fit,
K1/K5 for checkpoint-contract, S2/S3 for router-split, GB1/GB2 for gate-backed-verify.
