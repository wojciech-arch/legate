---
name: verify
description: Use when a subagent reports a task done, when about to treat delegated work as complete, or when integrating a worker's result — before the claim is accepted.
---

# Verify

## Overview

This skill covers verifying **others'** work — the results delegated agents hand back. For verifying your OWN claims before you assert them, REQUIRED BACKGROUND: superpowers:verification-before-completion.

**Core principle:** A subagent's "done" is a claim, never evidence.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Rule

```
A SUBAGENT'S COMPLETION CLAIM IS NEVER ACCEPTED ON ITS OWN.
```

Completion requires ONE of:

1. **You inspect the claimed evidence directly** — read the diff, run the test, check the exit code — or
2. **A verifier spawn** with fresh context confirms it.

If neither happened in this message, the work is not verified. "The agent said it passed" is not verification.

## Scale verification to stakes

| What came back                        | How to verify                                                   |
| ------------------------------------- | --------------------------------------------------------------- |
| Small diff, one file, non-user-facing | Orchestrator reads the diff and runs the relevant test directly |
| Feature claimed complete              | Verifier spawn                                                  |
| Multi-file change                     | Verifier spawn                                                  |
| Anything user-facing                  | Verifier spawn                                                  |
| Touches auth, data, money, deletion   | Verifier spawn, and read it yourself too                        |

When in doubt, spawn the verifier. It is cheaper than shipping a false completion.

## The verifier spawn

Spawn via legate:delegate using the verifier role. The critical rule:

**Give the verifier ONLY the original task spec + acceptance criteria + repo access. NOT the implementer's narrative.**

If the handoff contract carried a **Completion condition** line, pass it verbatim — it is the primary criterion, tested exactly as written (run the named command, compare the named output).

The implementer's account of what it did will anchor the verifier onto the same blind spots. Withhold it. The verifier re-derives the truth from the spec and the actual repo state.

The verifier returns **PASS or FAIL per acceptance criterion, each with an evidence pointer** (file:line, or command + output). A criterion with no observable proof is a FAIL, not a pass.

## No-spawn fallback

Sometimes a verifier spawn isn't possible (no Agent tool in this context, or the spawn budget is spent). The fallback is **clean-room self-verification**, and it must preserve as much of the anti-anchoring property as it can:

- Re-derive the checks **from the spec and acceptance criteria only** — do not walk the implementer's narrative or your own implementation steps and confirm each one.
- Run fresh commands against actual repo state (tests, CLI invocations, greps), and hold the same PASS/FAIL-per-criterion + evidence-pointer format.
- Name the limitation in your report: "verified same-context — fresh-context verification unavailable." A same-agent check can share the author's blind spots; saying so lets the reader weigh it.

This fallback is acceptable. Skipping verification because a spawn wasn't available is not.

## Failures route as new work

A failed criterion does NOT go back as "please fix the above." It becomes a **new, bounded implementer handoff** (legate:delegate) scoped to exactly that gap, with its own contract. A "continue and fix" prompt reopens the whole fuzzy scope; a fresh bounded handoff keeps the fix auditable.

Then verify again. Re-verification is not optional because "it was a small fix."

## Red flags — STOP, do not accept

- "The agent reported success" — and you have not looked at the diff
- About to synthesize a worker's result into your own without inspecting it
- Marking a task done because the worker said done
- Skipping the verifier because the change "seems small" but it's user-facing
- Giving the verifier the implementer's summary (anchoring it)
- Re-running a failed task as "keep going" instead of a fresh bounded handoff
- "It probably works" / "should be fine" about someone else's output

**All of these mean: inspect the evidence or spawn a verifier. No exceptions.**

## Rationalizations

| Excuse                        | Reality                                                 |
| ----------------------------- | ------------------------------------------------------- |
| "The agent is reliable"       | Reliability is not this run's evidence. Check the diff. |
| "It was a trivial task"       | Trivial tasks fail silently too. 30 seconds to confirm. |
| "The summary is detailed"     | A detailed claim is still a claim. Detail ≠ proof.      |
| "Re-verifying wastes a spawn" | A false completion costs more than a verifier spawn.    |
| "I'll verify at the end"      | The end inherits every unverified claim compounded.     |
