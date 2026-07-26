# Cost scorecard — 2026-07-26 (Opus 5)

Re-run of the 2026-07-23 round with the `opus` band resolving to **`claude-opus-5`**
instead of `claude-opus-4-8`. Same prompts, same fixtures, same method: each arm is a
real `claude -p --output-format json` session, cost is the CLI's own `total_cost_usd`,
baseline = legate **disabled**, legate arm = legate **enabled**. `haiku` legs remain
`claude-haiku-4-5`. Opus 5 prices identically to Opus 4.8 ($5/$25), so every difference
below is **behavioural**, not a price change.

## Opus 5 results

| Task                        | Baseline | Legate on | Δ          | Delegated?           |
| --------------------------- | -------- | --------- | ---------- | -------------------- |
| trivial-lookup (1 file)     | $0.3025  | $0.3194   | **+5.6%**  | no — correct         |
| bulk-edit (20 files)        | $0.4672  | $0.5201   | **+11.3%** | no — correct (`sed`) |
| wide-read-survey (25 files) | $1.0193  | $1.0199   | **+0.06%** | no — **missed**      |

**Delegation pattern, measured directly** (3 `haiku` explorers + `opus-5` synthesis):

| wide-read-survey       | Cost        |
| ---------------------- | ----------- |
| Baseline (opus-5 solo) | $1.0193     |
| Delegation pattern     | **$0.6912** |
| **Saving**             | **−32.2%**  |

Tokens run the other way, as always: 6,507 → 9,335 (**+2,828 tokens, −$0.33**).
Projected to a `fable` CEO: $2.0385 → $1.0664 = **−47.7%**.

## Versus Opus 4.8 — what actually moved

| Metric                     | Opus 4.8 | Opus 5     | Change                |
| -------------------------- | -------- | ---------- | --------------------- |
| trivial-lookup tax         | +6.1%    | +5.6%      | unchanged             |
| bulk-edit tax              | +4.2%    | **+11.3%** | **worse — nearly 3×** |
| survey tax (auto arm)      | +13.7%   | **+0.06%** | **gone**              |
| survey saving (delegation) | −28.1%   | **−32.2%** | **better**            |
| fable projection           | −44.6%   | **−47.7%** | better                |
| Delegation auto-fired?     | never    | never      | unchanged             |

**1. Opus 5 works harder on read-heavy tasks, which makes delegation worth more.** The
survey baseline rose from $0.8967 to $1.0193 (+13.7%) and from 9 turns to 20 — Opus 5
grinds deeper on an open-ended survey rather than satisficing. That inflates exactly the
cost delegation removes, so the measured saving improved from −28.1% to **−32.2%**. The
case for offloading bulk reads to `haiku` is stronger on Opus 5, not weaker.

**2. The read-heavy tax disappeared — but not because Legate improved.** The auto arm's
Δ collapsed from +13.7% to +0.06%, and the reason is unflattering: the _baseline_ became
as expensive as the Legate arm ($1.0193 vs $1.0199). The Legate arm barely moved
($1.0195 → $1.0199). Legate did not get cheaper; the thing it is compared against got
dearer. Worth stating plainly, because the headline "+0.06%, essentially free" is true
but arrives for the wrong reason.

**3. The bulk-edit tax nearly tripled: +4.2% → +11.3%.** The Legate arm took 7 turns vs
the baseline's 6, and read 291,665 cache tokens against the baseline's 235,772. Opus 5
with the router in context deliberates more about a task whose right answer is "just run
`sed`". This is the clearest cost of routing overhead on work that should bypass routing
entirely, and it got worse with the smarter model.

**4. Delegation still never auto-fires — on either model.** Every legate arm's
`modelUsage` map contains exactly one entry (`claude-opus-5`); no `haiku`, no `sonnet`,
no sub-spawn, across all three tasks and both model generations. Two independent
generations behaving identically is strong evidence this is a **router-design property,
not a model quirk**. The −32.2% remains a ceiling the auto path does not reach.

## Bottom line

Opus 5 improves Legate's ceiling (−32.2%, −47.7% on `fable`) and erases the read-heavy
penalty, while making the scriptable-bulk penalty worse. The gap between what delegation
_can_ save and what auto-triggering _does_ save is unchanged, and is still the single
biggest lever in the plugin.
