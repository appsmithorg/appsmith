import {
  agHelper,
  locators,
  apiPage,
  dataSources,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
import {
  ACTION_EXECUTION_CANCELLED,
  createMessage,
} from "../../../../support/Objects/CommonErrorMessages";

const largeResponseApiUrl = "https://api.github.com/emojis";
//"https://api.publicapis.org/entries";
//"https://jsonplaceholder.typicode.com/photos";//Commenting since this is faster sometimes & case is failing

describe("Abort Action Execution", function () {
  it("1. Bug #14006, #16093 - Cancel request button should abort API action execution", function () {
    apiPage.CreateAndFillApi(largeResponseApiUrl, "AbortApi", 0);
    apiPage.RunAPI(false, 0);
    agHelper.GetNClick(locators._cancelActionExecution, 0, true);
    agHelper.AssertContains(
      createMessage(ACTION_EXECUTION_CANCELLED, "AbortApi"),
    );
    agHelper.AssertElementAbsence(locators._specificToast("{}")); //Assert that empty toast does not appear - Bug #16093
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Api,
    });
  });

  // Queries were resolving quicker than we could cancel them
  // Commenting this out till we can find a query that resolves slow enough for us to cancel its execution.

  it("2. Bug #14006, #16093 Cancel request button should abort Query action execution", function () {
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dataSources.CreateQueryAfterDSSaved(
        "SELECT * FROM worldCountryInfo wc join countryFlags cf on wc.Name = cf.Country CROSS JOIN customers cc",
        "AbortQuery",
      );
      dataSources.SetQueryTimeout(0);
      agHelper.GetNClick(dataSources._runQueryBtn, 0, true, 0);
      agHelper.GetNClick(locators._cancelActionExecution, 0, true);
      agHelper.AssertContains(
        createMessage(ACTION_EXECUTION_CANCELLED, "AbortQuery"),
      );
      agHelper.AssertElementAbsence(locators._specificToast("{}")); //Assert that empty toast does not appear - Bug #16093
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      dataSources.DeleteDatasourceFromWithinDS($dsName as unknown as string);
    });
  });
});
