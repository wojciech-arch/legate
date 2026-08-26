# Changelog

Notable changes to Legate. Versions are the `version` field in
`.claude-plugin/plugin.json`; consumers pick them up with `claude plugin update legate`.

## 0.3.0

Adds the missing middle of the pipeline — cutting work into items — and makes
verification able to rest on a runnable oracle instead of a read diff.

### Added

- **`legate:split`** — new on-demand skill. The router *counts* independent items;
  nothing produced them. `writing-plans` decomposes for ordering (one worker walking
  steps) and `dispatching-parallel-agents` starts from a list that already exists, so
  partitioning an unenumerated task for concurrent dispatch had no owner. Four moves
  (enumerate outcomes → assign `OWNS` → test pairwise disjointness → draw dependency
  edges), a partition table whose rows become contracts, a residue table (seam-first,
  shared file, unknown extent, `sed`-able bulk), and width treated as a **verification
  budget** rather than a concurrency knob.
- **Gate-backed verification** in `legate:verify` — optional, active only when
  [`unlazy`](https://github.com/Leonxlnx/unlazy) is installed. The Completion condition
  may travel as a runnable gate; the verifier runs `--status` to read the oracle without
  executing it, then `--reverify` to re-run it. A gate that *cannot fail* is a FAIL of
  its criterion whatever it returns — the adjudication step is what makes a ledger
  stronger than prose rather than weaker. Approval rules, ledger-as-untrusted-data, and
  the one write permitted to a read-only verifier are documented alongside.
- Two eval cases: `router-split` (three commands sharing one `switch` — the seam trap)
  and `gate-backed-verify` (two rigged-but-green gates), with grader rubrics.
- Fourth worked contract in `delegate/references/examples.md`: concurrent implementers
  dispatched from a partition, with the seam item landing first.
- Three README diagrams: `OUT` derivation from the partition table, the seam trap
  (naive cut vs seam-first), and the tier-1/tier-2 verification path.

### Changed

- **`Scope` in the handoff contract now has three keys.** `IN:` narrows to *read* scope,
  `OWNS:` carries write globs (required whenever another worker runs concurrently), and
  `OUT:` is **derived** as the union of the other concurrent items' `OWNS` rather than
  written from memory. Contracts written for 0.2.x still parse — `OWNS` is only required
  for concurrent spawns — but single-key `IN:` scopes should be re-read against the new
  meaning.
- Router gains one line routing ≥2 concurrent workers through `legate:split`, plus one
  red-flag row. Always-on context ~423 → ~470 tokens.
- `Stop conditions` gains an optional `Gate:` line; `Do NOT` forbids the worker writing,
  editing, or approving the gate ledger.
- `agents/verifier.md` learns to adjudicate a ledger, and is told the single write it may
  perform (`--reverify` recording `EVIDENCE:`) and why that is not a repo edit.

### Tiers and cost, re-measured on Opus 5

Shipped alongside the above in the same release window:

- **`opus` is the default brain everywhere, orchestrator seat included.** `fable` is
  reframed as a *different* job — sustained long-horizon reasoning across a large
  surface — not the same job done better. For recency (`fable`'s cutoff is older),
  latency, or throughput guarantees, `opus` is the better model outright.
- **Raise effort before raising tier.** An `opus` pass at default effort that came back
  thin is not evidence `opus` is insufficient; a `max`-effort `opus` pass must fail first.
  And when work is recognisably long-horizon up front, spawn `fable` directly — the
  reactive path costs ~1.5× `fable` alone.
- **The cost gate matters twice as much when orchestrating on `fable`.** Measured on the
  read-heavy survey: delegating bulk reads to `haiku` saves **32%** with an `opus` CEO and
  **~48%** with a `fable` CEO.
- Cost evals re-run on Opus 5 (`evals/cost/results/2026-07-26-opus5/`); pricing table and
  the README's measured numbers updated to match.

### Note

The router body is now 2481 bytes against a documented **≤2 KB** design invariant. It was
already 2239 bytes at 0.2.0, so the overage predates this release; the invariant needs
either a documented raise or a trim.

## 0.2.0

Cost and lifecycle rules, plus the measured eval suite behind them.

- Router cost gate for judgment-free bulk work, later re-keyed on premium-token volume
  rather than file count (`sed`-able edits stay inline).
- Tier-fit rule for small tasks on the top tier — one aside, once per session, and
  silence on every other tier.
- Worker lifecycle: transactional by default; conversational only for the same task or
  genuinely exploratory work.
- Progress checkpoints — append-only status files named in the contract and polled with
  `tail`, never a message to a running worker.
- `evals/cost/`: real `claude -p` A/B runs scored on the CLI's own `total_cost_usd`.

## 0.1.0

Initial plugin: the always-injected router, `legate:delegate`, `legate:verify`, four
agent roles with tier bands, the SessionStart hook, and the behavioral eval suite.
