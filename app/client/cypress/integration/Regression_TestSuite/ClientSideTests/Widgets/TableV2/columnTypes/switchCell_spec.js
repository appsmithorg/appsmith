import { ObjectsRegistry } from "../../../../../../support/Objects/Registry";
const publishPage = require("../../../../../../locators/publishWidgetspage.json");
const commonLocators = require("../../../../../../locators/commonlocators.json");
import widgetsJson from "../../../../../../locators/Widgets.json";

const propPane = ObjectsRegistry.PropertyPane;
const agHelper = ObjectsRegistry.AggregateHelper;

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
describe("Switch column type funtionality test", () => {
  before(() => {
    cy.dragAndDropToCanvas("tablewidgetv2", {
      x: 150,
      y: 300,
    });
    cy.openPropertyPane("tablewidgetv2");
    propPane.RemoveText("tabledata");
    propPane.UpdatePropertyFieldValue("Table Data", tableData);
    cy.editColumn("completed");
    cy.changeColumnType("Switch");
  });

  it("1. Check if the column type switch appears", () => {
    cy.getTableV2DataSelector("0", "4").then((selector) => {
      cy.get(selector + switchSelector).should("exist");
    });
  });

  it("2. Toggle visiblity", () => {
    propPane.ToggleOnOrOff("Visible", "off");
    cy.PublishtheApp();
    cy.getTableV2DataSelector("0", "4").then((selector) => {
      cy.get(selector).should("not.exist");
    });
    cy.get(publishPage.backToEditor).click();

    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("completed");
    propPane.ToggleOnOrOff("Visible");
    cy.getTableV2DataSelector("0", "4").then((selector) => {
      cy.get(selector + switchSelector).should("exist");
    });
  });

  it("3. Check the horizontal, vertical alignment of switch, and the cell background color", () => {
    cy.get(".t--propertypane").contains("STYLE").click({ force: true });
    // Check horizontal alignment
    cy.get(".t--property-control-horizontalalignment .t--button-group-CENTER")
      .first()
      .click();

    cy.getTableV2DataSelector("0", "4").then((selector) => {
      cy.get(selector + " div").should("have.css", "justify-content", "center");
    });

    // Check vertical alignment
    cy.get(".t--property-control-verticalalignment .t--button-group-BOTTOM")
      .first()
      .click();

    cy.getTableV2DataSelector("0", "4").then((selector) => {
      cy.get(selector + " div").should("have.css", "align-items", "flex-end");
      // Set and check the cell background color
      cy.get(widgetsJson.toggleJsBcgColor).click();
      cy.updateCodeInput(".t--property-control-cellbackground", "purple");
      cy.wait("@updateLayout");
      cy.get(selector + " div").should(
        "have.css",
        "background-color",
        "rgb(102, 0, 102)",
      );
    });
  });

  it("4. Verify disabled(editable off), enabled states and interactions on switch", () => {
    cy.get(".t--propertypane").contains("CONTENT").click({ force: true });
    cy.getTableV2DataSelector("0", "4").then(($elemClass) => {
      const selector = $elemClass + switchSelector;

      // Verify if switch is disabled when Editable is off
      propPane.ToggleOnOrOff("Editable", "off");
      cy.get(selector).should("be.disabled");

      // Verify if switch is enabled when Editable is on
      propPane.ToggleOnOrOff("Editable");
      cy.get(selector).should("be.enabled");

      // Verify checked and unchecked
      cy.get(selector).click({ force: true });
      cy.get(selector).should("not.be.checked");

      cy.get(selector).click({ force: true });
      cy.get(selector).should("be.checked");

      // Check if onCheckChange is availabe when Editable is true and hidden on false
      cy.get(".t--property-control-onchange").should("be.visible");
      propPane.ToggleOnOrOff("Editable", "off");
      cy.get(".t--property-control-onchange").should("not.exist");

      // Verify on check change handler
      propPane.ToggleOnOrOff("Editable");
      propPane.SelectPropertiesDropDown("onchange", "Show message");
      agHelper.EnterActionValue("Message", "This is a test message");
      cy.get(selector).click({ force: true }); // unChecked
      cy.wait(100);
      cy.get(".t--toast-action")
        .contains("This is a test message")
        .should("be.visible");
    });
  });

  it("5. Verify filter condition", () => {
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

    // Filter and verify unchecked rows
    cy.get(widgetsJson.tableFilterRow)
      .find(publishPage.conditionDropdown)
      .click();
    cy.get(".t--dropdown-option").contains("is unchecked").click();
    cy.get(publishPage.applyFiltersBtn).click();

    cy.getTableV2DataSelector("0", "4").then((selector) => {
      cy.get(selector + switchSelector).should("not.be.checked");
    });
    cy.getTableV2DataSelector("1", "4").then((selector) => {
      cy.get(selector + switchSelector).should("not.be.checked");
    });
  });

  it("6. Verify if onChange is hidden on custom columns", () => {
    cy.get(commonLocators.editPropBackButton).click();
    cy.get(widgetsJson.addColumn).click();
    cy.editColumn("customColumn1");
    cy.changeColumnType("Switch");
    propPane.UpdatePropertyFieldValue(
      "Computed Value",
      '{{currentRow["completed"]}}',
    );
    cy.get(".t--property-control-onchange").should("not.exist");
  });
});
