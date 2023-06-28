import {
  agHelper,
  dataSources,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
let dsName: any;

describe("Validate MySQL query UI flows - Bug 14054", () => {
  it("1. Create a new MySQL DS", () => {
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Validate Describe & verify query response", () => {
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

  it("3. Validate SHOW & verify query response", () => {
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.RenameWithInPane("verifyShow");
    runQueryNValidate("SHOW tables;", ["Tables_in_fakeapi"]);
    runQueryNValidate("SHOW databases", ["Database"]);
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Query,
    });
  });

  after("4. Verify Deletion of the datasource", () => {
    dataSources.DeleteDSFromEntityExplorer(dsName, [200, 409]);
  });

  function runQueryNValidate(query: string, columnHeaders: string[]) {
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(columnHeaders);
  }
});
