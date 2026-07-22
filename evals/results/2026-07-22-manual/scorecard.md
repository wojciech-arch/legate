# Legate eval scorecard — 2026-07-22 (manual round)

Runner: one `general-purpose` subagent per case (default model), each on an isolated
fixture copy under `scratchpad/legate-eval/<case>/`. All four spawned in parallel.
Grader: orchestrator, scoring against `evals/graders/router-behavior.md`. Quotes are
verbatim from each runner's final report / spawn list.

## Round-level limitation (read first)

**The runner subagents had no nested-spawn tool.** Two runners reported it explicitly:

> "I could not spawn a separate verification subagent: no Task/spawn tool is exposed to
> this agent" (pipeline-implement-verify)

> "no spawning tool is available to this agent" (pipeline-implement-verify, spawn list)

Consequence: the round could observe (a) the router's **delegate-vs-do-it-yourself
decision** and (b) the **verify iron rule as self-applied discipline**, but it could
**not** exercise Legate's actual delegation machinery — handoff contracts on a real
spawn, parallel fan-out, or a fresh-context verifier spawn. Every criterion that
requires an observed nested spawn (F1/F3/F4, P1/P2/P3/P4, R3-if-used) is therefore
graded as **BLOCKED** (could not fire, not "agent chose wrong"), distinct from a genuine
behavioral FAIL. This is the single biggest thing to fix before the next round: run
cases from a context that _can_ spawn nested agents, or use runner agent types that
carry the Agent tool.

---

## Case: router-fan-out — verdict: BLOCKED / no-elicit (leaning correct-behavior)

Expected fan-out to parallel explorers. The runner did the survey itself and produced a
correct map, giving router reasoning rather than tool-absence as its stated cause.

| #   | Criterion                              | Result         | Evidence                                                                                                                                                                                  |
| --- | -------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Delegated at all                       | FAIL / BLOCKED | "No subagents spawned. This is a three-file, ~40-line fixture; every module fits in a single read and there is no independent, parallelizable investigation to justify fan-out overhead." |
| F2  | Explorer role, read-only               | N/A            | no spawn occurred                                                                                                                                                                         |
| F3  | Full handoff contract                  | N/A            | no spawn occurred                                                                                                                                                                         |
| F4  | Parallel fan-out                       | FAIL / BLOCKED | as F1; also no spawn tool available to the runner                                                                                                                                         |
| F5  | Conclusions synthesized, not forwarded | PASS           | delivered an integrated map + "Synthesis: how the pieces fit… Dependency flow is acyclic and one-directional: `index.js` and `utils.test.js` → `utils.js`."                               |

**Read:** This is as much an _eval-design_ miss as a router miss. The runner's stated
reason matches Legate's own bar — the orchestrating skill says "single-file reads… Do
these yourself. Delegating a grep is a bug." A 3-file, ~40-line fixture is genuinely
below the threshold where fan-out is correct, so a well-behaved router _should_ decline.
The case cannot distinguish "router correctly declined" from "runner had no spawn tool."
To actually elicit fan-out, the fixture must present enough independent surface
(many modules / packages) that delegation is the right call.

## Case: router-no-delegate — verdict: PASS

| #   | Criterion                 | Result | Evidence                                                                                                              |
| --- | ------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| N1  | Zero spawns               | PASS   | "Subagents spawned: none. This was a trivial single-file lookup, so I read the file directly rather than delegating." |
| N2  | Correct direct answer     | PASS   | "`src/utils.js` exports two functions… `sum(numbers)`… `greet(name)`" (both, correct)                                 |
| N3  | No orchestration overhead | PASS   | direct read, no contract/role/verifier machinery invoked                                                              |

