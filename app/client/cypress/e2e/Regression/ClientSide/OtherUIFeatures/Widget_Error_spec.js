import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const widgetLocators = require("../../../../locators/Widgets.json");
import * as _ from "../../../../support/Objects/ObjectsCore";
import { WIDGET } from "../../../../locators/WidgetLocators";

describe(
  "Widget error state",
  { tags: ["@tag.Widget", "@tag.Binding"] },
  function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

    before(() => {
      _.agHelper.AddDsl("buttondsl");
    });

    it("1. Check widget error state", function () {
      cy.openPropertyPane("buttonwidget");

      cy.get(".t--property-control-visible").find(".t--js-toggle").click();
      cy.EnableAllCodeEditors();

      cy.testJsontext("visible", "Test");

      //Check if the current value is shown in the debugger

      _.debuggerHelper.OpenDebugger();
      cy.get("[data-testid=t--tab-ERROR_TAB]").click();
      //This feature is disabled in updated error log - epic 17720
      // _.debuggerHelper.LogStateContains("Test");
    });

    it("2. Switch to error tab when clicked on the debug button", function () {
      cy.get(".t--property-control-onclick").find(".t--js-toggle").click();
      cy.EnableAllCodeEditors();
      cy.testJsontext("onclick", "{{testApi.run()}}");
      cy.get(widgetLocators.buttonWidget).click();

      cy.get(".t--toast-debug-button").click();
      _.debuggerHelper.AssertSelectedTab("Logs");
      _.debuggerHelper.OpenDebugger();
      // All errors should be expanded by default
      //Updated count to 2 as the decision to show the widget trigger lint errors to show in the debugger
      _.debuggerHelper.AssertVisibleErrorMessagesCount(2);

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
      _.debuggerHelper.AssertVisibleErrorMessagesCount(3);

      //Bug-2760: Error log on a widget property not clearing out when the widget property is deleted
      _.entityExplorer.DragDropWidgetNVerify(WIDGET.TABLE, 150, 300);

      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      _.table.AddSampleTableData();

      _.table.AddColumn("customColumn1");
      _.propPane.OpenTableColumnSettings("customColumn1");
      _.propPane.UpdatePropertyFieldValue("Computed value", "{{test}}");
      _.debuggerHelper.AssertDebugError("test is not defined", "", true, false);

      _.table.DeleteColumn("customColumn1");

      _.debuggerHelper.DebuggerListDoesnotContain("test is not defined");
    });
  },
);
