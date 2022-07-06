const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/tableV2TextPaginationDsl.json");
const testdata = require("../../../../fixtures/testdata.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Test Create Api and Bind to Table widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Create an API and Execute the API and bind with TableV2", function() {
    cy.createAndFillApi(this.data.paginationUrl, this.data.paginationParam);
    cy.RunAPI();
  });

  it("2. Validate TableV2 with API data and then add a column", function() {
    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{Api1.data.users}}");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    cy.SearchEntityandOpen("Text1");
    cy.testJsontext("text", "{{Table1.selectedRow.url}}");
    cy.SearchEntityandOpen("Table1");
    cy.readTableV2data("0", "0").then((tabData) => {
      const tableData = tabData;
      localStorage.setItem("tableDataPage1", tableData);
    });
    cy.ValidateTableV2Data("1");
    cy.addColumnV2("CustomColumn");
    cy.editColumn("customColumn1");
    cy.editColName("UpdatedColName");
    cy.readTableV2dataPublish("0", "5").then((tabData) => {
      const tabValue = tabData;
      cy.updateComputedValueV2(testdata.currentRowEmail);
      cy.readTableV2dataPublish("0", "9").then((tabData) => {
        expect(tabData).to.be.equal(tabValue);
        cy.log("computed value of plain text " + tabData);
      });
    });
    cy.closePropertyPane();
  });

  it("3. Check Image alignment is working as expected", function() {
    cy.SearchEntityandOpen("Table1");
    cy.editColumn("avatar");
    cy.changeColumnType("Image");
    cy.closePropertyPane();
    cy.SearchEntityandOpen("Table1");
    cy.get(widgetsPage.centerAlign)
      .first()
      .click({ force: true });
    cy.closePropertyPane();
    cy.get(`.t--widget-tablewidgetv2 .tbody .image-cell`)
      .first()
      .should("have.css", "background-position", "50% 50%");
    cy.SearchEntityandOpen("Table1");
    cy.get(widgetsPage.rightAlign)
      .first()
      .click({ force: true });
    cy.closePropertyPane();
    cy.get(`.t--widget-tablewidgetv2 .tbody .image-cell`)
      .first()
      .should("have.css", "background-position", "100% 50%");
    cy.SearchEntityandOpen("Table1");
    cy.get(widgetsPage.leftAlign)
      .first()
      .click({ force: true });
    cy.closePropertyPane();
    cy.get(`.t--widget-tablewidgetv2 .tbody .image-cell`)
      .first()
      .should("have.css", "background-position", "0% 50%");
  });

  it("4. Update table json data and check the derived column values after update", function() {
    cy.SearchEntityandOpen("Table1");
    cy.tableV2ColumnDataValidation("id");
    cy.tableV2ColumnDataValidation("name");
    cy.tableV2ColumnDataValidation("status");
    cy.tableV2ColumnDataValidation("gender");
    cy.tableV2ColumnDataValidation("avatar");
    cy.tableV2ColumnDataValidation("email");
    cy.tableV2ColumnDataValidation("address");
    cy.tableV2ColumnDataValidation("createdAt");
    cy.tableV2ColumnDataValidation("updatedAt");
    cy.tableV2ColumnDataValidation("customColumn1");
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInputUpdate));
    cy.wait("@updateLayout");
    cy.tableV2ColumnDataValidation("id");
    cy.tableV2ColumnDataValidation("email");
    cy.tableV2ColumnDataValidation("userName");
    cy.tableV2ColumnDataValidation("productName");
    cy.tableV2ColumnDataValidation("orderAmount");
    cy.tableV2ColumnDataValidation("customColumn1");
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    cy.hideColumn("orderAmount");
    cy.get(".draggable-header:contains('UpdatedColName')").should("be.visible");
    cy.readTableV2dataPublish("1", "2").then((tabData) => {
      const tabValue = tabData;
      cy.readTableV2dataPublish("1", "2").then((tabData) => {
        cy.log("computed value of plain text " + tabData);
        expect(tabData).to.be.equal(tabValue);
      });
      cy.closePropertyPane();
    });
  });
});
