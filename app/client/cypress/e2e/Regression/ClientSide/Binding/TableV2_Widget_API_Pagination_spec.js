const commonlocators = require("../../../../locators/commonlocators.json");
import {
  agHelper,
  entityExplorer,
  propPane,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";

describe("Test Create Api and Bind to Table widget V2", function () {
  before(() => {
    agHelper.AddDsl("tableV2TextPaginationDsl");
  });

  it("1. Create an API and Execute the API and bind with Table", function () {
    apiPage.CreateAndFillApi(
      this.dataSet.paginationUrl + this.dataSet.paginationParam,
    );
    agHelper.VerifyEvaluatedValue(
      this.dataSet.paginationUrl + "mock-api?records=20&page=1&size=10",
    );
    apiPage.RunAPI();
    //Validate Table V2 with API data and then add a column
    entityExplorer.SelectEntityByName("Table1");
    propPane.UpdatePropertyFieldValue("Table data", "{{Api1.data}}");
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
