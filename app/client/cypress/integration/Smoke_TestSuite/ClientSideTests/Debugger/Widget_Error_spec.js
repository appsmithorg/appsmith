const dsl = require("../../../../fixtures/buttondsl.json");

describe("Widget error state", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Check widget error state", function() {
    cy.openPropertyPane("buttonwidget");

    cy.get(".t--property-control-visible")
      .find(".t--js-toggle")
      .click();
    cy.testJsontext("visible", "Test");

    cy.contains(".t--widget-error-count", 1);
  });
});
