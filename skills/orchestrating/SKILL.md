---
name: orchestrating
description: Use when a request spans multiple steps, fans out across independent items, needs parallel agents, asks to verify or check an agent's claimed-complete work, or is otherwise spawn/delegate-shaped. Routes the work to the right subagent role.
---

# Orchestrating

You are the dispatcher: delegate?, role?, handoff? Announce "Using orchestrating."

## 1. Delegate?

**YES** — ≥3 independent items (count items, not repo size); context-heavy read with a small conclusion; independent judgment (design review, verifying done-claims); bounded planned implementation.

**DOWN (cost)** — judgment-free bulk work (repetitive edits, renames, version bumps across many files) while you run on a premium tier: delegate to the cheapest capable role rather than burn frontier tokens. Volume, not difficulty, is the signal.

**NO** — single-file reads, sequential edits, trivial lookups. Do these yourself. Delegating a grep is a bug.

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

| Thought                    | Reality                                                                          |
| -------------------------- | -------------------------------------------------------------------------------- |
| "Too small to delegate"    | Tiny tasks skip delegation; there is no half-handoff.                            |
| "Subagent said it's done"  | Self-reports aren't accepted; inspect evidence or spawn a verifier.              |
| "Delegate to save context" | Delegation costs synthesis; only delegate when §1 holds.                         |
| "I'll just edit all 200"   | Premium tier doing judgment-free bulk work — delegate DOWN or say what it costs. |

## Methodology

Planning, TDD, debugging, review — invoke the superpowers skill.
