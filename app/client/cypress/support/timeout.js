/// <reference types="cypress" />
/* eslint-disable no-console */

/**
 * Converts seconds to milliseconds
 * @param {number} n Seconds to convert
 */
export const seconds = (n) => n * 1000;

// keep an object with timers for tests where we set
// the timeout to avoid setting multiple timers
global.timers = new Map();

/**
 * Stops the current Cypress test if it takes longer than the provided timeout
 * @param {number} ms Test timeout in milliseconds
 * @example
 *  // stop and fail the test if it runs for longer than 10 seconds
 *  testTimeout(10 * 1000)
 */
export function testTimeout(ms) {
  // get the current test reference using
  // the cy.state() magic method
  const currentTest = cy.state("runnable"); // || test

  if (!currentTest) {
    throw new Error("Could not determine current test");
  }

  if (global.timers.has(currentTest)) {
    console.log("removing existing timer for test", currentTest);
    clearTimeout(global.timers.get(currentTest));
    global.timers.delete(currentTest);
  }

  const startedAt = +new Date();

  const timer = setTimeout(() => {
    const testNow = cy.state("runnable");

    console.log("test started", currentTest);
    console.log("test now", testNow);

    if (currentTest !== testNow) {
      // different test already
      return;
    }

    console.log("test now state", testNow.state);
    if (testNow.state) {
      // test has finished
      return;
    }

    const timeNow = +new Date();

    console.log("elapsed %d limit %d", timeNow - startedAt, ms);
    if (timeNow - startedAt >= ms) {
      throw new Error(`Test ran longer than ${ms}ms`);
    }
  }, ms);

  global.timers.set(currentTest, timer);
}

//export default {testTimeout};
