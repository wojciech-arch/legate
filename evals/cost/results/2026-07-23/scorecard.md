# Cost scorecard — 2026-07-23 (measured, opus CEO)

All numbers are **measured**, not estimated: each arm was a real `claude -p
--output-format json` session; cost is the CLI's own `total_cost_usd`, tokens are its
per-model `modelUsage`. Baseline = legate **disabled**; legate arm = legate **enabled**
(superpowers constant in both, so only Legate varies). Fixtures are small — read the
**percentage**, not the dollars.

## Headline

Legate's cost effect is **entirely determined by whether the model actually delegates.**
The delegation _economics_ are real and favorable; the _trigger_ is the weak link.

| Task                                      | CEO  | baseline | legate (observed) | Δ          | delegated?                              |
| ----------------------------------------- | ---- | -------- | ----------------- | ---------- | --------------------------------------- |
| trivial-lookup (1 file)                   | opus | $0.3024  | $0.3210           | **+6.1%**  | no (correct — router took NO branch)    |
| bulk-edit (20 files)                      | opus | $0.4646  | $0.4841           | **+4.2%**  | no (opus `sed`'d it inline)             |
| wide-read-survey (25 files)               | opus | $0.8967  | $1.0195           | **+13.7%** | no (ground through it inline, 21 turns) |
| wide-read-survey — **delegation pattern** | opus | $0.8967  | **$0.6450**       | **−28.1%** | yes (3 haiku legs + opus synth)         |

## What the numbers say

**1. In headless one-shot `-p`, Legate did not delegate on any of the three tasks.**
The `modelUsage` map shows opus-only in every legate arm — no haiku, no sonnet, no
sub-spawn. The router was injected (its tokens are visible: the survey legate arm read
416k cache tokens vs the baseline's 231k, and ran 21 turns vs 9) but the model chose to
do the work itself each time. Net effect: Legate **added 4–14%** cost with no offsetting
saving.

**2. Sed-able bulk is not a win — and the model was right to skip delegation.** The
bulk-edit cost is ~95% fixed session overhead (baseline: 1,435 output tokens, 234,819
cache-read tokens). Twenty mechanical edits collapse into one `sed` loop, so the "expensive
bulk" costs almost nothing in work tokens. Delegating it would **add** a second session's
overhead, not remove cost. "Delegating a grep is a bug" extends to "delegating a sed is a
bug." The cost gate's premise (frontier model burns tokens _per edit_) only holds when the
bulk genuinely costs many premium tokens — bespoke generation or large-context reads.

**3. When delegation does fire, it saves — 28% measured, on read-heavy work.** The survey
delegation pattern moved 25-file reading onto haiku (input at 1/5 opus price) and left
opus only the short synthesis. $0.897 → $0.645. This is conservative: each `-p` worker
paid a full cold-session cache-creation cost; real in-session subagents share the parent
cache, so the saving would be larger.

**4. The swing is all trigger.** Same task, same CEO: $0.645 if it delegates, $1.020 if it
doesn't — a 37% spread. Legate's economic value is bottlenecked on **causing delegation**,
not on delegation being cheap.

## Fable CEO (projected, re-priced from measured tokens)

`fable` is exactly 2× `opus` on every price dimension, so an all-opus run re-prices by 2×;
mixed runs scale only their premium legs. Projected with `cost.mjs`
(`wide-read-survey.scenario.json`, models swapped to fable):

| wide-read-survey   | fable CEO |
| ------------------ | --------- |
| baseline           | $1.7934   |
| delegation pattern | $0.9941   |
| **saving**         | **44.6%** |

The pricier the CEO, the more a delegated read-heavy workload saves — as predicted by the
cost gate. Confirm live before quoting as measured; this is a projection.

## Action items for Legate

- **The trigger is the product.** The router must make delegation the path of least
  resistance for read-heavy / high-premium-token work, especially in one-shot contexts
  where the model defaults to just doing it. Current router under-triggers here.
- **Narrow the cost gate.** It currently reads as "bulk edits → delegate." Measured, that
  is wrong for shell-scriptable edits. Reframe around _premium-token_ volume (bespoke
  generation, large-context reads), not file count. A `sed`-able pass should stay inline.
- **Re-run the A/B after router changes** to see whether the observed legate arm moves from
  +14% toward the −28% the mechanism allows.

## Reproduce

```bash
# survey A/B (opus), read-only, in the repo:
scratchpad/run-survey.sh          # baseline vs auto-legate arm
scratchpad/run-mech.sh            # the delegation pattern (3 haiku legs + opus synth)
node evals/cost/cost.mjs evals/cost/results/2026-07-23/wide-read-survey.scenario.json
```
