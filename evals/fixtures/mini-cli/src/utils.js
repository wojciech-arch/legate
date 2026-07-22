function sum(numbers) {
  return numbers.reduce((acc, n) => acc + n, 0);
}

function greet(name) {
  return `hello, ${name}!`;
}

module.exports = { sum, greet };
