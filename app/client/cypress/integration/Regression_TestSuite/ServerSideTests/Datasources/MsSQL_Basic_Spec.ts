import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any, query: string;

describe("Validate MySQL query UI flows - Bug 14054", () => {
  it("1. Create a new MySQL DS", () => {
    _.dataSources.CreateDataSource("MsSql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Validate Show all existing tables, Describe table & verify query responses", () => {
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.agHelper.RenameWithInPane("MsSQL_queries");
    runQueryNValidate(
      "SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE';",
      ["TABLE_CATALOG", "TABLE_SCHEMA", "TABLE_NAME", "TABLE_TYPE"],
    );
    runQueryNValidate("exec sp_columns Amazon_Sales;", [
      "TABLE_QUALIFIER",
      "TABLE_OWNER",
      "TABLE_NAME",
      "COLUMN_NAME",
      "DATA_TYPE",
      "TYPE_NAME",
      "PRECISION",
      "LENGTH",
      "SCALE",
      "RADIX",
      "NULLABLE",
      "REMARKS",
      "COLUMN_DEF",
      "SQL_DATA_TYPE",
      "SQL_DATETIME_SUB",
      "CHAR_OCTET_LENGTH",
      "ORDINAL_POSITION",
      "IS_NULLABLE",
      "SS_DATA_TYPE",
    ]);
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("3. Run a Select query & validate response", () => {
    query = `Select * from Simpsons;`;
    _.entityExplorer.CreateNewDsQuery(dsName);
    _.agHelper.RenameWithInPane("selectSimpsons");
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQueryNVerifyResponseViews(99); //Could be 100 in CI, to check
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  after("Verify Deletion of the datasource", () => {
    _.entityExplorer.SelectEntityByName(dsName, "Datasources");
    _.entityExplorer.ActionContextMenuByEntityName(
      dsName,
      "Delete",
      "Are you sure?",
    );
    _.agHelper.ValidateNetworkStatus("@deleteDatasource", 200);
  });

  function runQueryNValidate(query: string, columnHeaders: string[]) {
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(columnHeaders);
  }
});
