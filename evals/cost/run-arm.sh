#!/usr/bin/env bash
# Run one arm of one cost case as a real headless Claude session and capture
# its token usage. This is the ONLY channel that reports the input/output
# split — subagent task-notifications give a single total_tokens, which cannot
# be priced (input and output differ up to 5x).
#
# Usage:
#   run-arm.sh <ceo-model> <prompt-file> <out-dir>
#
#   ceo-model    : haiku | sonnet | opus | fable   (the session/orchestrator tier)
#   prompt-file  : file whose contents are the verbatim user task
#   out-dir      : where to write result.json + usage.json
#
# The BASELINE arm runs the raw task with no Legate hint. The LEGATE arm runs
# the SAME task in a session where the legate plugin is installed (its router
# fires from SessionStart) — so the only variable is whether Legate is present.
#
# Requires: claude CLI on PATH, jq.
set -euo pipefail

model="${1:?ceo-model}"; prompt_file="${2:?prompt-file}"; out_dir="${3:?out-dir}"
mkdir -p "$out_dir"

case "$model" in
  haiku)  model_id="claude-haiku-4-5" ;;
  sonnet) model_id="claude-sonnet-5" ;;
  opus)   model_id="claude-opus-4-8" ;;
  fable)  model_id="claude-fable-5" ;;
  *) echo "unknown model $model" >&2; exit 2 ;;
esac

echo "[run-arm] $model ($model_id)  <-  $prompt_file" >&2
claude -p "$(cat "$prompt_file")" \
  --model "$model_id" \
  --output-format json \
  --dangerously-skip-permissions \
  > "$out_dir/result.json"

# usage lives on the final result object; shape: .usage.{input_tokens,output_tokens,...}
jq '{
  model: "'"$model"'",
  input_tokens:  (.usage.input_tokens        // 0),
  output_tokens: (.usage.output_tokens        // 0),
  cache_read:    (.usage.cache_read_input_tokens // 0),
  cache_write:   (.usage.cache_creation_input_tokens // 0),
  cost_usd:      (.total_cost_usd             // null),
  duration_ms:   (.duration_ms                // null)
}' "$out_dir/result.json" > "$out_dir/usage.json"

cat "$out_dir/usage.json" >&2
