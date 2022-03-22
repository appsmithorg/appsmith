const path = require("path");
const Perf = require("../src/perf.js");
const dsl = require("./dsl/simple-typing").dsl;
const {
  delay,
  login,
  getFormattedTime,
  sortObjectKeys,
} = require("../src/utils/utils");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function testTyping() {
  const perf = new Perf();
  await perf.launch();
  const page = perf.getPage();
  await perf.importApplication(`${APP_ROOT}/tests/postgres-test.json`);
  let screenshotPath = `${APP_ROOT}/traces/reports/debug-${getFormattedTime()}.png`;
  await this.page.screenshot({
    path: screenshotPath,
  });
  await delay(5000);
  screenshotPath = `${APP_ROOT}/traces/reports/debug-${getFormattedTime()}.png`;
  await this.page.screenshot({
    path: screenshotPath,
  });
  await page.reload();
  await delay(5000);
  screenshotPath = `${APP_ROOT}/traces/reports/debug-${getFormattedTime()}.png`;
  await this.page.screenshot({
    path: screenshotPath,
  });
  await perf.close();
}

async function runTests() {
  await testTyping();
}
runTests();
