# Handoff Contract — Worked Examples

Four complete fill-ins of the contract from `../SKILL.md`. Copy the shape, not the specifics.

---

## Example 1 — Explorer fan-out (parallel)

Three explorers dispatched **in one message** to map an unfamiliar auth system. Each gets an independent slice; none writes.

**Explorer A prompt:**

```markdown
## Objective

Locate every place a session token is created, validated, or revoked in packages/api.

## Scope

IN: packages/api/** (read only)
OUT: packages/web/**, packages/shared/**, node_modules/**. Do not open other packages.

## Expected evidence

A list of call sites as file:line references, grouped by create / validate / revoke.
For each, one line naming the function and what triggers it. Conclusions only —
do not paste file contents.

## Stop conditions

- Done when: all three categories covered across packages/api, or you have searched
  every plausible module and found none (say so explicitly).
- Max attempts: if a search term returns nothing, try 2 synonyms, then move on.
- If blocked: report what you could not access and why.

## Do NOT

- Modify any file. You are read-only.
- Follow references out of packages/api into other packages.
- Summarize the whole auth design — only the token lifecycle sites.

## Role-specific sub-skills

None. State explicitly at the end what you did NOT search.
```

Explorers B and C get the same shape scoped to `packages/web` and `packages/shared`. Orchestrator synthesizes the three results into one map.

_No `## Progress checkpoints` section: these explorer spawns are short single-pass
reads. Add one when a fan-out is long enough that "how far did it get" is a real
question._

---

## Example 2 — Implementer task

```markdown
## Objective

Make `parseDuration("1h30m")` return 5400 (seconds) instead of throwing.

## Scope

IN: src/util/duration.ts and src/util/duration.test.ts
OUT: every other file. Do not change the public signature, callers, or exports.

## Expected evidence

- A failing test added first that reproduces the throw, then passing.
- Diff summary of duration.ts (the parsing change only).
- Full output of `yarn test duration` showing the new test and prior tests green,
  with the exit code.

## Progress checkpoints

Append one line to /tmp/claude-scratch/status-duration-fix.md at each phase
boundary, before starting the next phase. Append only —
`printf '%s\n' "$(date -u +%H:%M:%S) | green | duration.ts fix applied" >> <file>`.
Never Write or rewrite the file.

Phases: red-written / red-confirmed / green / build-clean / done
If blocked: append `BLOCKED | <what> | <what would unblock it>`, then stop.

## Stop conditions

- Done when: `yarn test duration` passes with the new compound-unit case covered.
- Completion condition: `yarn test duration` exits 0 and its output shows the new
  compound-unit test name passing.
- Max attempts: 3 on the same failing test. If still red, stop and report the
  actual failure output — do not rewrite the test to pass.
- If the fix would require touching a caller or the signature: STOP and report;
  that is a scope change for the orchestrator to decide.

## Do NOT

- Commit or push.
- Refactor the rest of duration.ts or "improve" unrelated parsing.
- Add new dependencies.

## Role-specific sub-skills

**REQUIRED SUB-SKILL:** Follow superpowers:test-driven-development — write the
failing test first, watch it fail, then implement the minimal fix.
```

---

## Example 3 — Verifier spawn

_Verifier contracts never carry `## Progress checkpoints` — the role is one-shot and
side-effect-free by design._

Gets the **original spec and acceptance criteria only** — never the implementer's narrative, so it cannot anchor on the implementer's account.

```markdown
## Objective

Determine whether the branch satisfies each acceptance criterion for FEAT-204,
independently. Assume nothing is done until you see proof.

## Scope

IN: the working tree + `git diff main`, and running the test/lint suite (read + run).
OUT: do not fix anything you find. Report only.

## Acceptance criteria (verify each)

1. `POST /invite` returns 201 with a token for a valid email.
2. Duplicate invite for the same email returns 409.
3. Tokens expire after 24h (test asserts this).
4. New behavior has tests; `yarn test invite` is green.

Completion condition (from the implementer's contract, test verbatim):
`yarn test invite` exits 0 and all four criteria above hold.

## Expected evidence

For each criterion: PASS or FAIL, with a pointer — file:line, or the command run
and its output. A FAIL must cite what you saw that contradicts the criterion.

## Stop conditions

- Done when: every criterion has a PASS/FAIL verdict with evidence.
- If the suite won't run: report the error verbatim; that is itself a FAIL.

## Do NOT

- Edit, fix, or commit anything.
- Accept "looks implemented" — a criterion with no test or no observable proof
  is a FAIL, not a pass.

## Role-specific sub-skills

None. Be skeptical by default — you are hunting for reasons the claim is false.
```

Failures route back as a **new bounded implementer handoff** (Example 2 shape), not a "please fix the above" continuation.

---

## Example 4 — Concurrent implementers from a partition

Two implementers running at once. The partition comes from `legate:split` **before**
either contract is written; `OUT` is then read off the table rather than invented.

**Partition table (legate:split output):**

| id | Objective | OWNS | READS | depends on | role |
| --- | --------- | ---- | ----- | ---------- | ---- |
| S0 | Rate-limit middleware exists and is unit-tested | `src/middleware/rateLimit.ts`, `test/middleware/**` | `src/config/**` | — | implementer |
| S1 | `/invite` enforces the limit | `src/routes/invite.ts`, `test/routes/invite.test.ts` | `src/middleware/**` | S0 | implementer |
| S2 | `/login` enforces the limit | `src/routes/login.ts`, `test/routes/login.test.ts` | `src/middleware/**` | S0 | implementer |

S0 is the **seam** — S1 and S2 both import it, so it is not concurrent with them. It
lands and is verified first; S1 and S2 then go out in one message.

**S1 prompt (S2 is identical in shape):**

```markdown
## Objective

Make POST /invite reject requests over the rate limit with 429.

## Scope

IN: src/routes/**, src/middleware/** (read), test/routes/**
OWNS: src/routes/invite.ts, test/routes/invite.test.ts
OUT: src/routes/login.ts, test/routes/login.test.ts (owned by a worker running
right now — editing them clobbers it), src/middleware/** (landed and verified;
read it, do not change it), everything else.

## Expected evidence

The diff of the two files you own, plus `yarn test routes/invite` output showing
the new test failing before the change and passing after, with exit code.

## Progress checkpoints

Append one line to /tmp/legate/status-s1-invite.md at each phase boundary, before
starting the next phase. Append only — `printf '%s\n' "..." >> <file>`.
Never Write or rewrite the file.

  `<HH:MM:SS> | <phase> | <one-line state>`

Phases: red-written / red-confirmed / green / build-clean / done
If blocked: append `BLOCKED | <what> | <what would unblock it>`, then stop.

## Stop conditions

- Done when: /invite returns 429 past the limit and the suite is green.
- Completion condition: `yarn test routes/invite` exits 0 and a request past the
  configured limit to POST /invite returns HTTP 429.
- Max attempts: 3 on the same failure, then stop.
- If blocked or scope is wrong: STOP and report the blocker. Do not improvise.

## Do NOT

- Commit, push, or tag.
- Touch anything under Scope/OUT — another worker owns those files *now*.
- Change the middleware to make your route easier; report the mismatch instead.
- Refactor, rename, or "clean up" beyond the objective.
- Rewrite, truncate, or reorder the status file — append only.

## Role-specific sub-skills

**REQUIRED SUB-SKILL:** Follow superpowers:test-driven-development for every feature
or bugfix — write the failing test first, watch it fail, then implement.
```

Note what the partition bought: S1's `OUT` names S2's `OWNS` verbatim, so the two
contracts cannot both claim a file. Written per-spawn from memory, that guarantee does
not exist.
