const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/tableTextPaginationDsl.json");

import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Test Create Api and Bind to Table widget", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Create an API and Execute the API and bind with Table & Validate Table with API data and then add a column", function () {
    _.apiPage.CreateAndFillApi(
      this.dataSet.paginationUrl + this.dataSet.paginationParam,
    );
    cy.RunAPI();
    _.entityExplorer.SelectEntityByName("Table1");
    cy.testJsontext("tabledata", "{{Api1.data.users}}");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    cy.get(`.t--widget-tablewidget .page-item`).first().should("contain", "1");
    cy.intercept("/api/v1/actions/execute").as("getNextPage");
    cy.get(`.t--widget-tablewidget .t--table-widget-next-page`).first().click();
    cy.wait("@getNextPage").then((interception) => {
      const hasPaginationField = interception.request.body.includes(
        '"paginationField":"NEXT"',
      );
      expect(hasPaginationField).to.equal(true);
    });
    cy.wait(2000);
    cy.get(`.t--widget-tablewidget .page-item`).first().should("contain", "2");
    cy.closePropertyPane();
  });
});
