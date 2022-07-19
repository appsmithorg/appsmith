const path = require("path");
const Perf = require("../src/perf.js");
const dsl = require("./dsl/simple-typing").dsl;
const { actions } = require("./actions");
const { delay, makeid } = require("../src/utils/utils");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const SEL = {
  category: "div.rc-select-item[title=Uncategorized]",
  multiSelect: ".rc-select",
  table: "#tablejabdu9f16g",
  tableData: ".t--property-control-tabledata textarea",
  tableRow:
    "#tablejabdu9f16g > div.tableWrap > div > div:nth-child(1) > div > div.tbody.no-scroll > div:nth-child(6) > div:nth-child(2)",
  titleInput: ".appsmith_widget_armli8hauj  input",
  updateButton:
    "#comment-overlay-wrapper-4gnygu5jew > div > div > div > div > button",
  tableRowCell:
    "#tablejabdu9f16g > div.tableWrap > div > div:nth-child(1) > div > div.tbody.no-scroll > div:nth-child(6) > div:nth-child(2) > div > span > span > span",
  deletePostButton:
    "#tablejabdu9f16g > div.tableWrap > div > div:nth-child(1) > div > div.tbody.no-scroll > div:nth-child(1) > div:last-child > div > div > button",
  modalTitle: "#reyoxo4oec",
  closeModal:
    "#comment-overlay-wrapper-lryg8kw537 > div > div > div > div > button",
  commentsPageLink: "div[data-guided-tour-iid='Comments']",
  commentsTableTitle: "#urzv99hdc8",
};

async function testGoldenApp(iteration) {
  const perf = new Perf({ iteration });
  try {
    await perf.launch();
    const page = perf.getPage();

    await perf.importApplication(
      `${APP_ROOT}/tests/dsl/blog-admin-app-postgres.json`,
    );

    await delay(5000, "for newly created page to settle down");
    // Make the elements of the dropdown render
    await page.waitForSelector(SEL.multiSelect);
    await page.click(SEL.multiSelect);

    await perf.startTrace(actions.SELECT_CATEGORY);
    await page.waitForSelector(SEL.category);
    await page.click(SEL.category);

    await perf.stopTrace();

    // Focus on the table widget
    await page.waitForSelector(SEL.table);

    // Not sure why it needs two clicks to focus
    await page.click(SEL.table);
    await page.click(SEL.table);

    // Profile table Data binding
    await perf.startTrace(actions.BIND_TABLE_DATA);
    await page.waitForSelector(SEL.tableData);
    await page.type(SEL.tableData, "{{SelectQuery.data}}");
    await page.waitForSelector(SEL.tableRow);
    await perf.stopTrace();

    // Click on table row
    await perf.startTrace(actions.CLICK_ON_TABLE_ROW);
    await page.click(SEL.tableRow);
    await page.waitForFunction(
      `document.querySelector("${SEL.titleInput}").value.includes("Template: Comments")`,
    );

    await perf.stopTrace();

    // Edit title
    await page.waitForSelector(SEL.titleInput);
    await perf.startTrace(actions.UPDATE_POST_TITLE);

    const randomString = makeid();
    await page.type(SEL.titleInput, randomString);
    await delay(5000, "For the evaluations to comeback?");

    await page.waitForSelector(SEL.updateButton);
    await page.click(SEL.updateButton);
    // When the row is updated, selected row changes.
    // await page.waitForSelector(SEL.tableRowCell);
    await page.waitForFunction(
      `document.querySelector("${SEL.table}").textContent.includes("${randomString}")`,
    );
    await perf.stopTrace();

    // Open modal
    await page.waitForSelector(SEL.deletePostButton);
    await perf.startTrace(actions.OPEN_MODAL);
    await page.click(SEL.deletePostButton);
    await page.waitForSelector(SEL.modalTitle);
    await perf.stopTrace();

    // Close modal
    await page.waitForSelector(SEL.closeModal);
    await perf.startTrace(actions.CLOSE_MODAL);
    await page.click(SEL.closeModal);
    await delay(3000, "wait after closing modal");
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
    await testGoldenApp(i + 1);
  }
}

runTests();
