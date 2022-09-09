const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/tableTextPaginationDsl.json");

describe("Test Create Api and Bind to Table widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Create an API and Execute the API and bind with Table", function() {
    cy.createAndFillApi(this.data.paginationUrl, this.data.paginationParam);
    cy.RunAPI();
  });

  it("2. Validate Table with API data and then add a column", function() {
    // Open property pane
    cy.SearchEntityandOpen("Table1");
    // Change the table data to Apil data users
    cy.testJsontext("tabledata", "{{Api1.data.users}}");
    // Check server sided pagination
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    // Open property pane of Text1
    cy.SearchEntityandOpen("Text1");
    // Change the text value to selected url
    cy.testJsontext("text", "{{Table1.selectedRow.url}}");
    // Open property pane
    cy.SearchEntityandOpen("Table1");
    // Copmre the table 1st index with itself
    cy.readTabledata("0", "0").then((tabData) => {
      const tableData = tabData;
      localStorage.setItem("tableDataPage1", tableData);
    });
    // Validate the table 1st index
    cy.ValidateTableData("1");
    // Add new column
    cy.addColumn("CustomColumn");
  });

  it("3. Update table json data and check the column names updated and validate empty value", function() {
    // Open property pane
    cy.SearchEntityandOpen("Table1");
    // Change the table data
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInputWithNull));
    cy.wait("@updateLayout");
    // Verify the columns are visible in property pane
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("email");
    cy.tableColumnDataValidation("userName");
    cy.tableColumnDataValidation("productName");
    cy.tableColumnDataValidation("orderAmount");
    cy.tableColumnDataValidation("customColumn1");
    // Hide the columns in the table from property pane
    cy.hideColumn("id");
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    // Verify CustomColumn is visible
    cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
    // close property pane
    cy.closePropertyPane();
    // Validate the empty values
    cy.readTabledataPublish("0", "0").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("");
    });
  });

  it("4. Check Selected Row(s) Resets When Table Data Changes", function() {
    // Select 1st row
    cy.isSelectRow(1);
    cy.openPropertyPane("tablewidget");
    // Empty first row
    cy.testJsontext("tabledata", "[]");
    cy.wait("@updateLayout");
    const newTableData = [...this.data.TableInput];
    newTableData[0].userName = "";
    // Change table data from empty to some
    cy.testJsontext("tabledata", JSON.stringify(newTableData));
    cy.wait("@updateLayout");
    const selectedRowsSelector = `.t--widget-tablewidget .tbody .tr.selected-row`;
    // Verify selected row resets on table data changes
    cy.get(selectedRowsSelector).should(($p) => {
      // should found 0 rows
      expect($p).to.have.length(0);
    });
  });
});
