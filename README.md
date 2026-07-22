# Legate

A lightweight orchestration layer for Claude Code. Legate decides **when to delegate work to a subagent, which role that agent should play, and what the handoff must contain** — then hands verification of the result back to a fresh agent. It is a delegation/verification layer that sits on top of [superpowers](https://github.com/obra/superpowers), which supplies the underlying methodology (planning, TDD, debugging, review).

Legate owns dispatch. Superpowers owns method. Legate never restates superpowers' content; it references it through prose contracts.

## Install

The repo is its own single-plugin marketplace.

From GitHub:

```bash
claude plugin marketplace add wojciech-arch/legate
claude plugin install legate@legate --scope user
```

Legate declares a dependency on superpowers (`^6`, resolved from the `claude-plugins-official` marketplace), so installing Legate resolves and installs superpowers automatically if missing. Restart or `/reload-plugins` to activate.

### Development (local checkout)

```bash
claude plugin marketplace add /path/to/legate
claude plugin install legate@legate --scope user
```

Installs are snapshot copies, not live links — after editing the source, re-sync:

```bash
claude plugin uninstall legate && claude plugin install legate@legate --scope user
```

Note `/reload-plugins` refreshes skills and agents but does not re-fire the SessionStart hook; start a fresh session to get the updated router injection. When installed from GitHub, pull in new commits with `claude plugin marketplace update legate` followed by the reinstall above.

## Roles

Every role is a **tier band** with a per-spawn escalation test (defaults in agent frontmatter, upgrades via spawn-time model override):

| Role        | Band                   | Access              | Job                                                                    |
| ----------- | ---------------------- | ------------------- | ---------------------------------------------------------------------- |
| explorer    | haiku → sonnet         | read-only allowlist | search, map, summarize — conclusions, not transcripts                  |
| implementer | sonnet → opus          | full                | one bounded task per handoff, TDD via superpowers, evidence not claims |
| architect   | opus → fable⚠          | no Write/Edit       | design review — verdict, ranked concerns, alternatives                 |
| verifier    | sonnet ← opus → fable⚠ | no Write/Edit       | fresh-context validation of claimed-complete work, spec-only           |

⚠ fable escalation requires explicit user confirmation per spawn (≈2× opus cost); in-band upgrades never prompt. Escalation tests and model aliases live only in `skills/delegate/references/tiers.md` and agent frontmatter — the two edit points when tiers change.

## Footprint

`claude plugin details legate`: ~423 tokens always-on per session (router + 7 descriptions); skill bodies and agent prompts load only on invocation.

## How it works

A single always-loaded router skill (`skills/orchestrating`) is injected at every session start by a zero-dependency SessionStart hook. The router is a pure dispatcher: it answers three questions (delegate?, which role?, what handoff?) and points at sub-skills for the details:

- `legate:delegate` — the handoff contract for spawning an agent.
- `legate:verify` — validating work an agent claims is complete.

Roles map to agent definitions in `agents/`: explorer, implementer, architect, verifier.

## Design invariants

- **≤10 always-loaded skill descriptions total.** The plugin's standing context budget stays small.
- **Router body ≤1.5 KB.** `skills/orchestrating/SKILL.md` is a dispatcher with zero domain or methodology content.
- **Model names live in exactly two places:** `skills/delegate/references/tiers.md` and the `agents/*.md` frontmatter. They appear nowhere else — never in the router.
- **No enforcement hooks.** The only hook is SessionStart context injection; nothing blocks or gates tool calls.
- **No `commands/` directory.** Behavior is skills and agents, not slash commands.
- **Prose contracts, never duplication.** Legate's skills reference superpowers by name (`REQUIRED SUB-SKILL: ...`); they never copy its content.
