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
    cy.createAndFillApi(this.data.paginationUrl, this.data.paginationParam);
    cy.RunAPI();
  });

  it("Validate Table with API data and then add a column", function() {
    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{Api1.data.users}}");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    cy.SearchEntityandOpen("Text1");
    cy.testJsontext("text", "{{Table1.selectedRow.url}}");
    cy.SearchEntityandOpen("Table1");
    cy.readTabledata("0", "0").then((tabData) => {
      const tableData = tabData;
      localStorage.setItem("tableDataPage1", tableData);
    });
    cy.ValidateTableData("1");
    cy.addColumn("CustomColumn");
  });

  it("Table widget toggle test for background color", function() {
    cy.editColumn("id");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get(widgetsPage.toggleJsBcgColor)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.toggleJsAndUpdate("tabledata", "Green");
    cy.get(".t--property-pane-back-btn").click({ force: true });
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS("1", "0", "background-color", "rgb(0, 128, 0)");
  });

  it("Edit column name and validate test for computed value based on column type selected", function() {
    cy.editColumn("customColumn1");
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
    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInputUpdate));
    cy.wait("@updateLayout");
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("email");
    cy.tableColumnDataValidation("userName");
    cy.tableColumnDataValidation("productName");
    cy.tableColumnDataValidation("orderAmount");
    cy.tableColumnDataValidation("customColumn1");
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    cy.hideColumn("orderAmount");
    cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
    cy.closePropertyPane();
  });
});
