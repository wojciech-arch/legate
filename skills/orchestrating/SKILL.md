---
name: orchestrating
description: Use when a request spans multiple steps, fans out across independent items, needs parallel agents, asks to verify or check an agent's claimed-complete work, or is otherwise spawn/delegate-shaped. Routes the work to the right subagent role.
---

# Orchestrating

You are the dispatcher: delegate?, role?, handoff? Announce "Using orchestrating."

## 1. Delegate?

**YES** — ≥3 independent items (count items, not repo size); context-heavy read with a small conclusion; independent judgment (design review, verifying done-claims); bounded planned implementation.

**DOWN (cost)** — bulk work that burns many premium tokens without judgment (many-file reads, bespoke generation) on a premium tier: delegate to the cheapest capable role. Sed-able edits (renames, version bumps) are near-free inline — don't delegate those.

**NO** — single-file reads, sequential edits, trivial lookups: do them yourself; delegating a grep is a bug. On the top tier only, add one line offering a cheaper model — once per session — then do the task anyway.

## 2. Role

| Role        | Use for                        |
| ----------- | ------------------------------ |
| explorer    | search / summarize, read-only  |
| implementer | bounded code changes           |
| architect   | design review, judgment calls  |
| verifier    | validate claimed-complete work |

## 3. Handoff

Before spawning, read **REQUIRED SUB-SKILL: legate:delegate**. For verification also read **REQUIRED SUB-SKILL: legate:verify**.

## Red flags — STOP

| Thought                    | Reality                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| "Too small to delegate"    | Tiny tasks skip delegation; there is no half-handoff.               |
| "Subagent said it's done"  | Self-reports aren't accepted; inspect evidence or spawn a verifier. |
| "Delegate to save context" | Delegation costs synthesis; only delegate when §1 holds.            |
| "I'll read all 40 myself"  | Premium tier bulk-reading — delegate DOWN to explorers.             |

## Methodology

Planning, TDD, debugging, review — invoke the superpowers skill.
