const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableNewDslWithPagination.json");
const testdata = require("../../../../fixtures/testdata.json");
const emptyTableColumnNameData = require("../../../../fixtures/TableWidgetDatawithEmptyKeys.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  // To be done:
  // Column Data type: Video

  it("Verify default array data", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");
    // Open Widget side bar
    cy.get(widgetsPage.addWidget).click();
    // Drag and drop table widget
    cy.dragAndDropToCanvas("tablewidget", { x: 300, y: 200 });
    // close Widget side bar
    cy.get(widgetsPage.explorerSwitchId).click({ force: true });
    cy.wait(2000);
    cy.SearchEntityandOpen("Table2");
    // Verify default array data
    cy.get(widgetsPage.tabedataField).should("not.be.empty");
    cy.deleteWidget(widgetsPage.tableWidget);
    cy.wait(2000);
    cy.ClearSearch();
  });

  it("Verify empty columnName in data", () => {
    cy.get(widgetsPage.addWidget).click();
    // Drag and drop table widget
    cy.dragAndDropToCanvas("tablewidget", { x: 300, y: 200 });
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
    cy.get(".t--widget-tablewidget").should("be.visible");
    cy.deleteWidget(widgetsPage.tableWidget);
  });

  it("Verify On Row Selected Action", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");
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

  it("Check On Page Change Action", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");
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
  it("Verify On Search Text Change Action", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");
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

  it("Check open section and column data in property pane", function() {
    cy.openPropertyPane("tablewidget");

    // Validate the columns are visible in the property pane
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("email");
    cy.tableColumnDataValidation("userName");
    cy.tableColumnDataValidation("productName");
    cy.tableColumnDataValidation("orderAmount");

    // Updating the column name ; "id" > "TestUpdated"
    cy.tableColumnPopertyUpdate("id", "TestUpdated");

    // Add new column in the table with name "CustomColumn"
    cy.addColumn("CustomColumn");

    cy.tableColumnDataValidation("customColumn1"); //To be updated later

    // Hide all other columns
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    cy.hideColumn("orderAmount");

    // Verifying the newly added column
    cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
  });

  it("Column Detail - Edit column name and validate test for computed value based on column type selected", function() {
    cy.makeColumnVisible("email");
    cy.makeColumnVisible("userName");
    cy.makeColumnVisible("productName");
    cy.makeColumnVisible("orderAmount");

    // Open column detail to be edited by draggable id
    cy.editColumn("id");
    // Change the column name
    cy.editColName("updatedId");
    // Reading single cell value of the table and verify it's value.
    cy.readTabledataPublish("1", "1").then((tabData) => {
      const tabValue = tabData;
      cy.log(tabData);
      expect(tabData).to.not.equal("2736212");
      // Changing the Computed value from "id" to "Email"
      cy.updateComputedValue(testdata.currentRowEmail);
      // Reading single cell value of the table and verify it's value.
      cy.readTabledataPublish("1", "0").then((tabData2) => {
        cy.log(tabData2);
        expect(tabData2).to.be.equal(tabValue);
        cy.log("computed value of plain text " + tabData2);
      });
    });

    // Changing Column data type from "Plain text" to "Number"
    cy.changeColumnType("Number");
    cy.readTabledataPublish("1", "4").then((tabData) => {
      cy.log(tabData);
      expect(tabData).to.not.equal("lindsay.ferguson@reqres.in");
      // Email to "orderAmount"
      cy.updateComputedValue(testdata.currentRowOrderAmt);
      cy.readTabledataPublish("1", "0").then((tabData2) => {
        cy.log(tabData2);
        expect(tabData2).to.be.equal(tabData);
        cy.log("computed value of number is " + tabData2);
      });
    });

    // Changing Column data type from "Number" to "Date"
    cy.changeColumnType("Date");
    // orderAmout to "Moment Date"
    cy.updateComputedValue(testdata.momentDate);
    cy.readTabledataPublish("1", "1").then((tabData) => {
      expect(tabData).to.not.equal("9.99");
      cy.log("computed value of Date is " + tabData);
    });

    // Changing Column data type from "URL" to "Video"
    /* const videoVal = 'https://youtu.be/Sc-m3ceZyfk';
    cy.changeColumnType("Video");
    // "Moement "date" to "Video"
    cy.updateComputedValue(videoVal);
    // cy.testJson  text("computedvalue", videoVal, )
    // Verifying the href of the Video added.
    cy.readTableLinkPublish("1", "1").then((hrefVal) => {
      expect(hrefVal).to.be.equal(videoVal);
    });*/

    // Changing Column data type from "Date" to "Image"
    const imageVal =
      "https://images.pexels.com/photos/736230/pexels-photo-736230.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500";

    cy.changeColumnType("Image");
    // "Moement "date" to "Image"
    cy.updateComputedValue(imageVal);
    // Verifying the href of the image added.
    cy.readTableLinkPublish("1", "0").then((hrefVal) => {
      expect(hrefVal).to.be.contains(imageVal);
    });

    // change column data type to "icon button"
    cy.changeColumnType("Icon Button");
    cy.wait(400);
    cy.get(commonlocators.selectedIcon).should("have.text", "add");

    cy.getTableDataSelector("0", "0").then((selector) => {
      cy.get(selector + " button.bp3-button [data-icon=add]").should("exist");
    });

    // Changing Column data type from "Date" to "URl"
    cy.readTabledataPublish("1", "1").then(() => {
      cy.changeColumnType("URL");
      // "Image" to "url"
      cy.updateComputedValue(testdata.currentRowEmail);
      cy.readTabledataPublish("1", "0").then((tabData2) => {
        expect(tabData2).to.not.equal("lindsay.ferguson@reqres.in");
        cy.log("computed value of URL is " + tabData2);
      });
    });
  });

  it("Test to validate text allignment", function() {
    // Verifying Center Alignment
    cy.get(widgetsPage.centerAlign)
      .first()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "justify-content", "center");

    // Verifying Right Alignment
    cy.get(widgetsPage.rightAlign)
      .first()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-end");

    // Verifying Left Alignment
    cy.get(widgetsPage.leftAlign)
      .first()
      .click({ force: true });
    cy.readTabledataValidateCSS("0", "0", "justify-content", "flex-start");
  });

  it("Test to validate text format", function() {
    // Validate Bold text
    cy.get(widgetsPage.bold).click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "font-weight", "700");
    // Validate Italic text
    cy.get(widgetsPage.italics).click({ force: true });
    cy.readTabledataValidateCSS("0", "0", "font-style", "italic");
  });

  it("Test to validate vertical allignment", function() {
    // Validate vertical alignemnt of Cell text to TOP
    cy.get(widgetsPage.verticalTop).click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "align-items", "flex-start");
    // Validate vertical alignemnt of Cell text to Center
    cy.get(widgetsPage.verticalCenter)
      .last()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "align-items", "center");
    // Validate vertical alignemnt of Cell text to Bottom
    cy.get(widgetsPage.verticalBottom)
      .last()
      .click({ force: true });
    cy.readTabledataValidateCSS("0", "0", "align-items", "flex-end");
  });

  it("Test to validate text color and text background", function() {
    cy.get(widgetsPage.textColor)
      .first()
      .click({ force: true });
    // Changing text color to GREEN and validate
    cy.xpath(widgetsPage.greenColor).click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000);
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS("1", "0", "color", "rgb(3, 179, 101)");
    // Changing text color to PURPLE and validate using JS
    cy.get(widgetsPage.toggleJsColor).click();
    cy.testCodeMirrorLast("purple");
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS("1", "0", "color", "rgb(128, 0, 128)");
    // Changing Cell backgroud color to GREEN and validate
    cy.get(widgetsPage.backgroundColor)
      .first()
      .click({ force: true });
    cy.xpath(widgetsPage.greenColor).click();
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS(
      "1",
      "0",
      "background",
      "rgb(3, 179, 101) none repeat scroll 0% 0% / auto padding-box border-box",
    );
    // Changing Cell backgroud color to PURPLE and validate using JS
    cy.get(widgetsPage.toggleJsBcgColor).click();
    cy.testCodeMirrorLast("purple");
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS(
      "0",
      "0",
      "background",
      "rgb(128, 0, 128) none repeat scroll 0% 0% / auto padding-box border-box",
    );
    // close property pane
    cy.closePropertyPane();
  });

  it("Verify default search text", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");
    // Chage deat search text value to "data"
    cy.testJsontext("defaultsearchtext", "data");
    cy.PublishtheApp();
    // Verify the deaullt search text
    cy.get(widgetsPage.searchField).should("have.value", "data");
    cy.get(publish.backToEditor).click();
  });

  it("Verify default selected row", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("defaultsearchtext", "");
    // Change default selected row value to 1
    cy.get(widgetsPage.defaultSelectedRowField).type("1");
    cy.wait(2000);
    cy.PublishtheApp();
    // Verify the default selected row
    cy.get(widgetsPage.selectedRow).should(
      "have.css",
      "background-color",
      "rgb(236, 249, 243)",
    );
    cy.get(publish.backToEditor).click();
  });

  it("Table-Delete Verification", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");
    // Delete the Table widget
    cy.deleteWidget(widgetsPage.tableWidget);
    cy.PublishtheApp();
    // Verify the Table widget is deleted
    cy.get(widgetsPage.tableWidget).should("not.exist");
  });

  afterEach(() => {
    // put your clean up code if any
    cy.goToEditFromPublish();
  });
});
