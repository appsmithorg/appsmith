import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");

import {
  agHelper,
  entityExplorer,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Test Create Api and Bind to Table widget",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("tableTextPaginationDsl");
    });

    it("1. Create an API and Execute the API and bind with Table & Validate Table with API data and then add a column", function () {
      apiPage.CreateAndFillApi(
        this.dataSet.paginationUrl + this.dataSet.paginationParam,
      );
      agHelper.VerifyEvaluatedValue(
        this.dataSet.paginationUrl + "mock-api?records=20&page=1&size=10",
      );
      cy.RunAPI();
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.testJsontext("tabledata", "{{Api1.data}}");
      cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
      cy.get(`.t--widget-tablewidget .page-item`)
        .first()
        .should("contain", "1");
      cy.intercept("/api/v1/actions/execute").as("getNextPage");
      cy.get(`.t--widget-tablewidget .t--table-widget-next-page`)
        .first()
        .click();
      cy.wait("@getNextPage").then((interception) => {
        const hasPaginationField = interception.request.body.includes(
          '"paginationField":"NEXT"',
        );
        expect(hasPaginationField).to.equal(true);
      });
      cy.wait(2000);
      cy.get(`.t--widget-tablewidget .page-item`)
        .first()
        .should("contain", "2");
      cy.closePropertyPane();
    });
  },
);
