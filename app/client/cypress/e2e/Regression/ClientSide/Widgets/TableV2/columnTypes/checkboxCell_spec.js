import * as _ from "../../../../../../support/Objects/ObjectsCore";
const publishPage = require("../../../../../../locators/publishWidgetspage.json");
const commonLocators = require("../../../../../../locators/commonlocators.json");
import widgetsJson from "../../../../../../locators/Widgets.json";

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

const checkboxSelector = " .bp3-checkbox input[type='checkbox']";
describe(
  "Checkbox column type funtionality test",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  () => {
    before(() => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE);
      // turn on filtering for the table - it is disabled by default in this PR(#34593)
      _.propPane.ExpandIfCollapsedSection("search\\&filters");
      _.agHelper.GetNClick(".t--property-control-allowfiltering input");
      _.propPane.EnterJSContext("Table data", tableData);
      cy.editColumn("completed");
      cy.changeColumnType("Checkbox");
    });

    it("1. Check if the column type checkbox appears", () => {
      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector + checkboxSelector).should("exist");
      });
      // Toggle visiblity
      _.propPane.TogglePropertyState("Visible", "off");
      _.deployMode.DeployApp();
      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector).should("not.exist");
      });
      _.deployMode.NavigateBacktoEditor();
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("completed");
      _.propPane.TogglePropertyState("Visible");
      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector + checkboxSelector).should("exist");
      });
    });

    it("2. Check the horizontal, vertical alignment of checkbox, and the cell background color", () => {
      cy.moveToStyleTab();
      // Check horizontal alignment
      cy.get("[data-value='CENTER']").first().click();

      function verifyJustifyContent(selector) {
        return cy
          .get(selector + " div")
          .should("have.css", "justify-content", "center");
      }

      function verifyWidthAuto($el) {
        // Ensure the width is 'auto' by checking it doesn't have an explicit value
        expect($el[0].style.width).to.be.empty;
      }
      cy.getTableV2DataSelector("0", "4")
        .then((selector) => {
          verifyJustifyContent(selector);
          return cy.get(`${selector} div`).children().first();
        })
        .then(($el) => {
          verifyWidthAuto($el);
        });

      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector + " div").should(
          "have.css",
          "justify-content",
          "center",
        );
      });

      // Check vertical alignment
      cy.get("[data-value='BOTTOM']").first().click();

      cy.getTableV2DataSelector("0", "4").then((selector) => {
        cy.get(selector + " div").should("have.css", "align-items", "flex-end");
        // Set and check the cell background color
        cy.get(widgetsJson.toggleJsBcgColor).click({ force: true });
        cy.updateCodeInput(".t--property-control-cellbackground", "purple");
        cy.wait("@updateLayout");
        cy.get(selector + " div").should(
          "have.css",
          "background-color",
          "rgb(102, 0, 102)",
        );
      });
    });

    it("3. Verify disabled(editable off), enabled states and interactions on checkbox", () => {
      cy.moveToContentTab();
      cy.getTableV2DataSelector("0", "4").then(($elemClass) => {
        const selector = $elemClass + checkboxSelector;

        // Verify if checkbox is disabled when Editable is off
        _.agHelper.AssertExistingToggleState("Editable", "false");
        cy.get(selector).should("be.disabled");

        // Verify if checkbox is enabled when Editable is on
        _.propPane.TogglePropertyState("Editable");
        cy.get(selector).should("be.enabled");

        // Verify checked and unchecked
        cy.get(selector).click({ force: true });
        cy.get(selector).should("not.be.checked");

        cy.get(selector).click({ force: true });
        cy.get(selector).should("be.checked");

        // Check if onCheckChange is availabe when Editable is true and hidden on false
        cy.get(".t--add-action-onCheckChange").should("be.visible");
        _.propPane.TogglePropertyState("Editable", "off");
        cy.get(".t--add-action-onCheckChange").should("not.exist");

        // Verify on check change handler
        _.propPane.TogglePropertyState("Editable");
        _.propPane.SelectPlatformFunction("onCheckChange", "Show alert");
        _.agHelper.EnterActionValue("Message", "This is a test message");
        cy.get(selector).click({ force: true }); // unChecked
        cy.wait(100);
        cy.get("div.Toastify__toast")
          .contains("This is a test message")
          .should("be.visible");
      });
      _.agHelper.ClickButton("Discard", { index: 0 }); // discard changes
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
        _.agHelper.AssertExistingCheckedState(
          selector + checkboxSelector,
          "true",
        );
      });

      cy.getTableV2DataSelector("1", "4").then((selector) => {
        _.agHelper.AssertExistingCheckedState(
          selector + checkboxSelector,
          "true",
        );
      });

      // Filter and verify unchecked rows
      cy.get(widgetsJson.tableFilterRow)
        .find(publishPage.conditionDropdown)
        .click();
      cy.get(".t--dropdown-option").contains("is unchecked").click();
      cy.get(publishPage.applyFiltersBtn).click();

      cy.getTableV2DataSelector("0", "4").then((selector) => {
        _.agHelper.AssertExistingCheckedState(
          selector + checkboxSelector,
          "false",
        );
      });
    });

    it("5. Verify if onCheckChange is hidden on custom columns", () => {
      cy.get(commonLocators.editPropBackButton).click();
      cy.get(widgetsJson.addColumn).click();
      cy.editColumn("customColumn1");
      cy.changeColumnType("Checkbox");
      _.propPane.UpdatePropertyFieldValue(
        "Computed value",
        '{{currentRow["completed"]}}',
      );
      cy.get(".t--property-control-oncheckchange").should("not.exist");
    });
  },
);
