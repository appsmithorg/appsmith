const path = require("path");
const Perf = require("../src/perf.js");
var fs = require("fs");
const { delay } = require("../src/utils/utils");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function importApplication() {
  const perf = new Perf();

  await perf.launch();
  const page = perf.getPage();
  await perf.importApplication(`${APP_ROOT}/tests/dsl/ImportTest.json`);
  await page.waitForSelector("#tablezjf167vmt5 div.tr:nth-child(4)");
  await perf.startTrace("Click on table row");
  await page.click("#tablezjf167vmt5 div.tr:nth-child(4)");
  await delay(3000);
  await perf.stopTrace();
  await perf.generateReport();

  perf.close();
}
async function runTests() {
  await importApplication();
  await importApplication();
  await importApplication();
  await importApplication();
  await importApplication();
}
runTests();
