const dsl = require("../../../../fixtures/buttondsl.json");
const widgetLocators = require("../../../../locators/Widgets.json");
import * as _ from "../../../../support/Objects/ObjectsCore";
import { WIDGET } from "../../../../locators/WidgetLocators";

describe("Widget error state", function () {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Check widget error state", function () {
    cy.openPropertyPane("buttonwidget");

    cy.get(".t--property-control-visible").find(".t--js-toggle").click();
    cy.EnableAllCodeEditors();

    cy.testJsontext("visible", "Test");

    cy.contains(".t--widget-error-count", 1);

    //Check if the current value is shown in the debugger

    _.debuggerHelper.ClickDebuggerIcon();
    cy.contains(".react-tabs__tab", "Errors").click();
    //This feature is disabled in updated error log - epic 17720
    // _.debuggerHelper.LogStateContains("Test");
  });

  it("2. Switch to error tab when clicked on the debug button", function () {
    cy.get("[data-cy=t--tab-LOGS_TAB]").click();
    cy.get(".t--property-control-onclick").find(".t--js-toggle").click();
    cy.EnableAllCodeEditors();
    cy.testJsontext("onclick", "{{testApi.run()}}");
    cy.get(widgetLocators.buttonWidget).click();

    cy.get(".t--toast-debug-button").click();
    cy.contains(".react-tabs__tab--selected", "Errors");

    // All errors should be expanded by default
    //Updated count to 1 as the decision not to show triggerexecution/uncaughtpromise error in - epic 17720
    _.debuggerHelper.AssertVisibleErrorMessagesCount(1);

    // Recent errors are shown at the top of the list
    cy.testJsontext("label", "{{[]}}");
    //This feature is disabled in updated error log - epic 17720
    // _.debuggerHelper.LogStateContains("text", 0);
  });

  //This feature is disabled in updated error log - epic 17720
  // it("6. Clicking on a message should open the search menu", function() {
  //   _.debuggerHelper.ClickErrorMessage(0);
  //   _.debuggerHelper.AssertContextMenuItemVisible();
  // });

  it("3. Undoing widget deletion should show errors if present + Bug 2760", function () {
    cy.deleteWidget();
    _.debuggerHelper.AssertVisibleErrorMessagesCount(0);
    cy.get("body").type(`{${modifierKey}}z`);
    _.debuggerHelper.AssertVisibleErrorMessagesCount(2);

    //Bug-2760: Error log on a widget property not clearing out when the widget property is deleted
    _.entityExplorer.DragDropWidgetNVerify(WIDGET.TABLE, 150, 300);
    _.entityExplorer.SelectEntityByName("Table1", "Widgets");

    _.table.AddColumn("customColumn1");
    _.propPane.OpenTableColumnSettings("customColumn1");
    _.propPane.UpdatePropertyFieldValue("Computed Value", "{{test}}");

    _.debuggerHelper.AssertDebugError("test is not defined", "", false, false);

    _.table.DeleteColumn("customColumn1");

    _.debuggerHelper.DebuggerListDoesnotContain("test is not defined");
  });
});
