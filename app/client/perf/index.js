const Perf = require("./perf.js");
const dsl = require("./dsl/simple-typing").dsl;
const { delay } = require("./utils/utils");

// const dsl = require("./dsl/text-widget").dsl;
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function testTyping() {
  // const perf = new Perf({ headless: false, devtools: true });
  const perf = new Perf({});
  await perf.launch();
  const page = perf.getPage();
  await perf.loadDSL(dsl);
  const selector =
    "#comment-overlay-wrapper-d454uqlxd0 > div > div > div > div > div > span > span > div > input";

  await page.waitForSelector(selector);
  const input = await page.$(selector);

  await delay(2000);

  await perf.startTrace("Typing#1");
  perf.startTrace("Typing#2");

  await page.type(selector, "Hello Appsmith");
  await perf.stopTrace();

  await delay(2000);
  await perf.startTrace("Clearing#1");
  await input.click({ clickCount: 3 });
  await input.press("Backspace");
  await perf.stopTrace();

  await delay(2000);

  await perf.startTrace("Typing#3");

  await page.type(selector, "Howdy satish");
  await perf.stopTrace();

  await perf.generateReport();
  await perf.close();
}

async function runTests() {
  await testTyping();
  await testTyping();
  await testTyping();
  await testTyping();
  await testTyping();
}
runTests();
