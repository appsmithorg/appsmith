/* eslint-disable cypress/no-unnecessary-waiting */
const dsl = require("../../../../fixtures/basicNumberDataTableDsl.json");

describe("Validate Table Widget Table Data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check number key in table data convert table binding and header properly", function() {
    cy.openPropertyPane("tablewidget");

    // numeric table data
    const tableData = [
      {
        "1": "abc",
        "2": "bcd",
        "3": "cde",
        Dec: "mon",
        demo: "3",
        demo_1: "1",
        "test one": "1",
        "test 3 4 9": "4",
        rowIndex: "0",
      },
      {
        "1": "asd",
        "2": "dfg",
        "3": "jkl",
        Dec: "mon2",
        demo: "2",
        demo_1: "1",
        "test one": "2",
        "test 3 4 9": "3",
        rowIndex: "1",
      },
    ];
    // add data manually
    cy.testJsontext("tabledata", JSON.stringify(tableData));

    cy.contains('[role="columnheader"]', "_1").should("exist");
    cy.contains('[role="columnheader"]', "_2").should("exist");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
