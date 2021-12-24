const path = require("path");
const Perf = require("./perf.js");
var fs = require("fs");
const app = require("./dsl/ImportTest.json");
const { summaries } = require("./summary");
const { delay } = require("./utils/utils");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
global.APP_ROOT = path.resolve(__dirname);

async function importApplication() {
  const perf = new Perf({
    ignoreHTTPSErrors: true, // @todo Remove it after initial testing
    headless: false,
    // devtools: true,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  await perf.launch();
  const page = perf.getPage();
  await perf.importApplication(app);
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
  //   await importApplication();
  //   await importApplication();
  //   await importApplication();
  //   await importApplication();
  //   await importApplication();
  //   await importApplication();
  //   await importApplication();
  //   await importApplication();
  //   await importApplication();
  summaries(`${APP_ROOT}/traces/reports`);
}
runTests();
