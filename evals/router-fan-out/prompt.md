I'm new to this `mini-cli` codebase and need a module-by-module map before I start
working on it.

For every source and test module in the project, document:

- **Purpose** — what the module is responsible for, in one or two sentences.
- **Entry points** — the functions it exports and/or the commands or code paths that
  invoke it.
- **Dependencies** — what the module requires (imports), and what other modules
  depend on it.

Cover each module independently, then give me a short synthesis of how the pieces fit
together. I don't need file contents pasted back — just the map and the conclusions.
