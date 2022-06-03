const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/tableTextPaginationDsl.json");
const testdata = require("../../../../fixtures/testdata.json");
const widgetsPage = require("../../../../locators/Widgets.json");

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
    cy.editColumn("customColumn1");
    cy.editColName("UpdatedColName");
    cy.readTabledataPublish("0", "5").then((tabData) => {
      const tabValue = tabData;
      cy.updateComputedValue(testdata.currentRowEmail);
      cy.readTabledataPublish("0", "9").then((tabData) => {
        expect(tabData).to.be.equal(tabValue);
        cy.log("computed value of plain text " + tabData);
      });
    });
    cy.closePropertyPane();
  });

  it("Check Image alignment is working as expected", function() {
    cy.SearchEntityandOpen("Table1");
    cy.editColumn("avatar");
    cy.changeColumnType("Image");
    cy.closePropertyPane();
    cy.SearchEntityandOpen("Table1");
    cy.get(widgetsPage.centerAlign)
      .first()
      .click({ force: true });
    cy.closePropertyPane();
    cy.get(`.t--widget-tablewidget .tbody .image-cell`)
      .first()
      .should("have.css", "background-position", "50% 50%");
    cy.SearchEntityandOpen("Table1");
    cy.get(widgetsPage.rightAlign)
      .first()
      .click({ force: true });
    cy.closePropertyPane();
    cy.get(`.t--widget-tablewidget .tbody .image-cell`)
      .first()
      .should("have.css", "background-position", "100% 50%");
    cy.SearchEntityandOpen("Table1");
    cy.get(widgetsPage.leftAlign)
      .first()
      .click({ force: true });
    cy.closePropertyPane();
    cy.get(`.t--widget-tablewidget .tbody .image-cell`)
      .first()
      .should("have.css", "background-position", "0% 50%");
  });

  it("Update table json data and check the derived column values after update", function() {
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
    cy.get(".draggable-header:contains('UpdatedColName')").should("be.visible");
    cy.readTabledataPublish("1", "2").then((tabData) => {
      const tabValue = tabData;
      cy.readTabledataPublish("1", "2").then((tabData) => {
        cy.log("computed value of plain text " + tabData);
        expect(tabData).to.be.equal(tabValue);
      });
      cy.closePropertyPane();
    });
  });
});
