import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dsl = require("../../../../fixtures/buttondsl.json");
const widgetLocators = require("../../../../locators/Widgets.json");

const { DebuggerHelper: debuggerHelper } = ObjectsRegistry;

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
    cy.EnableAllCodeEditors();

    cy.testJsontext("visible", "Test");

    cy.contains(".t--widget-error-count", 1);
  });

  it("Check if the current value is shown in the debugger", function() {
    debuggerHelper.ClickDebuggerIcon();
    cy.contains(".react-tabs__tab", "Errors").click();

    debuggerHelper.LogStateContains("Test");
  });

  it("Switch to error tab when clicked on the debug button", function() {
    cy.get("[data-cy=t--tab-LOGS_TAB]").click();
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click();
    cy.EnableAllCodeEditors();
    cy.testJsontext("onclick", "{{testApi.run()}}");
    cy.get(widgetLocators.buttonWidget).click();

    cy.get(".t--toast-debug-button").click();
    cy.contains(".react-tabs__tab--selected", "Errors");
  });

  it("All errors should be expanded by default", function() {
    debuggerHelper.AssertVisibleErrorMessagesCount(2);
  });

  it("Recent errors are shown at the top of the list", function() {
    cy.testJsontext("label", "{{[]}}");
    debuggerHelper.LogStateContains("text", 0);
  });

  it("Clicking on a message should open the search menu", function() {
    debuggerHelper.ClickErrorMessage(0);
    debuggerHelper.AssertContextMenuItemVisible();
  });

  it("Undoing widget deletion should show errors if present", function() {
    cy.deleteWidget();
    debuggerHelper.AssertVisibleErrorMessagesCount(0);
    cy.get("body").type(`{${modifierKey}}z`);
    debuggerHelper.AssertVisibleErrorMessagesCount(2);
  });
});
