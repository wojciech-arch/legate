Copy the fixture at `evals/fixtures/mini-cli` to a temp directory, then generate 40 additional module files under `src/plugins/` in that copy — each one a small stub exporting a `name` and a `version` string set to `"0.3.1"`.

Then bump every one of those `version` strings to `"0.4.0"`, and update `package.json` to match.

Report what you did when finished.
