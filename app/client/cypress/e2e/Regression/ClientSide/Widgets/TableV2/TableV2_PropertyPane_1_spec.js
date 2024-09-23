import {
  entityExplorer,
  table,
  propPane,
  agHelper,
  deployMode,
  draggableWidgets,
  locators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const testdata = require("../../../../../fixtures/testdata.json");
const emptyTableColumnNameData = require("../../../../../fixtures/TableWidgetDatawithEmptyKeys.json");

describe(
  "Table Widget V2 property pane feature validation",
  { tags: ["@tag.Widget", "@tag.Table"] },
  function () {
    before(() => {
      agHelper.AddDsl("tableV2NewDslWithPagination");
    });

    // To be done:
    // Column Data type: Video
    it("1. Verify default array data", function () {
      // Open property pane
      cy.openPropertyPane("tablewidgetv2");
      // Drag and drop table widget
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 300, 200);
      EditorNavigation.SelectEntityByName("Table2", EntityType.Widget);
      // Verify default array data
      cy.get(widgetsPage.tabedataField).should("not.be.empty");
      cy.deleteWidget(widgetsPage.tableWidgetV2);
      cy.wait(2000);
    });

    it("2. Verify empty columnName in data", () => {
      // Drag and drop table widget
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 300, 200);
      table.AddSampleTableData();
      cy.get(widgetsPage.tabedataField).should("not.be.empty");
      cy.get(`${widgetsPage.tabedataField} .CodeMirror`)
        .first()
        .then((ins) => {
          const input = ins[0].CodeMirror;
          input.focus();
          cy.wait(100);
          input.setValue(JSON.stringify(emptyTableColumnNameData));
        });
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.wait(5000);
      cy.get(".t--widget-tablewidgetv2").should("be.visible");
      cy.deleteWidget(widgetsPage.tableWidget);
    });

    it("3. Verify On Row Selected Action", function () {
      // Open property pane
      cy.openPropertyPane("tablewidgetv2");
      // Select show message in the "on selected row" dropdown
      cy.getAlert("onRowSelected", "Row is selected");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");
      // Select 1st row
      table.SelectTableRow(2, 0, true, "v2");
      // Verify Row is selected by showing the message
      agHelper.ValidateToastMessage("Row is selected");
      deployMode.NavigateBacktoEditor();
    });

    it("4. Verify On Search Text Change Action", function () {
      // Open property pane
      cy.openPropertyPane("tablewidgetv2");
      // Show Message on Search text change Action
      cy.getAlert("onSearchTextChanged", "Search Text Changed");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");
      // Change the Search text
      cy.get(widgetsPage.searchField).first().type("Hello");
      // Verify the search text is changed
      agHelper.ValidateToastMessage("Search Text Changed");
      deployMode.NavigateBacktoEditor();
    });

    it("5. Check On Page Change Action", function () {
      // Open property pane
      cy.openPropertyPane("tablewidgetv2");
      cy.get(".t--property-control-serversidepagination input").click({
        force: true,
      });
      // Select show message in the "on selected row" dropdown
      cy.getAlert("onPageChange", "Page Changed");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");
      cy.wait(2000);
      // Change the page
      cy.get(widgetsPage.nextPageButton).click({ force: true });
      // Verify the page is changed
      agHelper.ValidateToastMessage("Page Changed");
      deployMode.NavigateBacktoEditor();
    });

    it("6. Check open section and column data in property pane", function () {
      cy.openPropertyPane("tablewidgetv2");

      // Validate the columns are visible in the property pane
      cy.tableV2ColumnDataValidation("id");
      cy.tableV2ColumnDataValidation("email");
      cy.tableV2ColumnDataValidation("userName");
      cy.tableV2ColumnDataValidation("productName");
      cy.tableV2ColumnDataValidation("orderAmount");

      // Updating the column name ; "id" > "TestUpdated"
      cy.tableV2ColumnPopertyUpdate("id", "TestUpdated");

      // Add new column in the table with name "CustomColumn"
      cy.addColumnV2("CustomColumn");

      cy.tableV2ColumnDataValidation("customColumn1"); //To be updated later

      // Hide all other columns
      cy.hideColumn("email");
      cy.hideColumn("userName");
      cy.hideColumn("productName");
      cy.hideColumn("orderAmount");

      // Verifying the newly added column
      cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
    });

    it("7. Column Detail - Edit column name and validate test for computed value based on column type selected", function () {
      cy.openPropertyPane("tablewidgetv2");
      cy.wait(1000);
      cy.makeColumnVisible("email");
      cy.makeColumnVisible("userName");
      cy.makeColumnVisible("productName");
      cy.makeColumnVisible("orderAmount");
      cy.openPropertyPane("tablewidgetv2");

      // Open column detail to be edited by draggable id
      cy.editColumn("id");
      // Change the column name
      cy.editColName("updatedId");
      // Reading single cell value of the table and verify it's value.
      cy.readTableV2dataPublish("1", "1").then((tabData) => {
        const tabValue = tabData;
        cy.log(tabData);
        expect(tabData).to.not.equal("2736212");
        // Changing the Computed value from "id" to "Email"
        propPane.UpdatePropertyFieldValue(
          "Computed value",
          testdata.currentRowEmail,
        );
        cy.wait(500);
        // Reading single cell value of the table and verify it's value.
        cy.readTableV2dataPublish("1", "0").then((tabData2) => {
          cy.log(tabData2);
          expect(tabData2).to.be.equal(tabValue);
          cy.log("computed value of plain text " + tabData2);
        });
      });

      // Changing Column data type from "Plain text" to "Number"
      cy.changeColumnType("Number");
      cy.readTableV2dataPublish("1", "4").then((tabData) => {
        cy.log(tabData);
        expect(tabData).to.not.equal("lindsay.ferguson@reqres.in");
        // Email to "orderAmount"
        propPane.UpdatePropertyFieldValue(
          "Computed value",
          testdata.currentRowOrderAmt,
        );
        cy.wait(500);
        cy.readTableV2dataPublish("1", "0").then((tabData2) => {
          cy.log(tabData2);
          expect(tabData2).to.be.equal(tabData);
          cy.log("computed value of number is " + tabData2);
        });
      });

      // Changing Column data type from "Number" to "Date"
      cy.changeColumnType("Date");
      // orderAmout to "Moment Date"
      propPane.UpdatePropertyFieldValue("Computed value", testdata.momentDate);
      cy.wait(500);
      cy.readTableV2dataPublish("1", "1").then((tabData) => {
        expect(tabData).to.not.equal("9.99");
        cy.log("computed value of Date is " + tabData);
      });

      // Changing Column data type from "Date" to "Image"
      const imageVal =
        "http://host.docker.internal:4200/453-200x300.jpg";

      cy.changeColumnType("Image");
      // "Moement "date" to "Image"
      propPane.UpdatePropertyFieldValue("Computed value", imageVal);
      cy.wait(500);
      // Verifying the href of the image added.
      cy.readTableV2LinkPublish("1", "0").then((hrefVal) => {
        expect(hrefVal).to.be.contains(imageVal);
      });

      // Changing Column data type from "Date" to "URl"
      cy.readTableV2dataPublish("1", "1").then((actualEmail) => {
        cy.changeColumnType("URL");
        // "Image" to "url"
        propPane.UpdatePropertyFieldValue(
          "Computed value",
          testdata.currentRowEmail,
        );
        cy.wait(500);
        cy.readTableV2dataPublish("1", "0").then((tabData2) => {
          expect(tabData2)
            .to.equal("michael.lawson@reqres.in")
            .to.eq(actualEmail);
          cy.log("computed value of URL is " + tabData2);
        });
      });

      // change column data type to "icon button"
      cy.changeColumnType("Icon button");
      cy.wait(400);
      cy.get(commonlocators.selectedIcon).should("have.text", "add");

      cy.getTableV2DataSelector("0", "0").then((selector) => {
        cy.get(selector + " button.bp3-button [data-icon=add]").should("exist");
      });
    });

    it("8. Test to validate text allignment", function () {
      cy.openPropertyPane("tablewidgetv2");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option").children().contains("URL").click();
      // cy.get(".t--property-control-visible span.bp3-control-indicator").click();
      cy.wait("@updateLayout");
      cy.moveToStyleTab();
      // Verifying Center Alignment
      cy.xpath(widgetsPage.textCenterAlign).first().click({ force: true });
      cy.readTableV2dataValidateCSS(
        "1",
        "0",
        "justify-content",
        "center",
        true,
      );

      // Verifying Right Alignment
      cy.xpath(widgetsPage.rightAlign).first().click({ force: true });
      cy.readTableV2dataValidateCSS(
        "1",
        "0",
        "justify-content",
        "flex-end",
        true,
      );

      // Verifying Left Alignment
      cy.xpath(widgetsPage.leftAlign).first().click({ force: true });
      cy.readTableV2dataValidateCSS(
        "0",
        "0",
        "justify-content",
        "flex-start",
        true,
      );
    });

    it("9. Test to validate text format", function () {
      // Validate Bold text
      cy.get(widgetsPage.bold).click();
      cy.readTableV2dataValidateCSS("1", "0", "font-weight", "700");
      // Validate Italic text
      cy.get(widgetsPage.italics).click();
      cy.readTableV2dataValidateCSS("0", "0", "font-style", "italic");
    });

    it("10. Test to validate vertical allignment", function () {
      // Validate vertical alignemnt of Cell text to TOP
      cy.get(widgetsPage.verticalTop).click({ force: true });
      cy.readTableV2dataValidateCSS(
        "1",
        "0",
        "align-items",
        "flex-start",
        true,
      );
      // Validate vertical alignemnt of Cell text to Center
      cy.get(widgetsPage.verticalCenter).last().click({ force: true });
      cy.readTableV2dataValidateCSS("1", "0", "align-items", "center", true);
      // Validate vertical alignemnt of Cell text to Bottom
      cy.get(widgetsPage.verticalBottom).last().click({ force: true });
      cy.readTableV2dataValidateCSS("0", "0", "align-items", "flex-end", true);
    });
  },
);
