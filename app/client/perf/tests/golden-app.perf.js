const path = require("path");
const Perf = require("../src/perf.js");
const dsl = require("./dsl/simple-typing").dsl;
const { delay, makeid } = require("../src/utils/utils");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const SEL = {
  category: "div[label=Uncategorized]",
  multiSelect: ".rc-select-selection-search-input",
  table: "#tablejabdu9f16g",
  tableData: ".t--property-control-tabledata textarea",
  tableRow:
    "#tablejabdu9f16g > div.tableWrap > div > div:nth-child(1) > div > div.tbody.no-scroll > div:nth-child(6) > div:nth-child(2)",
  titleInput: ".appsmith_widget_in8e51pg3y  input",
  updateButton:
    "#comment-overlay-wrapper-4gnygu5jew > div > div > div > div > button",
  tableRowCell:
    "#tablejabdu9f16g > div.tableWrap > div > div:nth-child(1) > div > div.tbody.no-scroll > div:nth-child(6) > div:nth-child(2) > div > span > span > span",
  deletePostButton:
    "#tablejabdu9f16g > div.tableWrap > div > div:nth-child(1) > div > div.tbody.no-scroll > div:nth-child(1) > div:nth-child(27) > div > div > button",
  modalTitle: "#reyoxo4oec",
  closeModal:
    "#comment-overlay-wrapper-lryg8kw537 > div > div > div > div > button",
  commentsPageLink: "div[data-guided-tour-iid='Comments']",
  commentsTableTitle: "#urzv99hdc8",
};

async function testTyping() {
  const perf = new Perf();
  await perf.launch();
  const page = perf.getPage();
  // await page.goto(
  //   "https://dev.appsmith.com/applications/61f8d29164802f7676ae8631/pages/61f8d29164802f7676ae8637/edit",
  //   {
  //     waitUntil: "networkidle0",
  //   },
  // );

  await perf.importApplication(`${APP_ROOT}/tests/dsl/blog-admin-app-dev.json`);

  await delay(10000, "for newly created page to settle down");
  // Make the elements of the dropdown render
  await page.waitForSelector(SEL.multiSelect);
  await page.click(SEL.multiSelect);

  await perf.startTrace("Select category");
  await page.waitForSelector(SEL.category);
  await page.click(SEL.category);

  await perf.stopTrace();

  // Focus on the table widget
  await page.waitForSelector(SEL.table);
  await page.click(SEL.table);

  // Profile table Data binding
  await perf.startTrace("Bind table data");
  await page.waitForSelector(SEL.tableData);
  await page.type(SEL.tableData, "{{SelectQuery.data}}");
  await page.waitForSelector(SEL.tableRow);
  await perf.stopTrace();

  // Click on table row
  await perf.startTrace("Click on table #comments");
  await page.click(SEL.tableRow);
  await page.waitForFunction(
    `document.querySelector("${SEL.titleInput}").value.includes("Template: Comments")`,
  );

  await perf.stopTrace();

  // Edit title
  await page.waitForSelector(SEL.titleInput);
  await perf.startTrace("Update title");

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
  await perf.startTrace("Open modal");
  await page.click(SEL.deletePostButton);
  await page.waitForSelector(SEL.modalTitle);
  await perf.stopTrace();

  // Close modal
  await page.waitForSelector(SEL.closeModal);
  await perf.startTrace("Close modal");
  await page.click(SEL.closeModal);
  await delay(3000, "wait after closing modal");
  await perf.stopTrace();

  /* Enable this after the new entity explorer
  // Navigate to a page
  await page.waitForSelector(SEL.commentsPageLink);
  await perf.startTrace("Switch page");
  await page.click(SEL.commentsPageLink);
  await page.waitForSelector(SEL.commentsTableTitle);
  await perf.stopTrace();
*/
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
