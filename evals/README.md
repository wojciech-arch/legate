# Legate eval suite

Behavioral evals for Legate's router / delegate / verify layer. Each case is a natural
user task; the grader scores whether the _right orchestration behavior_ fired — not
whether a particular string was emitted.

## Layout

```
evals/
  fixtures/mini-cli/          # shared throwaway codebase under test (do not redesign)
  <case>/prompt.md           # the verbatim user task for one case
  graders/router-behavior.md # per-case, per-criterion PASS/FAIL rubric
  results/<date>-<run>/       # scorecards from executed rounds
```

### Cases

| Case                        | Tests                      | Expected behavior                                                                                             |
| --------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `router-fan-out`            | delegate? = YES, parallel  | per-module survey fans out to parallel explorer spawns with full handoff contracts                            |
| `router-no-delegate`        | delegate? = NO             | trivial single-file lookup answered directly, zero spawns                                                     |
| `pipeline-implement-verify` | delegate → verify pipeline | implementer spawn (TDD contract) → separate verifier spawn (spec-only) → per-criterion evidence before "done" |
| `reject-self-report`        | verify iron rule           | bare completion claim refused; evidence inspected or verifier spawned before closing                          |

The `prompt.md` files contain **only** the task text a user would type. They deliberately
do not mention Legate, delegation, or roles — the point is to see whether the router
triggers organically. All "expected behavior" lives in `graders/router-behavior.md`.

## Running the suite

### Target harness: `claude plugin eval`

This suite is authored for the `claude plugin eval` harness, which discovers
`evals/**/prompt.md` and grades against `graders/*.md`. That harness is currently
early-access-gated. When it opens, run:

```bash
claude plugin eval legate      # discovers cases + graders under evals/
```

Do not invoke it until access is confirmed — it errors out otherwise.

### Manual runner protocol (until the harness opens)

Until `claude plugin eval` is available, run each case by hand with one runner subagent
per case, each on its own **copy** of the fixture so runs never collide:

1. **Isolate the fixture.** For each case, copy `evals/fixtures/mini-cli/` to a scratch
   dir, e.g. `.../scratchpad/legate-eval/<case>/`. Never let a runner mutate the
   canonical fixture.

2. **Spawn one runner per case.** Use a `general-purpose` subagent on the default model.
   Its prompt is the case's `prompt.md` content **verbatim**, plus this suffix so the
   grader can see what the runner delegated:

   > Work in `<tempdir>`. When finished, list every subagent you spawned with the
   > verbatim prompt you gave each, or state "no subagents spawned".

   Give the runner nothing else — no hint about delegation or the expected behavior.
   Independent cases are spawned **in parallel** (all runner calls in one message).

3. **Grade each transcript** against `graders/router-behavior.md`. The grader is the
   orchestrator (or a fresh grader agent), scoring per criterion with a verbatim quote
   from the runner's transcript / final report / spawn list. No quote → FAIL.

4. **Record results** to `results/<date>-<run>/scorecard.md`: per-case criterion table,
   case verdict (PASS / PARTIAL / FAIL), overall summary, and any router/skill wording
   weaknesses observed.

The manual protocol is a faithful stand-in for the harness: same prompts, same grader,
same fixture isolation. The only difference is that spawning and grading are driven by
hand instead of by `claude plugin eval`.
