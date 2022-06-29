import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, dsName: any;

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources;

describe("Validate MySQL query UI flows - Bug 14054", () => {
  before(() => {
    dataSources.StartDataSourceRoutes();
  });

  it("1. Create a new MySQL DS", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("MySQL");
      guid = uid;
      agHelper.RenameWithInPane("MySQL " + guid, false);
      dataSources.FillMySqlDSForm();
      dataSources.TestSaveDatasource();
      cy.wrap("MySQL " + guid).as("dsName");
    });
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Validate Describe & verify query response", () => {
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
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
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("3. Validate SHOW & verify query response", () => {
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("verifyShow");
    runQueryNValidate("SHOW tables;", ["Tables_in_fakeapi"]);
    runQueryNValidate("SHOW databases", ["Database"]);
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("4. Verify Deletion of the datasource", () => {
    ee.ActionContextMenuByEntityName(dsName, "Delete", "Are you sure?")
    agHelper.ValidateNetworkStatus("@deleteDatasource", 200);
  });

  function runQueryNValidate(query: string, columnHeaders: string[]) {
    agHelper.EnterValue(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(columnHeaders);
  }
});
