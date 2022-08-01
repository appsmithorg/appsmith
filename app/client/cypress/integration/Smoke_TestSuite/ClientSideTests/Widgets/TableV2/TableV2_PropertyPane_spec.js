const ObjectsRegistry = require("../../../../../support/Objects/Registry")
  .ObjectsRegistry;
let propPane = ObjectsRegistry.PropertyPane;
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/tableV2NewDslWithPagination.json");
const testdata = require("../../../../../fixtures/testdata.json");
const emptyTableColumnNameData = require("../../../../../fixtures/TableWidgetDatawithEmptyKeys.json");

describe("Table Widget V2 property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  // To be done:
  // Column Data type: Video

  it("1. Verify default array data", function() {
    // Open property pane
    cy.openPropertyPane("tablewidgetv2");
    // Open Widget side bar
    cy.get(widgetsPage.addWidget).click();
    // Drag and drop table widget
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 300, y: 200 });
    // close Widget side bar
    cy.get(widgetsPage.explorerSwitchId).click({ force: true });
    cy.wait(2000);
    cy.SearchEntityandOpen("Table2");
    // Verify default array data
    cy.get(widgetsPage.tabedataField).should("not.be.empty");
    cy.deleteWidget(widgetsPage.tableWidgetV2);
    cy.wait(2000);
    cy.ClearSearch();
  });

  it("2. Verify empty columnName in data", () => {
    cy.get(widgetsPage.addWidget).click();
    // Drag and drop table widget
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 300, y: 200 });
    // close Widget side bar
    cy.get(widgetsPage.explorerSwitchId).click({ force: true });
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

  it("3. Verify On Row Selected Action", function() {
    // Open property pane
    cy.openPropertyPane("tablewidgetv2");
    // Select show message in the "on selected row" dropdown
    cy.onTableAction(0, "onrowselected", "Row is selected");
    cy.PublishtheApp();
    // Select 1st row
    cy.isSelectRow(2);
    cy.wait(2000);
    // Verify Row is selected by showing the message
    cy.get(commonlocators.toastmsg).contains("Row is selected");
    cy.get(publish.backToEditor).click();
  });

  it("4. Check On Page Change Action", function() {
    // Open property pane
    cy.openPropertyPane("tablewidgetv2");
    // Select show message in the "on selected row" dropdown
    cy.onTableAction(1, "onpagechange", "Page Changed");
    cy.PublishtheApp();
    cy.wait(2000);
    // Change the page
    cy.get(widgetsPage.nextPageButton).click({ force: true });
    // Verify the page is changed
    cy.get(commonlocators.toastmsg).contains("Page Changed");
    cy.get(publish.backToEditor).click();
  });

  it("5. Verify On Search Text Change Action", function() {
    // Open property pane
    cy.openPropertyPane("tablewidgetv2");
    // Show Message on Search text change Action
    cy.onTableAction(3, "onsearchtextchanged", "Search Text Changed");
    cy.PublishtheApp();
    // Change the Search text
    cy.get(widgetsPage.searchField).type("Hello");
    cy.wait(2000);
    // Verify the search text is changed
    cy.get(commonlocators.toastmsg).contains("Search Text Changed");
    cy.get(publish.backToEditor).click();
  });

  it("6. Check open section and column data in property pane", function() {
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

  it("7. Column Detail - Edit column name and validate test for computed value based on column type selected", function() {
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
        "Computed Value",
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
        "Computed Value",
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
    propPane.UpdatePropertyFieldValue("Computed Value", testdata.momentDate);
    cy.wait(500);
    cy.readTableV2dataPublish("1", "1").then((tabData) => {
      expect(tabData).to.not.equal("9.99");
      cy.log("computed value of Date is " + tabData);
    });

    // Changing Column data type from "Date" to "Image"
    const imageVal =
      "https://images.pexels.com/photos/736230/pexels-photo-736230.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500";

    cy.changeColumnType("Image");
    // "Moement "date" to "Image"
    propPane.UpdatePropertyFieldValue("Computed Value", imageVal);
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
        "Computed Value",
        testdata.currentRowEmail,
      );
      cy.wait(500);
      cy.readTableV2dataPublish("1", "0").then((tabData2) => {
        expect(tabData2)
          .to.equal("lindsay.ferguson@reqres.in")
          .to.eq(actualEmail);
        cy.log("computed value of URL is " + tabData2);
      });
    });

    // change column data type to "icon button"
    cy.changeColumnType("Icon Button");
    cy.wait(400);
    cy.get(commonlocators.selectedIcon).should("have.text", "add");

    cy.getTableV2DataSelector("0", "0").then((selector) => {
      cy.get(selector + " button.bp3-button [data-icon=add]").should("exist");
    });
  });

  it("8. Test to validate text allignment", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(commonlocators.changeColType)
      .last()
      .click();
    cy.get(".t--dropdown-option")
      .children()
      .contains("URL")
      .click();
    cy.get(".t--property-control-visible span.bp3-control-indicator").click();
    // Verifying Center Alignment
    cy.get(widgetsPage.centerAlign)
      .first()
      .click({ force: true });
    cy.readTableV2dataValidateCSS("1", "0", "justify-content", "center", true);

    // Verifying Right Alignment
    cy.get(widgetsPage.rightAlign)
      .first()
      .click({ force: true });
    cy.readTableV2dataValidateCSS(
      "1",
      "0",
      "justify-content",
      "flex-end",
      true,
    );

    // Verifying Left Alignment
    cy.get(widgetsPage.leftAlign)
      .first()
      .click({ force: true });
    cy.readTableV2dataValidateCSS(
      "0",
      "0",
      "justify-content",
      "flex-start",
      true,
    );
  });

  it("9. Test to validate text format", function() {
    // Validate Bold text
    cy.get(widgetsPage.bold).click({ force: true });
    cy.readTableV2dataValidateCSS("1", "0", "font-weight", "700");
    // Validate Italic text
    cy.get(widgetsPage.italics).click({ force: true });
    cy.readTableV2dataValidateCSS("0", "0", "font-style", "italic");
  });

  it("10. Test to validate vertical allignment", function() {
    // Validate vertical alignemnt of Cell text to TOP
    cy.get(widgetsPage.verticalTop).click({ force: true });
    cy.readTableV2dataValidateCSS("1", "0", "align-items", "flex-start", true);
    // Validate vertical alignemnt of Cell text to Center
    cy.get(widgetsPage.verticalCenter)
      .last()
      .click({ force: true });
    cy.readTableV2dataValidateCSS("1", "0", "align-items", "center", true);
    // Validate vertical alignemnt of Cell text to Bottom
    cy.get(widgetsPage.verticalBottom)
      .last()
      .click({ force: true });
    cy.readTableV2dataValidateCSS("0", "0", "align-items", "flex-end", true);
  });

  it("Test to validate text color and text background", function() {
    cy.openPropertyPane("tablewidgetv2");

    // Changing text color to rgb(126, 34, 206) and validate
    cy.selectColor("textcolor");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000);
    cy.wait("@updateLayout");
    cy.readTableV2dataValidateCSS("1", "0", "color", "rgb(126, 34, 206)");

    // Changing text color to PURPLE and validate using JS
    cy.get(widgetsPage.toggleJsColor).click();
    cy.testCodeMirrorLast("purple");
    cy.wait("@updateLayout");
    cy.readTableV2dataValidateCSS("1", "0", "color", "rgb(128, 0, 128)");

    // Changing Cell backgroud color to rgb(126, 34, 206) and validate
    cy.selectColor("cellbackground");
    cy.readTableV2dataValidateCSS(
      "0",
      "0",
      "background",
      "rgb(126, 34, 206) none repeat scroll 0% 0% / auto padding-box border-box",
      true,
    );
    // Changing Cell backgroud color to PURPLE and validate using JS
    cy.get(widgetsPage.toggleJsBcgColor).click();
    cy.updateCodeInput(".t--property-control-cellbackground", "purple");
    cy.wait("@updateLayout");
    cy.readTableV2dataValidateCSS(
      "0",
      "0",
      "background",
      "rgb(128, 0, 128) none repeat scroll 0% 0% / auto padding-box border-box",
      true,
    );
    // close property pane
    cy.closePropertyPane();
  });

  it("12. Verify default search text", function() {
    // Open property pane
    cy.openPropertyPane("tablewidgetv2");
    // Chage deat search text value to "data"
    cy.testJsontext("defaultsearchtext", "data");
    cy.PublishtheApp();
    // Verify the deaullt search text
    cy.get(widgetsPage.searchField).should("have.value", "data");
    cy.get(publish.backToEditor).click();
  });
});
