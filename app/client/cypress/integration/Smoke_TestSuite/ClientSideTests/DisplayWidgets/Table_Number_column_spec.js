/* eslint-disable cypress/no-unnecessary-waiting */
const dsl = require("../../../../fixtures/basicNumberDataTableDsl.json");

describe("Validate Table Widget Table Data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check number key in table data convert table binding and header properly", function() {
    cy.openPropertyPane("tablewidget");

    cy.contains('[role="columnheader"]', "_1").should("exist");
    cy.contains('[role="columnheader"]', "_2").should("exist");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