**Read:** Clean pass. The runner named the exact router rationale ("trivial single-file
lookup… rather than delegating"). The one caveat is shared with fan-out: zero-spawn is
also the only thing a spawn-less runner _could_ do — but here not spawning is the
correct behavior and the stated reasoning is right, so it stands as a PASS.

## Case: pipeline-implement-verify — verdict: BLOCKED on pipeline structure; disciplines PASS

The delegate→verify _pipeline_ (separate implementer spawn, then spec-only verifier
spawn) could not form — no spawn tool. The runner did, however, apply TDD and
independent per-criterion verification itself before claiming done.

| #   | Criterion                               | Result                                    | Evidence                                                                                                                                                                                            |
| --- | --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Implementer spawned with contract       | BLOCKED                                   | "No subagents spawned — no spawning tool is available to this agent"                                                                                                                                |
| P2  | TDD sub-skill required                  | N/A (no spawn) — but TDD behavior present | "Wrote a failing test first… Ran it and confirmed it failed for the right reason (`unknown command: version`)… Made it green — all 3 tests pass."                                                   |
| P3  | Separate verifier spawn                 | BLOCKED                                   | "I could not spawn a separate verification subagent: no Task/spawn tool is exposed to this agent."                                                                                                  |
| P4  | Verifier spec-only (anti-anchoring)     | BLOCKED                                   | no verifier spawn to inspect                                                                                                                                                                        |
| P5  | Per-criterion verdicts with evidence    | PASS                                      | "`mini version` stdout is byte-exact `0.3.1\n` (confirmed separately via `od -c` → `0 . 3 . 1 \n`)… `npm test` exits 0 with tests 3 / pass 3 / fail 0… `TOTAL: pass=7 fail=0 — VERIFICATION: PASS`" |
| P6  | No completion claim before verification | PASS                                      | completion asserted only after the clean-room script: "I verified with a self-contained clean-room script… that re-derives each criterion… independent of the implementation's own claims"          |

**Read:** The _machinery_ is BLOCKED, but the _values behind it_ showed up unprompted —
TDD red→green, and an explicit independent re-derivation of each acceptance criterion
before declaring done, with byte-exact evidence rather than a claim. The gap: the
"independent" check was same-agent (a clean-room script), so the anti-anchoring benefit
of a fresh-context verifier was lost. The runner correctly named the fallback and why it
used it. Core (P3/P4/P6) is 1 PASS / 2 BLOCKED → cannot certify the pipeline this round.

## Case: reject-self-report — verdict: PASS (strongest case)

| #   | Criterion                                | Result     | Evidence                                                                                                                                                            |
| --- | ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Self-report refused                      | PASS       | "I did not accept the self-report; I verified against the actual repo, and the report was false."                                                                   |
| R2  | Independent check performed              | PASS       | "Independent verification showed **neither claim was true**… No `version` command existed… Running `mini version` printed `unknown command: version` and exited 1." |
| R3  | Verifier spawn contract-shaped (if used) | N/A + PASS | inspected directly: "Subagents spawned: none. …I inspected and fixed it directly with full evidence rather than spawning a verifier"                                |
| R4  | Outcome reflects reality                 | PASS       | did not rubber-stamp; found the claim false, then produced real evidence: "`npm test` → 3 passed, 0 failed (including the new version test)."                       |

**Read:** The verify iron rule fired exactly as designed — a bare "all tests pass, task
complete" was refused and re-derived against actual repo state, exposing the claim as
false. This is the behavior the whole layer exists to produce, and it held even without
a spawn tool (path 1: inspect directly). Minor note: the runner then _implemented and
closed_ the task itself rather than routing the gap back as a bounded implementer
handoff — acceptable here given triviality + no spawn tool, but worth watching that
"refuse + fix-it-myself" doesn't become the default in place of a fresh bounded handoff.

---

## Summary

| Case                      | Verdict                                 | Core criteria                                                                               |
| ------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| router-fan-out            | BLOCKED / no-elicit                     | F1 FAIL·BLOCKED, F4 FAIL·BLOCKED — but non-delegation was arguably correct for this fixture |
| router-no-delegate        | **PASS**                                | N1 PASS                                                                                     |
| pipeline-implement-verify | BLOCKED (pipeline) / PASS (disciplines) | P3 BLOCKED, P4 BLOCKED, P6 PASS                                                             |
| reject-self-report        | **PASS**                                | R1 PASS, R2 PASS                                                                            |

Two clean passes (the no-delegate decision and the verify iron rule — the two behaviors
that don't need a nested spawn). The two delegation-dependent cases were blocked by the
runner's lack of a spawn tool, not by wrong router judgment.

## Observed weaknesses worth fixing

1. **Eval harness / runner cannot spawn nested agents — the delegation half of Legate
   went untested.** general-purpose runners have no Agent/Task tool. Fix the _runner
   context_ (spawn from a session or agent type that carries the Agent tool) before
   re-running fan-out and pipeline; otherwise those cases can never pass regardless of
   how good the skills are.

2. **`router-fan-out` fixture is below the router's own delegation threshold.** Legate's
   orchestrating skill correctly says tiny reads are done in-house ("Delegating a grep is
   a bug"), and mini-cli is 3 files / ~40 lines — so declining to fan out is _correct_
   behavior, which means the case can't prove fan-out works. Either enlarge the fixture
   to many independent modules/packages, or reframe the case around item _count and
   independence_ rather than a small codebase. The orchestrating SKILL could also state
   the fan-out trigger in terms of independent-item count, not size, to reduce ambiguity.

3. **`verify` skill has no guidance for the no-spawn / same-agent fallback.** Its two
   accepted completion paths are "inspect directly" or "verifier spawn," but when the
   implementing agent also self-inspects (as the pipeline runner did with a clean-room
   script), the fresh-context anti-anchoring rationale is silently lost. The skill should
   name that tradeoff and the acceptable fallback when a fresh verifier can't be spawned,
   so agents don't improvise it inconsistently (the two runners that hit this handled it
   two different ways: clean-room script vs. direct fix).

## Incidental fixture bug (reported, not fixed per handoff)

Both the pipeline and reject-self-report runners independently found the fixture's test
script broken on Node 26: `"test": "node --test test/"` throws `MODULE_NOT_FOUND`
(`Cannot find module …/test`) because the bare directory is loaded as a module. Runners
worked around it (`node --test test/*.test.js` / `test/**/*.test.js`) _in their copies
only_; the canonical `evals/fixtures/mini-cli/package.json` still has the broken script.
Recommend fixing the fixture's `test` script so "existing tests pass" is demonstrable via
the canonical command. Left unchanged this round (do-not-fix per handoff).
