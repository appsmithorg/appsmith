const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import {
  agHelper,
  deployMode,
  locators,
  table,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget property pane feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("tableNewDslWithPagination");
    });

    // To be done:
    // Column Data type: Video

    it("1. Verify On Row Selected Action", function () {
      // Open property pane
      cy.openPropertyPane("tablewidget");
      // Select show message in the "on selected row" dropdown
      cy.getAlert("onRowSelected", "Row is selected");
      deployMode.DeployApp(locators._widgetInDeployed("tablewidget"));
      table.WaitUntilTableLoad(0, 0, "v1");
      // Select 1st row
      table.SelectTableRow(1);
      // Verify Row is selected by showing the message
      agHelper.ValidateToastMessage("Row is selected");
      deployMode.NavigateBacktoEditor();
    });

    it("2. Check On Page Change Action", function () {
      // Open property pane
      cy.openPropertyPane("tablewidget");
      // Select show message in the "on selected row" dropdown
      cy.getAlert("onPageChange", "Page Changed");
      deployMode.DeployApp(locators._widgetInDeployed("tablewidget"));
      table.WaitUntilTableLoad(0, 0, "v1");
      cy.wait(2000);
      // Change the page
      cy.get(widgetsPage.nextPageButton).click({ force: true });
      // Verify the page is changed
      agHelper.ValidateToastMessage("Page Changed");
      deployMode.NavigateBacktoEditor();
    });

    it("3. Verify On Search Text Change Action", function () {
      // Open property pane
      cy.openPropertyPane("tablewidget");
      // Show Message on Search text change Action
      cy.getAlert("onSearchTextChanged", "Search Text Changed");
      deployMode.DeployApp(locators._widgetInDeployed("tablewidget"));
      table.WaitUntilTableLoad(0, 0, "v1");
      // Change the Search text
      cy.get(widgetsPage.searchField).first().type("Hello");
      // Verify the search text is changed
      cy.get(commonlocators.toastmsg).contains("Search Text Changed");
      deployMode.NavigateBacktoEditor();
    });

    it("4. Test to validate text format", function () {
      cy.openPropertyPane("tablewidget");
      cy.editColumn("id");
      // Validate Bold text
      cy.get(widgetsPage.bold).click({ force: true });
      cy.wait(2000);
      cy.reload();
      cy.readTabledataValidateCSS("1", "0", "font-weight", "700");
      // Validate Italic text
      cy.get(widgetsPage.italics).click({ force: true });
      cy.readTabledataValidateCSS("0", "0", "font-style", "italic");
    });

    it("5. Verify default search text", function () {
      // Open property pane
      cy.openPropertyPane("tablewidget");
      cy.backFromPropertyPanel();
      // Chage deat search text value to "data"
      cy.testJsontext("defaultsearchtext", "data");
      deployMode.DeployApp(locators._widgetInDeployed("tablewidget"));
      table.WaitUntilTableLoad(0, 0, "v1");
      // Verify the deaullt search text
      cy.get(widgetsPage.searchField).should("have.value", "data");
      deployMode.NavigateBacktoEditor();
    });

    it("6. Verify default selected row", function () {
      // Open property pane
      cy.openPropertyPane("tablewidget");
      cy.backFromPropertyPanel();
      cy.testJsontext("defaultsearchtext", "");
      // Change default selected row value to 1
      cy.get(widgetsPage.defaultSelectedRowField).type("1");
      cy.wait(2000);
      deployMode.DeployApp(locators._widgetInDeployed("tablewidget"));
      table.WaitUntilTableLoad(0, 0, "v1");
      // Verify the default selected row
      cy.get(widgetsPage.selectedRow).should(
        "have.css",
        "background-color",
        "rgb(227, 223, 251)",
      );
      deployMode.NavigateBacktoEditor();
    });

    it("7. Verify table column type button with button variant", function () {
      // Open property pane
      cy.openPropertyPane("tablewidget");
      // Add new column in the table with name "CustomColumn"
      cy.addColumn("CustomColumn");

      cy.tableColumnDataValidation("customColumn1"); //To be updated later

      cy.editColumn("customColumn1");
      cy.changeColumnType("Button", false);
      // default selected opts
      cy.get(commonlocators.tableButtonVariant + " span span").should(
        "have.text",
        "Primary",
      );
      cy.getTableDataSelector("1", "5").then((selector) => {
        cy.get(selector + " button").should(
          "have.css",
          "background-color",
          "rgb(85, 61, 233)",
        );
        cy.get(selector + " button > span").should(
          "have.css",
          "color",
          "rgb(255, 255, 255)",
        );
      });
      cy.selectDropdownValue(
        commonlocators.tableButtonVariant + " input",
        "Secondary",
      );
      cy.get(commonlocators.tableButtonVariant + " span span").should(
        "have.text",
        "Secondary",
      );
      cy.getTableDataSelector("1", "5").then((selector) => {
        cy.get(selector + " button").should(
          "have.css",
          "background-color",
          "rgba(0, 0, 0, 0)",
        );
        cy.get(selector + " button > span").should(
          "have.css",
          "color",
          "rgb(85, 61, 233)",
        );
        cy.get(selector + " button").should(
          "have.css",
          "border",
          `1px solid rgb(85, 61, 233)`,
        );
      });
      cy.selectDropdownValue(
        commonlocators.tableButtonVariant + " input",
        "Tertiary",
      );
      cy.get(commonlocators.tableButtonVariant + " span span").should(
        "have.text",
        "Tertiary",
      );
      cy.getTableDataSelector("1", "5").then((selector) => {
        cy.get(selector + " button").should(
          "have.css",
          "background-color",
          "rgba(0, 0, 0, 0)",
        );
        cy.get(selector + " button > span").should(
          "have.css",
          "color",
          "rgb(85, 61, 233)",
        );
        cy.get(selector + " button").should(
          "have.css",
          "border",
          "0px none rgb(24, 32, 38)",
        );
      });
      cy.closePropertyPane();
    });
  },
);
