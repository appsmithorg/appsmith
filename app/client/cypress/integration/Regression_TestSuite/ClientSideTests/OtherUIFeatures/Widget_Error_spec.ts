const dsl = require("../../../../fixtures/buttondsl.json");
const widgetLocators = require("../../../../locators/Widgets.json");
import * as _ from "../../../../support/Objects/ObjectsCore";
import { WIDGET } from "../../../../locators/WidgetLocators";

describe("Widget error state", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Check widget error state", function() {
    cy.openPropertyPane("buttonwidget");

    cy.get(".t--property-control-visible")
      .find(".t--js-toggle")
      .click();
    cy.EnableAllCodeEditors();

    cy.testJsontext("visible", "Test");

    cy.contains(".t--widget-error-count", 1);
  });

  it("2. Check if the current value is shown in the debugger", function() {
    _.debuggerHelper.ClickDebuggerIcon();
    cy.contains(".react-tabs__tab", "Errors").click();

    _.debuggerHelper.LogStateContains("Test");
  });

  it("3. Switch to error tab when clicked on the debug button", function() {
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

  it("4. All errors should be expanded by default", function() {
    _.debuggerHelper.AssertVisibleErrorMessagesCount(2);
  });

  it("5. Recent errors are shown at the top of the list", function() {
    cy.testJsontext("label", "{{[]}}");
    _.debuggerHelper.LogStateContains("text", 0);
  });

  it("6. Clicking on a message should open the search menu", function() {
    _.debuggerHelper.ClickErrorMessage(0);
    _.debuggerHelper.AssertContextMenuItemVisible();
  });

  it("7. Undoing widget deletion should show errors if present", function() {
    cy.deleteWidget();
    _.debuggerHelper.AssertVisibleErrorMessagesCount(0);
    cy.get("body").type(`{${modifierKey}}z`);
    _.debuggerHelper.AssertVisibleErrorMessagesCount(2);
  });

  it("8. Bug-2760: Error log on a widget property not clearing out when the widget property is deleted", function() {
    _.ee.DragDropWidgetNVerify(WIDGET.TABLE, 150, 300);
    _.ee.SelectEntityByName("Table1", "Widgets");

    _.table.AddColumn("customColumn1");
    _.table.EditColumn("customColumn1");
    _.propPane.UpdatePropertyFieldValue("Computed Value", "{{test}}");

    _.debuggerHelper.AssertDebugError(
      "The value at primaryColumns.customColumn1.computedValue is invalid",
      "ReferenceError: test is not defined",
      false,
    );

    _.table.DeleteColumn("customColumn1");

    _.debuggerHelper.DebuggerListDoesnotContain(
      "ReferenceError: test is not defined",
    );
  });
});
