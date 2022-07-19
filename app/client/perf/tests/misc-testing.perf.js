const path = require("path");
const Perf = require("../src/perf.js");
const dsl = require("./dsl/misc-testing").dsl;
const { delay } = require("../src/utils/utils");

const { actions } = require("./actions");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const SEL = {
  selectDropDownIcon: "#c4hsqszxvr button[data-testid='selectbutton.btn.main']",
  selectOption:
    ".select-popover-width-c4hsqszxvr div.menu-virtual-list > div > div:nth-child(7) > div > a",
  selectedOptionDisplay: "#yio3onqr9p span",
  echoInput: "#y9prfvceab  input",
  echoOut: "#xa9g7nk5l3   span",
  table: "#tablepc6vslrdu5 .tableWrap",
  propertyPaneTitle: ".t--propertypane .t--property-pane-title span",
  tableRow:
    "#tablepc6vslrdu5 > div.tableWrap > div > div:nth-child(1) > div > div.tbody > div:nth-child(4)",
  jsonFormInput: "#egzzsuvccp input:first-child",
  openSimpleModal:
    "#tablepc6vslrdu5 div.tr:nth-child(4) > div.td:nth-last-child(2)  button",
  simpleModalTitle: "#dzliou197n   span",
  closeSimpleModal: "#sespsf2ia   button",
  openComplexModal:
    "#tablepc6vslrdu5 div.tr:nth-child(4) > div.td:last-child  button",
  complexModalTitle: "#t1l4cq0j3n   span",
  closeComplexModal: "#gebuyo8nrs   button",
};
async function sampleTest(iteration) {
  const perf = new Perf({ iteration });
  try {
    await perf.launch();

    const page = perf.getPage();
    await perf.importApplication(`${APP_ROOT}/tests/dsl/misc-testing.json`);
    await delay(5000, "for newly created page to settle down");

    // Open select options
    await perf.startTrace(actions.MISC_OPEN_SELECT_WIDGET);
    await page.waitForSelector(SEL.selectDropDownIcon);
    await page.click(SEL.selectDropDownIcon);
    await perf.stopTrace();

    // Select option
    await perf.startTrace(actions.MISC_SELECT_OPTION);
    await page.waitForSelector(SEL.selectOption);
    await page.click(SEL.selectOption);
    await page.waitForFunction(
      `document.querySelector("${SEL.selectedOptionDisplay}").textContent !== ''`,
    );
    await perf.stopTrace();

    // Echo
    await perf.startTrace(actions.MISC_ECHO);
    await page.waitForSelector(SEL.echoInput);
    await page.type(SEL.echoInput, "Hello Appsmith");
    await page.waitForFunction(
      `document.querySelector("${SEL.echoOut}").textContent === 'Hello Appsmith'`,
    );
    await perf.stopTrace();

    // Select table
    await perf.startTrace(actions.SELECT_TABLE);
    await page.waitForSelector(SEL.table);
    await page.click(SEL.table);
    await page.waitForFunction(
      `document.querySelector("${SEL.propertyPaneTitle}").textContent === 'Table1'`,
    );
    await perf.stopTrace();

    // Select table row
    await perf.startTrace(actions.MISC_CLICK_TABLE_ROW);
    await page.waitForSelector(SEL.tableRow);
    await page.click(SEL.tableRow);
    await page.waitForFunction(
      `document.querySelector("${SEL.jsonFormInput}").value !==''`,
    );
    await perf.stopTrace();

    // Open simple modal
    await perf.startTrace(actions.MISC_OPEN_SIMPLE_MODAL);
    await page.waitForSelector(SEL.openSimpleModal);
    await page.click(SEL.openSimpleModal);
    await delay(2000, "wait for modal");
    await page.waitForSelector(SEL.simpleModalTitle);
    // await page.waitForFunction(
    //   `document.querySelector("${SEL.simpleModalTitle}").textContent === 'Simple modal'`,
    // );
    await perf.stopTrace();

    // Close simple modal
    await perf.startTrace(actions.MISC_CLOSE_SIMPLE_MODAL);
    await page.waitForSelector(SEL.closeSimpleModal);
    await page.click(SEL.closeSimpleModal);
    await perf.stopTrace();

    // Open complex modal
    await perf.startTrace(actions.MISC_OPEN_COMPLEX_MODAL);
    await page.waitForSelector(SEL.openComplexModal);
    await page.click(SEL.openComplexModal);
    await delay(2000, "wait for modal");
    await page.waitForSelector(SEL.complexModalTitle);
    // await page.waitForFunction(
    //   `document.querySelector("${SEL.complexModalTitle}").textContent === 'Complex modal'`,
    // );
    await perf.stopTrace();

    // Close complex modal
    await perf.startTrace(actions.MISC_CLOSE_COMPLEX_MODAL);
    await page.waitForSelector(SEL.closeComplexModal);
    await page.click(SEL.closeComplexModal);
    await perf.stopTrace();

    await perf.generateReport();
    await perf.close();
  } catch (e) {
    await perf.handleRejections(e);
    return;
  }
}

async function runTests() {
  for (let i = 0; i < 5; i++) {
    await sampleTest(i + 1);
  }
}

runTests();
