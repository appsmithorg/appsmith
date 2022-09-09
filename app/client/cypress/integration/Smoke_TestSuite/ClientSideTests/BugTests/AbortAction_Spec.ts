import { ObjectsRegistry } from "../../../../support/Objects/Registry";

import {
  ACTION_EXECUTION_CANCELLED,
  createMessage,
} from "../../../../support/Objects/CommonErrorMessages";

const agHelper = ObjectsRegistry.AggregateHelper,
  locator = ObjectsRegistry.CommonLocators,
  apiPage = ObjectsRegistry.ApiPage,
  dataSources = ObjectsRegistry.DataSources;

let dsName: any;

const largeResponseApiUrl = "https://api.publicapis.org/entries";
//"https://jsonplaceholder.typicode.com/photos";//Commenting since this is faster sometimes & case is failing

describe("Abort Action Execution", function() {
  it("1. Bug #14006, #16093 - Cancel Request button should abort API action execution", function() {
    apiPage.CreateAndFillApi(largeResponseApiUrl, "AbortApi", 0);
    apiPage.RunAPI(false, 0);
    agHelper.GetNClick(locator._cancelActionExecution, 0, true);
    agHelper.AssertContains(
      createMessage(ACTION_EXECUTION_CANCELLED, "AbortApi"),
    );
    agHelper.AssertElementAbsence(locator._specificToast("{}")); //Assert that empty toast does not appear - Bug #16093
    agHelper.ActionContextMenuWithInPane("Delete", "Are you sure?");
  });

  // Queries were resolving quicker than we could cancel them
  // Commenting this out till we can find a query that resolves slow enough for us to cancel its execution.

  it("2. Bug #14006, #16093 Cancel Request button should abort Query action execution", function() {
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateNewQueryInDS(
        dsName,
        "SELECT * FROM worldCountryInfo wc join countryFlags cf on wc.Name = cf.Country CROSS JOIN customers cc",
        "AbortQuery",
      );
      dataSources.SetQueryTimeout(0);
      dataSources.RunQuery(false, false, 0);
      agHelper.GetNClick(locator._cancelActionExecution, 0, true);
      agHelper.AssertContains(
        createMessage(ACTION_EXECUTION_CANCELLED, "AbortQuery"),
      );
      agHelper.AssertElementAbsence(locator._specificToast("{}")); //Assert that empty toast does not appear - Bug #16093
      agHelper.ActionContextMenuWithInPane("Delete", "Are you sure?");
      dataSources.DeleteDatasouceFromWinthinDS(dsName);
    });
  });
});
