import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any;

describe("Validate MySQL query UI flows - Bug 14054", () => {
  it("1. Create a new MySQL DS", () => {
    _.dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Validate Describe & verify query response", () => {
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.agHelper.RenameWithInPane("verifyDescribe");
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
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("3. Validate SHOW & verify query response", () => {
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.agHelper.RenameWithInPane("verifyShow");
    runQueryNValidate("SHOW tables;", ["Tables_in_fakeapi"]);
    runQueryNValidate("SHOW databases", ["Database"]);
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  after("4. Verify Deletion of the datasource", () => {
    _.dataSources.DeleteDSFromEntityExplorer(dsName, [200, 409]);
  });

  function runQueryNValidate(query: string, columnHeaders: string[]) {
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(columnHeaders);
  }
});
