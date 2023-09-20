import {
  agHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

describe("Validate MySQL query UI flows - Bug 14054", () => {
  let dsName: any;

  before("Create a new MySQL DS", () => {
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Validate Describe & verify query response", () => {
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.RenameWithInPane("verifyDescribe");
    runQueryNValidate("Describe customers;", [
      "Field",
      "Type",
      "Null",
      "Key",
      "Default",
      "Extra",
    ]);
    runQueryNValidate("Desc employees;", [
      "Field",
      "Type",
      "Null",
      "Key",
      "Default",
      "Extra",
    ]);
    runQueryNValidate("desc lightHouses;", [
      "Field",
      "Type",
      "Null",
      "Key",
      "Default",
      "Extra",
    ]);
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Query,
    });
  });

  it("2. Validate SHOW & verify query response", () => {
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.RenameWithInPane("verifyShow");
    runQueryNValidate("SHOW tables;", ["Tables_in_fakeapi"]);
    runQueryNValidate("SHOW databases", ["Database"]);
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Query,
    });
  });

  it("3. Validate Suggested widget binding for MySQL table", () => {
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.RenameWithInPane("SuggestedWidgetBinding");
    runQueryNValidate("SELECT * FROM countryFlags LIMIT 10;", [
      "Country",
      "File_Name",
      "Flag",
    ]);
    dataSources.AddSuggestedWidget(Widgets.Table);
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
    table.WaitUntilTableLoad(0, 0, "v2");
    deployMode.NavigateBacktoEditor();
    entityExplorer.SelectEntityByName("SuggestedWidgetBinding");
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Query,
    });
  });

  after("Verify Deletion of the datasource", () => {
    dataSources.DeleteDatasourceFromWithinDS(dsName, 409);
    agHelper.ValidateToastMessage(
      "Cannot delete datasource since it has 1 action(s) using it.",
    ); //table is 1 action
  });

  function runQueryNValidate(query: string, columnHeaders: string[]) {
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(columnHeaders);
  }
});
