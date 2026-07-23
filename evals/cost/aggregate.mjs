#!/usr/bin/env node
// Aggregate every scenario in a directory into one workload verdict.
//
// Usage:
//   node aggregate.mjs <dir-of-scenario.json> [--intro]
//
// Reads every *.scenario.json under <dir>, computes each case's cost with the
// same rules as cost.mjs, and reports the per-case table plus the WORKLOAD
// total — the sum across cases, which is the only figure that answers "does
// Legate save overall?" A single case can lose; the workload is what matters.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const priceFile = JSON.parse(readFileSync(join(here, "pricing.json"), "utf8"));
const pricing = priceFile.models;
const CR_MULT = priceFile.cache_read_mult;
const CW_MULT = priceFile.cache_write_mult;

const args = process.argv.slice(2);
const intro = args.includes("--intro");
const dir = args.find((a) => !a.startsWith("--"));
if (!dir) {
  console.error("usage: node aggregate.mjs <dir> [--intro]");
  process.exit(2);
}

const priceOf = (m) => {
  const p = pricing[m];
  if (!p) throw new Error(`unknown model "${m}"`);
  return {
    inP: intro && p.in_intro != null ? p.in_intro : p.in,
    outP: intro && p.out_intro != null ? p.out_intro : p.out,
  };
};
const armCost = (legs) =>
  legs.reduce((s, l) => {
    const { inP, outP } = priceOf(l.model);
    return (
      s +
      (l.in / 1e6) * inP +
      (l.out / 1e6) * outP +
      ((l.cr ?? 0) / 1e6) * inP * CR_MULT +
      ((l.cw ?? 0) / 1e6) * inP * CW_MULT
    );
  }, 0);
const armTokens = (legs) => legs.reduce((s, l) => s + l.in + l.out, 0);

const usd = (n) => `$${n.toFixed(4)}`;
const pct = (n) => `${(n * 100).toFixed(1)}%`;

const files = readdirSync(dir).filter((f) => f.endsWith(".scenario.json"));
if (!files.length) {
  console.error(`no *.scenario.json in ${dir}`);
  process.exit(1);
}

let totBase = 0;
let totLeg = 0;
const rows = [];
for (const f of files.sort()) {
  const s = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const b = armCost(s.arms.baseline);
  const l = armCost(s.arms.legate);
  totBase += b;
  totLeg += l;
  rows.push({
    case: s.case,
    ceo: s.ceo,
    base: b,
    leg: l,
    save: b === 0 ? 0 : (b - l) / b,
    bt: armTokens(s.arms.baseline),
    lt: armTokens(s.arms.legate),
  });
}

console.log(
  `\n| case | CEO | baseline | legate | Δ cost | tokens (base→leg) |`,
);
console.log(`| --- | --- | --- | --- | --- | --- |`);
for (const r of rows) {
  const dir = r.save >= 0 ? `${pct(r.save)} cheaper` : `${pct(-r.save)} DEARER`;
  console.log(
    `| ${r.case} | ${r.ceo} | ${usd(r.base)} | ${usd(r.leg)} | ${dir} | ${r.bt.toLocaleString()}→${r.lt.toLocaleString()} |`,
  );
}

const totSave = totBase === 0 ? 0 : (totBase - totLeg) / totBase;
console.log(
  `\nWORKLOAD TOTAL: baseline ${usd(totBase)} → legate ${usd(totLeg)}`,
);
console.log(
  totSave >= 0
    ? `  Legate is ${pct(totSave)} cheaper across the workload (${usd(totBase - totLeg)} saved).`
    : `  Legate is ${pct(-totSave)} MORE EXPENSIVE across the workload.`,
);
