#!/usr/bin/env node
// Cost calculator for Legate A/B scenarios.
//
// Usage:
//   node cost.mjs <scenario.json> [--intro]
//
// A scenario is one use case at one CEO tier, with two arms — `baseline`
// (the CEO does everything itself) and `legate` (CEO delegates per the router).
// Each arm is a list of agent legs: {role, model, in, out} token counts.
//
// It prints per-arm cost, the raw-token total for each arm (so the
// tokens-up / cost-down tradeoff is visible), and the delta. Cost, not raw
// tokens, is the metric Legate optimizes — a premium orchestrator that stops
// doing bulk work is the whole point.
//
// --intro applies sonnet's promotional pricing (through 2026-08-31).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const priceFile = JSON.parse(readFileSync(join(here, "pricing.json"), "utf8"));
const pricing = priceFile.models;
const CR_MULT = priceFile.cache_read_mult;
const CW_MULT = priceFile.cache_write_mult;

const args = process.argv.slice(2);
const intro = args.includes("--intro");
const scenarioPath = args.find((a) => !a.startsWith("--"));
if (!scenarioPath) {
  console.error("usage: node cost.mjs <scenario.json> [--intro]");
  process.exit(2);
}

const priceOf = (model) => {
  const p = pricing[model];
  if (!p) throw new Error(`unknown model "${model}" — not in pricing.json`);
  const inP = intro && p.in_intro != null ? p.in_intro : p.in;
  const outP = intro && p.out_intro != null ? p.out_intro : p.out;
  return { inP, outP };
};

// cost in USD for one leg. Cache tokens dominate real sessions, so they are
// priced explicitly: cache read = 0.1x input, cache write(1h) = 2.0x input.
// leg fields: {model, in, out, cr?, cw?} — cr/cw optional (cache read/write tokens).
const legCost = (leg) => {
  const { inP, outP } = priceOf(leg.model);
  const cr = leg.cr ?? 0;
  const cw = leg.cw ?? 0;
  return (
    (leg.in / 1e6) * inP +
    (leg.out / 1e6) * outP +
    (cr / 1e6) * inP * CR_MULT +
    (cw / 1e6) * inP * CW_MULT
  );
};

const summarizeArm = (legs) => {
  const rows = legs.map((leg) => ({
    role: leg.role,
    model: leg.model,
    in: leg.in,
    out: leg.out,
    cost: legCost(leg),
  }));
  return {
    rows,
    cost: rows.reduce((s, r) => s + r.cost, 0),
    tokens: rows.reduce((s, r) => s + r.in + r.out, 0),
  };
};

const usd = (n) => `$${n.toFixed(4)}`;
const tok = (n) => n.toLocaleString("en-US");
const pct = (n) => `${(n * 100).toFixed(1)}%`;

const scenario = JSON.parse(readFileSync(resolve(scenarioPath), "utf8"));
const baseline = summarizeArm(scenario.arms.baseline);
const legate = summarizeArm(scenario.arms.legate);

const costDelta = baseline.cost - legate.cost;
const costSavings = baseline.cost === 0 ? 0 : costDelta / baseline.cost;
const tokenDelta = legate.tokens - baseline.tokens;

const printArm = (name, arm) => {
  console.log(`\n  ${name}`);
  for (const r of arm.rows) {
    console.log(
      `    ${r.role.padEnd(12)} ${r.model.padEnd(7)} ` +
        `in ${tok(r.in).padStart(9)}  out ${tok(r.out).padStart(8)}  ${usd(r.cost).padStart(10)}`,
    );
  }
  console.log(
    `    ${"".padEnd(12)} ${"TOTAL".padEnd(7)} ` +
      `${tok(arm.tokens).padStart(15)} tok ${" ".repeat(9)}${usd(arm.cost).padStart(11)}`,
  );
};

console.log(
  `\n${scenario.case}  —  CEO on ${scenario.ceo}${intro ? "  (sonnet intro pricing)" : ""}`,
);
printArm("BASELINE (CEO does it all)", baseline);
printArm("LEGATE   (delegated)", legate);

console.log("\n  ── comparison ──");
console.log(
  `    cost:   baseline ${usd(baseline.cost)}  →  legate ${usd(legate.cost)}`,
);
if (costDelta >= 0) {
  console.log(
    `            saves ${usd(costDelta)}  (${pct(costSavings)} cheaper)`,
  );
} else {
  console.log(
    `            COSTS ${usd(-costDelta)} MORE  (${pct(-costSavings)} more expensive)`,
  );
}
console.log(
  `    tokens: baseline ${tok(baseline.tokens)}  →  legate ${tok(legate.tokens)}  ` +
    `(${tokenDelta >= 0 ? "+" : ""}${tok(tokenDelta)} — Legate usually spends MORE tokens)`,
);

// machine-readable tail for aggregation
console.log(
  "\n  " +
    JSON.stringify({
      case: scenario.case,
      ceo: scenario.ceo,
      baseline_cost: +baseline.cost.toFixed(6),
      legate_cost: +legate.cost.toFixed(6),
      cost_savings: +costSavings.toFixed(4),
      baseline_tokens: baseline.tokens,
      legate_tokens: legate.tokens,
    }),
);
