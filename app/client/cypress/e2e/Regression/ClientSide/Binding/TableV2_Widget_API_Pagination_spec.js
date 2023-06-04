const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/tableV2TextPaginationDsl.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Test Create Api and Bind to Table widget V2", function () {
  before(() => {
    cy.addDsl(dsl);
  });
  it("1. Create an API and Execute the API and bind with Table", function () {
    _.apiPage.CreateAndFillApi(
      this.dataSet.paginationUrl + this.dataSet.paginationParam,
    );
    _.apiPage.RunAPI();
    //Validate Table V2 with API data and then add a column
    _.entityExplorer.SelectEntityByName("Table1");
    _.propPane.UpdatePropertyFieldValue("Table data", "{{Api1.data}}");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    cy.get(`.t--widget-tablewidgetv2 .page-item`)
      .first()
      .should("contain", "1");
    cy.get(`.t--widget-tablewidgetv2 .t--table-widget-next-page`)
      .first()
      .click();
    cy.wait(2000);
    cy.get(`.t--widget-tablewidgetv2 .page-item`)
      .first()
      .should("contain", "2");
  });
});
