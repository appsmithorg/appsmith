const commonlocators = require("../../../locators/commonlocators.json");
const widgetsPage = require("../../../locators/Widgets.json");
const dsl = require("../../../fixtures/tableNewDsl.json");
const pages = require("../../../locators/Pages.json");
const apiPage = require("../../../locators/ApiEditor.json");
const publishPage = require("../../../locators/publishWidgetspage.json");
const testdata = require("../../../fixtures/testdata.json");

describe("Test Create Api and Bind to Table widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check property pane column names and add column", function() {
    cy.SearchEntityandOpen("Table1");
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("email");
    cy.tableColumnDataValidation("userName");
    cy.tableColumnDataValidation("productName");
    cy.tableColumnDataValidation("orderAmount");
    cy.tableColumnPopertyUpdate("id", "TestUpdated");
    cy.addColumn("CustomColumn");
    cy.tableColumnDataValidation("customColumn1"); //To be updated later
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    cy.hideColumn("orderAmount");
    cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
    cy.get(widgetsPage.defaultColName)
      .invoke("attr", "value")
      .should("contain", "CustomColumn");
  });

  it("Update the computed value for derived column", function() {
    cy.editColumn("customColumn1");
    cy.editColName("UpdatedColName");
    cy.readTabledataPublish("0", "2").then(tabData => {
      const tabValue = tabData;
      expect(tabData).to.not.equal("1");
      cy.updateComputedValue(testdata.currentRowEmail);
      cy.readTabledataPublish("0", "1").then(tabData => {
        expect(tabData).to.be.equal(tabValue);
        cy.log("computed value of plain text " + tabData);
      });
    });
  });

  it("Create an API and Execute the API and bind with Table", function() {
    cy.get(commonlocators.entityExplorersearch).clear();
    cy.wait(500);
    cy.createAndFillApi(this.data.paginationUrl, this.data.paginationParam);
    cy.RunAPI();
  });

  it("Validate Table with API data and then add a column", function() {
    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{Api1.data.users}}");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    cy.wait(1000);
    cy.SearchEntityandOpen("Table1");
    cy.readTabledata("0", "0").then(tabData => {
      const tableData = tabData;
      localStorage.setItem("tableDataPage1", tableData);
    });
    cy.ValidateTableData("1");
  });

  it("Update table json data and check the column names updated", function() {
    cy.SearchEntityandOpen("Table1");
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("customColumn1");
    cy.editColumn("customColumn1");
    cy.wait(500);
    cy.readTabledataPublish("1", "5").then(tabData => {
      const tabValue = tabData;
      //cy.updateComputedValue(testdata.currentRowEmail);
      cy.readTabledataPublish("1", "9").then(tabData => {
        cy.log("computed value of plain text " + tabData);
        expect(tabData).to.be.equal(tabValue);
      });
      cy.closePropertyPane();
    });
  });

  it("Reload page and validate for table data", function() {
    cy.reload();
    cy.SearchEntityandOpen("Table1");
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("name");
    cy.tableColumnDataValidation("status");
    cy.tableColumnDataValidation("gender");
    cy.tableColumnDataValidation("avatar");
    cy.tableColumnDataValidation("email");
    cy.tableColumnDataValidation("address");
    cy.tableColumnDataValidation("createdAt");
    cy.tableColumnDataValidation("updatedAt");
    cy.tableColumnDataValidation("customColumn1");
    cy.get(widgetsPage.defaultColName)
      .invoke("attr", "value")
      .should("contain", "CustomColumn");
    cy.editColumn("customColumn1");
    cy.wait(500);
    cy.readTabledataPublish("1", "5").then(tabData => {
      const tabValue = tabData;
      //cy.updateComputedValue(testdata.currentRowEmail);
      cy.readTabledataPublish("1", "9").then(tabData => {
        cy.log("computed value of plain text " + tabData);
        expect(tabData).to.be.equal(tabValue);
      });
      cy.closePropertyPane();
    });
  });
});
