/* eslint-disable cypress/no-unnecessary-waiting */
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/tableTextPaginationDsl.json");
const apiPage = require("../../../../locators/ApiEditor.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const pages = require("../../../../locators/Pages.json");

describe("Test Create Api and Bind to Table widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Create an API and Execute the API and bind with Table", function() {
    // Create and execute an API and bind with table
    cy.createAndFillApi(this.data.paginationUrl, this.data.paginationParam);
    cy.RunAPI();
  });

  it("Validate Table with API data and then add a column", function() {
    // Open property pane
    cy.SearchEntityandOpen("Table1");
    // Clear Table data and enter Apil data into table data
    cy.testJsontext("tabledata", "{{Api1.data.users}}");
    // Check Widget properties
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    // Open Text1 in propert pane
    cy.SearchEntityandOpen("Text1");
    // Change the Text value to selected row url
    cy.testJsontext("text", "{{Table1.selectedRow.url}}");
    // Open Table1 propert pane
    cy.SearchEntityandOpen("Table1");
    // Compare table 1st index data with itself
    cy.readTabledata("0", "0").then((tabData) => {
      const tableData = tabData;
      localStorage.setItem("tableDataPage1", tableData);
    });
    // Verify 1st index data
    cy.ValidateTableData("1");
    // add new column
    cy.addColumn("CustomColumn");
  });

  it("Table widget toggle test for background color", function() {
    // Open id property pane
    cy.editColumn("id");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    // Click on cell background JS button
    cy.get(widgetsPage.toggleJsBcgColor)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    // Change the cell background color to green
    cy.toggleJsAndUpdate("tabledata", "Green");
    // Go back to table property pane
    cy.get(".t--property-pane-back-btn").click({ force: true });
    cy.wait("@updateLayout");
    // verify the cell background color
    cy.readTabledataValidateCSS("1", "0", "background-color", "rgb(0, 128, 0)");
  });

  it("Edit column name and validate test for computed value based on column type selected", function() {
    // opoen customColumn1 property pane
    cy.editColumn("customColumn1");
    // Enter Apil 1st user email data into customColumn1
    cy.readTabledataPublish("1", "9").then((tabData) => {
      const tabValue = tabData;
      cy.updateComputedValue("{{Api1.data.users[0].email}}");
      cy.readTabledataPublish("1", "9").then((tabData) => {
        expect(tabData).not.to.be.equal(tabValue);
        cy.log("computed value of plain text " + tabData);
      });
    });
    cy.closePropertyPane();
  });

  it("Update table json data and check the column names updated", function() {
    // Open table propert pane
    cy.SearchEntityandOpen("Table1");
    // Change the table data
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInputUpdate));
    cy.wait("@updateLayout");
    // verify columns are visible or not in the propert pane
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("email");
    cy.tableColumnDataValidation("userName");
    cy.tableColumnDataValidation("productName");
    cy.tableColumnDataValidation("orderAmount");
    cy.tableColumnDataValidation("customColumn1");
    // Hide the columns in property pane
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    cy.hideColumn("orderAmount");
    // verify customColumn is visible in the table
    cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
    cy.closePropertyPane();
  });
});
