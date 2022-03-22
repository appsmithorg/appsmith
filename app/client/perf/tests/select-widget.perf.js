const path = require("path");
const Perf = require("../src/perf");
const { delay } = require("../src/utils/utils");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const SEL = {
  select_button: ".select-button",
  options_list: ".menu-virtual-list",
};

const actions = {
  OPEN_OPTIONS_MENU: "OPEN_OPTIONS_MENU",
};

async function testSelectOptionsRender() {
  const perf = new Perf();
  await perf.launch();
  const page = perf.getPage();

  perf.importApplication(`${APP_ROOT}/tests/dsl/stress-select-widget.json`);
  await delay(5000, "for newly created page to settle down");

  await page.waitForSelector(SEL.select_button);
  await perf.startTrace(actions.OPEN_OPTIONS_MENU);
  await page.click(SEL.select_button);
  await page.waitForSelector(SEL.options_list);
  await delay(2000, "wait after opening options list");
  await perf.stopTrace();

  await perf.generateReport();
  await perf.close();
}

async function runTests() {
  await testSelectOptionsRender();
}
runTests();
