---
name: delegate
description: Use when about to spawn or dispatch a subagent, hand a task to a worker, or write the prompt that launches one — before the spawn call goes out.
---

# Delegate

## Overview

A delegated agent inherits none of your context. The spawn prompt IS the entire task — if it isn't in the prompt, the worker doesn't have it. A vague spawn wastes a whole agent.

**Core principle:** Every spawn carries a complete handoff contract. No contract, no spawn.

This skill is the contract template. The router decides _when_ to delegate and _which_ role; this decides _what goes in the prompt_.

## The Handoff Contract

Every spawn prompt MUST contain these six sections, by name. Fill in every one — an empty section means you haven't scoped the task yet.

```markdown
## Objective

<One sentence, outcome-shaped. "Make X true", not "look into X".>

## Scope

IN: <exact paths / repos / globs the worker may touch or read>
OUT: <what is explicitly off-limits — adjacent files, other packages, refactors>

## Expected evidence

<The artifacts the worker must return: file paths + line refs, diff summary,
failing-then-passing test output, command + exit code. Never "a report that
it works" — name the concrete proof.>

## Stop conditions

- Done when: <observable completion state>
- Completion condition: <one machine-checkable sentence — end state + check method,
  e.g. "`npm test` exits 0 and `mini version` prints the package.json version".
  This is what the verifier will test, verbatim.>
- Max attempts: <N> on the same failure, then stop
- If blocked or scope is wrong: STOP and report the blocker. Do not improvise.

## Do NOT

- Commit, push, or tag (unless this contract says otherwise)
- Touch anything under Scope/OUT
- Refactor, rename, or "clean up" beyond the objective
- Expand scope to a problem you discover mid-task — report it instead

## Role-specific sub-skills

<see role table below>
```

## Role selection recap

Pick the role, then the model follows from it. Model names live in ONE place: `references/tiers.md`. Do not hardcode model names in prompts. **Every role is a tier band, not a fixed model** — before each spawn, run that role's escalation test in `references/tiers.md` and pass the resulting model override in the spawn call. The top of the architect/verifier band requires explicit user confirmation before spawning (see tiers.md); in-band upgrades below that never do.

| Role        | Use for                                           | Sub-skill the prompt MUST require       |
| ----------- | ------------------------------------------------- | --------------------------------------- |
| explorer    | read-only search, "where/how is X", fan-out reads | none (read-only)                        |
| implementer | writing code, features, bugfixes                  | **superpowers:test-driven-development** |
| architect   | design/plan/diff review, judgement calls          | none (read-only)                        |
| verifier    | independent check that a claim holds              | none (read-only)                        |

See `references/tiers.md` for role → model → cost. See `references/examples.md` for three complete filled-in contracts.

## Implementer spawns

Any implementer contract MUST include this line verbatim in **Role-specific sub-skills**:

> **REQUIRED SUB-SKILL:** Follow superpowers:test-driven-development for every feature or bugfix — write the failing test first, watch it fail, then implement.

## Propose the goal BEFORE implementation starts

Before the **first implementer spawn** of any multi-step effort, output a ready-made goal proposal the user can copy verbatim — then continue without waiting:

```
Goal proposal (paste to arm Claude Code's completion guard):
/goal <the Completion condition, verbatim>
```

The Completion condition line from the contract IS the goal text — write it once, use it in both places. Do not block on the user pasting it; delegation proceeds either way.

`/goal` is user-facing only (no programmatic API; subagents never see it) — propose it, never assume it is set, and keep the Completion condition in every contract regardless. Skip the proposal for single-spawn quick tasks; it is for efforts that will span multiple turns or spawns.

## Parallel dispatch

Independent spawns (no shared files, no ordering dependency) go out as **multiple Agent calls in a single message** — that is what makes them run concurrently. One call per message runs them sequentially and wastes wall-clock time. REQUIRED BACKGROUND: superpowers:dispatching-parallel-agents for grouping into independent domains.

Do NOT parallelize spawns that edit the same files or depend on each other's output — they clobber or block. Sequence those.

## After results return

Worker results come back to you, the orchestrator, for synthesis — you own the integrated outcome, not the worker. A worker's "done" is a claim, not proof.

**REQUIRED NEXT STEP:** Every returned result is subject to legate:verify before you treat the task as complete. Inspect the claimed evidence yourself or spawn a verifier — never forward a worker's self-report as if it were verified.

## Red flags — stop and write the contract

- About to spawn with a one-line prompt and no Scope/OUT
- "The agent will figure out what I mean"
- Expected evidence is prose ("tell me it works") not artifacts
- No stop condition — worker could loop or wander indefinitely
- Implementer spawn with no TDD sub-skill line
- Multi-step effort under way and no goal proposal was printed
- Parallel spawns that touch the same files
