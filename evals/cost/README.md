# Legate cost evals — does delegation actually save?

This suite answers one question with measured numbers, not assertions: **when does
running with Legate cost less than running without it, and by how much?**

## The claim, stated honestly

Legate does **not** reduce token count. It _increases_ it — every session pays a
router injection (~423 always-on tokens), and delegation adds handoff contracts,
worker spawns, and a verification pass. Raw tokens go **up**.

What Legate reduces is **cost**, and only under one condition: **the orchestrator is on
a premium tier and some of the work is cheap-model work.** The mechanism is simple —
a frontier model doing forty mechanical edits inline is the expensive way to do them;
the same edits on `sonnet` or `haiku` cost a fraction, and the premium model only pays
for the judgment (routing + synthesis + verification).

So the honest shape of the result is:

- **Bulk / read-heavy / parallelizable work on a premium CEO** → Legate is much cheaper.
- **Trivial or judgment-bound work** → Legate is a small tax (injection with nothing to
  delegate down to). It must not _pretend_ to save here, and the suite proves it doesn't.

A workload is a mix. Legate wins if the savings on the delegatable cases outweigh the
tax on the rest. `aggregate.mjs` computes that workload total — the only figure that
answers "overall."

## What is measured

Each case runs the **same task twice** as a real headless session (`claude -p
--output-format json`):

| Arm        | Environment                       | Who does the work                                         |
| ---------- | --------------------------------- | --------------------------------------------------------- |
| `baseline` | legate **disabled**               | the CEO model does everything itself                      |
| `legate`   | legate **enabled** (router fires) | CEO delegates per the router; workers cost their own tier |

superpowers stays installed in both arms, so it cancels — the _only_ variable is
Legate. The CLI reports `total_cost_usd` and per-model `modelUsage`, so both cost and
the per-tier token split are **measured ground truth**, not estimated. The tell-tale of
delegation is the `modelUsage` map: baseline shows one model; the legate arm shows the
premium CEO plus whatever cheaper tiers the workers ran on.

## Layout

```
cost/
  README.md            # this file
  cases.md             # the 5-case workload spread (wins → wash → losses) + predictions
  pricing.json         # per-1M USD prices, mirror of references/tiers.md
  cost.mjs             # price a single {baseline, legate} scenario from token counts
  aggregate.mjs        # sum scenarios into the workload verdict
  run-arm.sh           # run ONE arm headless, capture usage.json
  prompts/             # verbatim task prompts (bulk-edit, trivial-lookup, design-judgment)
  results/<date>/      # measured runs: usage.json per arm + scorecard.md
```

`cost.mjs` / `aggregate.mjs` exist for two things the live runner can't give you cheaply:
re-pricing a measured run at a different tier (e.g. projecting the `fable` CEO from an
`opus` run's token counts), and sanity-checking the CLI's own cost math.

## Running it

Live A/B for one task at one CEO tier (this is what produced the results below):

```bash
# from repo root
scratch=/tmp/legate-measure
task=bulk-edit
# baseline arm: disable, run, capture
claude plugin disable legate
# legate arm: enable, run, capture
claude plugin enable legate@legate
```

See `run-arm.sh` for the exact invocation (fresh fixture copy per arm, `--model`,
`--output-format json`, `total_cost_usd` + `modelUsage` extraction). Start with `opus`;
`fable` doubles the CEO price, so run one headline case live and project the rest with
`cost.mjs`.

> **Scale the fixture, read the ratio.** Fixtures are small to keep the `fable` baseline
> affordable. The **savings percentage** generalizes; the absolute dollars do not. Always
> report the fixture size alongside the number.

## Results

See `results/<date>/scorecard.md` for measured runs. Lead every result with the CEO
tier and the fixture size — a savings figure without them is unreadable.
