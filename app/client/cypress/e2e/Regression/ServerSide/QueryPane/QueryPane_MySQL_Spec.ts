import {
  agHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityItems,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Validate MySQL query UI flows - Bug 14054",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    let dsName: any;

    before("Create a new MySQL DS", () => {
      dataSources.CreateDataSource("MySql");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
    });

    it("1. Validate Describe & verify query response", () => {
      dataSources.CreateQueryForDS(dsName, "", "verifyDescribe");
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
      dataSources.CreateQueryForDS(dsName, "", "verifyShow");
      runQueryNValidate("SHOW tables;", ["Tables_in_fakeapi"]);
      runQueryNValidate("SHOW databases", ["Database"]);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("3. Validate Suggested widget binding for MySQL table", () => {
      dataSources.CreateQueryForDS(dsName, "", "SuggestedWidgetBinding");
      runQueryNValidate("SELECT * FROM countryFlags LIMIT 10;", [
        "Country",
        "File_Name",
        "Flag",
      ]);
      dataSources.AddSuggestedWidget(Widgets.Table);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName(
        "SuggestedWidgetBinding",
        EntityType.Query,
      );
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    after("Verify Deletion of the datasource", () => {
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409);
      agHelper.ValidateToastMessage(
        "Cannot delete datasource since it has 1 query using it.",
      ); //table is 1 action
    });

    function runQueryNValidate(query: string, columnHeaders: string[]) {
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(columnHeaders);
    }
  },
);
