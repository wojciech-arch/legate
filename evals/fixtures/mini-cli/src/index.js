#!/usr/bin/env node
const { sum, greet } = require("./utils");

const [, , cmd, ...args] = process.argv;

switch (cmd) {
  case "greet":
    console.log(greet(args[0] || "world"));
    break;
  case "sum":
    console.log(sum(args.map(Number)));
    break;
  default:
    console.error(`unknown command: ${cmd || "(none)"}`);
    console.error("usage: mini <greet|sum> [args...]");
    process.exit(1);
}
