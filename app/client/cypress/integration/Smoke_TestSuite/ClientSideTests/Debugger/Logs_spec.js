const dsl = require("../../../../fixtures/buttondsl.json");

describe("Debugger logs", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Modifying widget properties should log the same", function() {
    cy.openPropertyPane("buttonwidget");
    cy.testJsontext("label", "Test");

    cy.get(".t--debugger").click();
    cy.get(".t--debugger-log-state").contains("Test");
  });
});
