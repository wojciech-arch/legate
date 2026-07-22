# Handoff Contract — Worked Examples

Three complete fill-ins of the contract from `../SKILL.md`. Copy the shape, not the specifics.

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
