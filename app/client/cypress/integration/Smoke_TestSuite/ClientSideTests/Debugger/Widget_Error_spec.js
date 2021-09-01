const dsl = require("../../../../fixtures/buttondsl.json");
const debuggerLocators = require("../../../../locators/Debugger.json");

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

  it("Check if the current value is shown in the debugger", function() {
    cy.get(debuggerLocators.debuggerIcon).click();
    cy.contains(".react-tabs__tab", "Errors").click();

    cy.get(debuggerLocators.debuggerLogState).contains("Test");
  });

  it("All errors should be expanded by default", function() {
    cy.testJsontext("label", "{{[]}}");

    cy.get(".t--debugger-message")
      .should("be.visible")
      .should("have.length", 2);
  });
});
