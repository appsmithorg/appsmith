import * as _ from "../../../../support/Objects/ObjectsCore";
import inputData from "../../../../support/Objects/mySqlData";

let dsName: any, query: string;

describe("MySQL Datatype tests", function () {
  before("Create Mysql DS & Create mysqlDTs table", function () {
    _.dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      //IF NOT EXISTS can be used - which creates tabel if it does not exist and donot throw any error if table exists.
      //But if we add this option then next case could fail inn that case.
      query = inputData.query.createTable;
      _.dataSources.CreateQueryAfterDSSaved(query, "createTable"); //Creating query from EE overlay
      _.dataSources.RunQuery();

      _.entityExplorer.ExpandCollapseEntity("Datasources");
      _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
      _.agHelper.AssertElementVisible(
        _.entityExplorer._entityNameInExplorer(inputData.tableName),
      );
    });
  });

  //Insert false values to each column and check for the error status of the request.
  it("1. False Cases & Long Integer as query param", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName(
      inputData.tableName,
      "INSERT",
    );
    _.agHelper.RenameWithInPane("falseCases");
    inputData.falseResult.forEach((res_array, i) => {
      res_array.forEach((value) => {
        query =
          typeof value === "string"
            ? `INSERT INTO ${inputData.tableName} (${inputData.inputFieldName[i]}) VALUES ({{"${value}"}})`
            : `INSERT INTO ${inputData.tableName} (${inputData.inputFieldName[i]}) VALUES ({{${value}}})`;
        _.dataSources.EnterQuery(query);
        _.dataSources.RunQuery({ expectedStatus: false });
      });
    });
    _.agHelper.Sleep(2000);
    _.agHelper.WaitUntilAllToastsDisappear();

    //This is a special case.
    //Added due to server side checks, which was handled in Datatype handling.
    //Long Integer as query param

    query = `SELECT * FROM ${inputData.tableName} LIMIT {{2147483648}}`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
  });

  after(
    "Verify Drop table & Deletion of the datasource after all created queries are Deleted",
    () => {
      query = inputData.query.dropTable;
      _.dataSources.EnterQuery(query);
      _.dataSources.RunQuery();

      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      ["falseCases", "createTable"].forEach((type) => {
        _.entityExplorer.ActionContextMenuByEntityName(
          type,
          "Delete",
          "Are you sure?",
        );
      });
      _.deployMode.DeployApp();
      _.deployMode.NavigateBacktoEditor();
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
    },
  );
});
