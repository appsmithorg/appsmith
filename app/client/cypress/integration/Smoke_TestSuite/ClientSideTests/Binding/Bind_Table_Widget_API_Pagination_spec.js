const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/tableTextPaginationDsl.json");
var appId = " ";

describe("Test Create Api and Bind to Table widget", function() {
  before(() => {
    //appId = localStorage.getItem("applicationId");
    //cy.log("appID:" + appId);
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
    cy.get(`.t--widget-tablewidget .page-item`)
      .first()
      .should("contain", "1");
    cy.get(`.t--widget-tablewidget .t--table-widget-next-page`)
      .first()
      .click();
    cy.wait(2000);
    cy.get(`.t--widget-tablewidget .page-item`)
      .first()
      .should("contain", "2");
    cy.closePropertyPane();
  });
});
