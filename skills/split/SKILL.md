---
name: split
description: Use when a task must be cut into items for concurrent workers — after the router decides to delegate and before any handoff contract is written, whenever two or more workers will run at once.
---

# Split

## Overview

The router _counts_ independent items ("≥3 independent items"). This skill _produces_ them. Nothing else does: `superpowers:writing-plans` decomposes for ordering — one worker walking steps — and `superpowers:dispatching-parallel-agents` assumes the list already exists (three named failing test files). Cutting an unenumerated task into concurrently dispatchable work is dispatch, and dispatch is Legate's.

**Core principle:** A spawn set is a partition, not a wish list. If two concurrent items can write the same path, they are one item.

Concretely, this is what makes `legate:delegate`'s `Scope` fillable. Without a partition the orchestrator invents `OUT` from memory per spawn, and the no-clobber guarantee is a hope.

## An item is not a plan task

Both skills load on the same work. They cut at different sizes, and confusing them is the common failure.

| | Plan task (`superpowers:writing-plans`) | Spawn item (this skill) |
| --- | --- | --- |
| Executed by | one worker, in order | one worker, concurrently with siblings |
| Size | 2–5 minutes, one action | that worker's entire job |
| Boundary test | a reviewer could reject it while approving its neighbor | its writes are disjoint and its outcome is verifiable alone |
| Ends in | a commit | evidence a verifier can check without the siblings |

A 12-step plan is often 3 items. **Never spawn one worker per plan step** — you pay 12 handoffs and 12 verifications for work one contract covers.

## Cut in four moves

1. **Enumerate the outcomes.** Every independently omittable result. If you cannot list them, the extent is unknown → spawn one explorer first and split afterwards. Splitting on a guess produces items that overlap.
2. **Assign writes.** Each outcome gets `OWNS:` — the repo-relative globs that item may modify.
3. **Test disjointness.** Pairwise, `OWNS ∩ OWNS = ∅` across everything dispatched concurrently. `READS` may overlap freely. An `OWNS` overlap is not a warning to note — it is a merge or a sequence, decided now.
4. **Draw dependency edges.** If B consumes A's output or A's interface, B is not in A's wave.

The output is one table:

| id | Objective | OWNS | READS | depends on | role |
| --- | --------- | ---- | ----- | ---------- | ---- |

Each row becomes one `legate:delegate` contract. `Scope OUT` is the union of the other concurrent rows' `OWNS` — **derived from the table, never written from memory.**

## Residue — work rarely cuts clean

The interesting part is what does not partition. Four shapes, four moves:

| Shape | Move |
| ----- | ---- |
| **Shared seam** — items all touch one interface/middleware/schema | **Seam-first.** Cut the seam as item 0, land it, verify it, _then_ fan out. The most common real shape; skipping it is what produces "independent" items that all edit the same file |
| **Shared file, no seam** | Sequence them, or give one item the file and have siblings report the change they need |
| **Unknown extent** | Explorer first, split after. Never split a repo you have not read |
| **N files, one transform** | Not N items. A `sed`-able bulk edit is near-free inline — see the cost gate in `delegate/references/tiers.md`. "Delegating a `sed` is a bug" applies to splitting one, too |

## Width is a verification budget

Every item costs a contract **and** a verification pass, and `legate:verify` puts a full verifier spawn on anything feature-sized, multi-file, or user-facing. N items is therefore ~2N spawns plus a synthesis you have to hold in one context.

- Cap the concurrent wave at what you can verify in one pass. Batch the remainder behind the first wave's verification.
- Width that does not shorten the critical path bought nothing. If one item is 80% of the work, four siblings do not make it finish sooner.
- Splitting past the verification budget produces unverified completions — the exact failure Legate exists to prevent. Narrower and verified beats wider and asserted.

## Anti-patterns

| Split | Why it breaks |
| ----- | ------------- |
| **By layer** — all controllers / all models / all tests | Every item touches every feature; no item is verifiable on its own |
| **By file**, when the file is not the boundary | Items fight over an interface they all import |
| **To look parallel** | Items block on each other. Wall-clock unchanged, spawn count up |
| **One big item + four trivial ones** | False parallelism; the critical path never moved |
| **Past the verification budget** | Completion claims outrun the ability to check them |

## Red flags — STOP

- About to write a second concurrent contract with no partition table
- Filling `Scope OUT` from memory instead of from the `OWNS` column
- Two concurrent items whose `OWNS` share a path
- "They probably won't touch the same files"
- One spawn per plan step
- Splitting before the outcomes can be enumerated

## Rationalizations

| Excuse | Reality |
| ------ | ------- |
| "The workers will coordinate" | They inherit no context and cannot see each other. Coordination happens here or not at all. |
| "The overlap is only one file" | One file is precisely where the clobber happens. |
| "Wider is faster" | Width is paid at verify time; the critical path is set by the largest item. |
| "Splitting is planning — superpowers owns it" | Planning orders work for one worker. This partitions it across many. Different cut, different skill. |
| "I'll adjust scopes as I spawn" | Scopes adjusted per spawn are not a partition, and nothing checks them. |

## Interop

If `unlazy` is installed, an item's `OWNS` line is the same string its `templates/gates-leaf.md` expects — write it once, use it in both. Legate does not require unlazy; the partition stands on its own.
