const { test } = require("node:test");
const assert = require("node:assert");
const { sum, greet } = require("../src/utils");

test("sum adds numbers", () => {
  assert.strictEqual(sum([1, 2, 3]), 6);
});

test("greet formats name", () => {
  assert.strictEqual(greet("legate"), "hello, legate!");
});
