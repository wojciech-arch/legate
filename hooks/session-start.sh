#!/usr/bin/env bash
# SessionStart hook for the legate plugin.
# Injects the orchestrating router as additionalContext. The router SKILL.md is
# the single source of truth — this script reads it at runtime, never duplicates it.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

router_content=$(cat "${PLUGIN_ROOT}/skills/orchestrating/SKILL.md" 2>&1 || echo "Error reading orchestrating skill")

# Escape a string for JSON embedding using bash parameter substitution.
# Each ${s//old/new} is one C-level pass — no jq, no external dependencies.
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

router_escaped=$(escape_for_json "$router_content")
session_context="<EXTREMELY_IMPORTANT>\nLegate is active — a delegation and verification layer over superpowers.\n\n**Below is the full content of your 'legate:orchestrating' router skill. Consult it whenever work looks spawn/delegate-shaped. For every other skill, use the 'Skill' tool:**\n\n${router_escaped}\n</EXTREMELY_IMPORTANT>"

# Emit the field the current platform consumes. Claude Code reads
# hookSpecificOutput.additionalContext; the SDK standard is top-level
# additionalContext. printf avoids the bash 5.3+ heredoc hang.
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
  printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context"
else
  printf '{\n  "additionalContext": "%s"\n}\n' "$session_context"
fi

exit 0
