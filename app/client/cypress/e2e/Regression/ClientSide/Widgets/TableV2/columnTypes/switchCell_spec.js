const publishPage = require("../../../../../../locators/publishWidgetspage.json");
const commonLocators = require("../../../../../../locators/commonlocators.json");
import widgetsJson from "../../../../../../locators/Widgets.json";
import {
  agHelper,
  entityExplorer,
  propPane,
  deployMode,
  draggableWidgets,
} from "../../../../../../support/Objects/ObjectsCore";

const tableData = `[
  {
    "step": "#1",
    "task": "Drop a table",
    "status": "✅",
    "action": "",
    "completed": true
  },
  {
    "step": "#2",
    "task": "Create a query fetch_users with the Mock DB",
    "status": "--",
    "action": "",
    "completed": true
  },
  {
    "step": "#3",
    "task": "Bind the query using => fetch_users.data",
    "status": "--",
    "action": "",
  "completed": false
  }
  ]`;

const switchSelector = " .bp3-switch input[type='checkbox']";
describe(
  "Switch column type funtionality test",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
      // turn on filtering for the table - it is disabled by default in this PR(#34593)
      propPane.ExpandIfCollapsedSection("search\\&filters");
      agHelper.GetNClick(".t--property-control-allowfiltering input");
      propPane.EnterJSContext("Table data", tableData);
      cy.editColumn("completed");
      cy.changeColumnType("Switch");
    });

    it("1. Check if the column type switch appears", () => {
      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector + switchSelector).should("exist");
      });
      // Toggle visiblity
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector).should("not.exist");
      });
      deployMode.NavigateBacktoEditor();
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("completed");
      propPane.TogglePropertyState("Visible");
      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector + switchSelector).should("exist");
      });
    });

    it("2. Check the horizontal, vertical alignment of switch, and the cell background color", () => {
      cy.get(".t--propertypane").contains("Style").click({ force: true });
      // Check horizontal alignment
      cy.get(
        ".t--property-control-horizontalalignment .ads-v2-segmented-control__segments-container",
      )
        .eq(1)
        .click();

      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector + " div").should(
          "have.css",
          "justify-content",
          "center",
        );
      });

      // Check vertical alignment
      cy.get(
        ".t--property-control-verticalalignment .ads-v2-segmented-control__segments-container",
      )
        .eq(2)
        .click();

      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector + " div").should("have.css", "align-items", "flex-end");
        // Set and check the cell background color
        propPane.EnterJSContext("Cell Background", "purple");
        cy.wait("@updateLayout");
        cy.get(selector + " div").should(
          "have.css",
          "background-color",
          "rgb(102, 0, 102)",
        );
      });
    });

    it("3. Verify disabled(editable off), enabled states and interactions on switch", () => {
      cy.get(".t--propertypane").contains("Content").click({ force: true });
      cy.getTableV2DataSelector("0", "4").then(($elemClass) => {
        const selector = $elemClass + switchSelector;

        // Verify if switch is disabled when Editable is off
        agHelper.AssertExistingToggleState("Editable", "false");
        cy.get(selector).should("be.disabled");

        // Verify if switch is enabled when Editable is on
        propPane.TogglePropertyState("Editable");
        cy.get(selector).should("be.enabled");

        // Verify checked and unchecked
        cy.get(selector).click({ force: true });
        cy.get(selector).should("not.be.checked");

        cy.get(selector).click({ force: true });
        cy.get(selector).should("be.checked");

        // Check if onCheckChange is availabe when Editable is true and hidden on false
        cy.get(".t--add-action-onChange").should("be.visible");
        propPane.TogglePropertyState("Editable", "Off");
        cy.get(".t--add-action-onChange").should("not.exist");

        // Verify on check change handler
        propPane.TogglePropertyState("Editable");
        propPane.SelectPlatformFunction("onChange", "Show alert");
        agHelper.EnterActionValue("Message", "This is a test message");
        cy.get(selector).click({ force: true }); // unChecked
        cy.wait(100);
        agHelper.ValidateToastMessage("This is a test message");
      });

      cy.getTableV2DataSelector("0", "5").then(($elemClass) => {
        const discardBtnSelector =
          $elemClass + " button[data-test-variant='TERTIARY']";
        cy.get(discardBtnSelector).click({ force: true }); // discard changes
      });
    });

    it("4. Verify filter condition", () => {
      cy.get(widgetsJson.tableFilterPaneToggle).click();
      cy.get(publishPage.attributeDropdown).click();
      cy.get(".t--dropdown-option").contains("completed").click();
      cy.get(widgetsJson.tableFilterRow)
        .find(publishPage.conditionDropdown)
        .click();
      cy.get(".t--dropdown-option").contains("is checked").click();
      cy.get(publishPage.applyFiltersBtn).click();

      // filter and verify checked rows
      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector + switchSelector).should("be.checked");
      });

      cy.getTableV2DataSelector("1", "4").then((selector) => {
        cy.get(selector + switchSelector).should("be.checked");
      });

      // Filter and verify unchecked rows
      cy.get(widgetsJson.tableFilterRow)
        .find(publishPage.conditionDropdown)
        .click();
      cy.get(".t--dropdown-option").contains("is unchecked").click();
      cy.get(publishPage.applyFiltersBtn).click();

      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector + switchSelector).should("not.be.checked");
      });
    });

    it("5. Verify if onChange is hidden on custom columns", () => {
      cy.get(commonLocators.editPropBackButton).click();
      cy.get(widgetsJson.addColumn).click();
      cy.editColumn("customColumn1");
      cy.changeColumnType("Switch");
      propPane.UpdatePropertyFieldValue(
        "Computed value",
        '{{currentRow["completed"]}}',
      );
      cy.get(".t--property-control-onchange").should("not.exist");
    });
  },
);
