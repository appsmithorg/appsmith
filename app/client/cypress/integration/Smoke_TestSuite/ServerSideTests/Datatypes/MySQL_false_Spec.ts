import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import inputData from "../../../../support/Objects/mySqlData";

let dsName: any, query: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode;

describe("MySQL Datatype tests", function() {
  it("1. Create Mysql DS", function() {
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Creating mysqlDTs table", () => {
    //IF NOT EXISTS can be used - which creates tabel if it does not exist and donot throw any error if table exists.
    //But if we add this option then next case could fail inn that case.
    query = inputData.query.createTable;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("createTable");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.RunQuery();

    ee.ExpandCollapseEntity("Datasources");
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(
      ee._entityNameInExplorer(inputData.tableName),
    );
  });

  //Insert false values to each column and check for the error status of the request.
  it("3. False Cases", () => {
    ee.ActionTemplateMenuByEntityName(inputData.tableName, "INSERT");
    agHelper.RenameWithInPane("falseCases");
    inputData.falseResult.forEach((res_array, i) => {
      res_array.forEach((value) => {
        query =
          typeof value === "string"
            ? `INSERT INTO ${inputData.tableName} (${inputData.inputFieldName[i]}) VALUES ({{"${value}"}})`
            : `INSERT INTO ${inputData.tableName} (${inputData.inputFieldName[i]}) VALUES ({{${value}}})`;
        dataSources.EnterQuery(query);
        dataSources.RunQuery(false);
      });
    });
    agHelper.Sleep(2000);
    agHelper.WaitUntilAllToastsDisappear();
  });

  //This is a special case.
  //Added due to server side checks, which was handled in Datatype handling.
  it("4. Long Integer as query param", () => {
    query = `SELECT * FROM ${inputData.tableName} LIMIT {{2147483648}}`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
  });

  it("5. Drop Table", () => {
    query = inputData.query.dropTable;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
  });

  it("6. Verify Deletion of the datasource after all created queries are Deleted", () => {
    ee.ExpandCollapseEntity("Queries/JS");
    ["falseCases", "createTable"].forEach((type) => {
      ee.ActionContextMenuByEntityName(type, "Delete", "Are you sure?");
    });
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("Queries/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
  });
});
