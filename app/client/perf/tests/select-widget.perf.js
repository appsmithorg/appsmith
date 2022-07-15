const path = require("path");
const Perf = require("../src/perf");
const { delay } = require("../src/utils/utils");
const { actions } = require("./actions");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const SEL = {
  select_button: ".select-button",
  options_list: ".menu-virtual-list",
  first_option_item: ".menu-item-text:nth-child(1)",
};

async function testSelectOptionsRender(iteration) {
  const perf = new Perf({ iteration });
  try {
    await perf.launch();
    const page = perf.getPage();

    perf.importApplication(`${APP_ROOT}/tests/dsl/stress-select-widget.json`);
    await delay(5000, "for newly created page to settle down");

    await page.waitForSelector(SEL.select_button);
    await perf.startTrace(actions.SELECT_WIDGET_MENU_OPEN);
    await page.click(SEL.select_button);
    await page.waitForSelector(SEL.options_list);
    await delay(2000, "wait after opening options list");
    await perf.stopTrace();

    await perf.startTrace(actions.SELECT_WIDGET_SELECT_OPTION);
    await page.click(SEL.first_option_item);
    await delay(2000, "wait after selecting option item");
    await perf.stopTrace();

    await perf.generateReport();
    await perf.close();
  } catch (e) {
    await perf.handleRejections(e);
    await perf.close();
  }
}

async function runTests() {
  for (let i = 0; i < 5; i++) {
    await testSelectOptionsRender(i + 1);
  }
}

runTests();
