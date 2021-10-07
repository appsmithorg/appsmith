const dsl = require("../../../../fixtures/buttondsl.json");
const debuggerLocators = require("../../../../locators/Debugger.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const widgetLocators = require("../../../../locators/Widgets.json");

describe("Widget error state", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

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

  it("Switch to error tab when clicked on the debug button", function() {
    cy.get("[data-cy=t--tab-LOGS_TAB]").click();
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click();
    cy.testJsontext("onclick", "{{testApi.run()}}");
    cy.get(widgetLocators.buttonWidget).click();

    cy.get(".t--toast-debug-button").click();
    cy.contains(".react-tabs__tab--selected", "Errors");
  });

  it("All errors should be expanded by default", function() {
    cy.get(debuggerLocators.errorMessage)
      .should("be.visible")
      .should("have.length", 2);
  });

  it("Recent errors are shown at the top of the list", function() {
    cy.testJsontext("label", "{{[]}}");
    cy.get(debuggerLocators.debuggerLogState)
      .first()
      .contains("text");
  });

  it("Clicking on a message should open the search menu", function() {
    cy.get(debuggerLocators.errorMessage)
      .first()
      .click();
    cy.get(debuggerLocators.menuItem).should("be.visible");
  });

  it("Undoing widget deletion should show errors if present", function() {
    cy.deleteWidget();
    cy.get(debuggerLocators.errorMessage).should("not.exist");
    cy.get("body").type(`{${modifierKey}}z`);
    cy.get(debuggerLocators.errorMessage)
      .should("be.visible")
      .should("have.length", 2);
  });
});
