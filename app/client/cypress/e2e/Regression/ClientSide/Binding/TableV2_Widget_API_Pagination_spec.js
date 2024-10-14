import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
import {
  agHelper,
  locators,
  propPane,
  apiPage,
  table,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Test Create Api and Bind to Table widget V2",
  { tags: ["@tag.Binding", "@tag.Sanity"] },
  function () {
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
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Table data", "{{Api1.data}}");
      propPane.ExpandIfCollapsedSection("pagination");
      cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
      cy.get(`.t--widget-tablewidgetv2 .page-item`)
        .first()
        .should("contain", "1");
      cy.get(`.t--widget-tablewidgetv2 .t--table-widget-next-page`)
        .first()
        .click();
      cy.get(`.t--widget-tablewidgetv2 .page-item`)
        .first()
        .should("contain", "2");
      agHelper.WaitUntilToastDisappear("done");
    });

    it("2. Bug #22477: should check whether the next page button is disabled and not clickable when last page is reached", () => {
      /**
       * Flow:
       * Update total records count to 20
       * Click next page
       */

      propPane.UpdatePropertyFieldValue("Total Records", "20");
      agHelper.GetNClick(table._nextPage("v2"));

      agHelper.AssertAttribute(table._nextPage("v2"), "disabled", "disabled");
      agHelper.AssertElementAbsence(locators._toastMsg);
    });
  },
);
