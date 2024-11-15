import {
  agHelper,
  entityExplorer,
  deployMode,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";
import inputData from "../../../../support/Objects/mySqlData";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

let dsName: any, query: string;

describe(
  "MySQL Datatype tests",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    before("Create Mysql DS & Create mysqlDTs table", function () {
      dataSources.CreateDataSource("MySql");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        //IF NOT EXISTS can be used - which creates tabel if it does not exist and donot throw any error if table exists.
        //But if we add this option then next case could fail inn that case.
        query = inputData.query.createTable;
        dataSources.CreateQueryAfterDSSaved(query, "createTable"); //Creating query from EE overlay
        dataSources.RunQuery();
      });
    });

    //Insert false values to each column and check for the error status of the request.
    it("1. False Cases & Long Integer as query param", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        inputData.tableName,
        "Insert",
      );
      agHelper.RenameWithInPane("falseCases");
      inputData.falseResult.forEach((res_array, i) => {
        res_array.forEach((value) => {
          query =
            typeof value === "string"
              ? `INSERT INTO ${inputData.tableName} (${inputData.inputFieldName[i]}) VALUES ({{"${value}"}})`
              : `INSERT INTO ${inputData.tableName} (${inputData.inputFieldName[i]}) VALUES ({{${value}}})`;
          dataSources.EnterQuery(query);
          dataSources.RunQuery({ expectedStatus: false });
        });
      });
      agHelper.Sleep(2000);
      //agHelper.WaitUntilAllToastsDisappear();

      //This is a special case.
      //Added due to server side checks, which was handled in Datatype handling.
      //Long Integer as query param

      query = `SELECT * FROM ${inputData.tableName} LIMIT {{2147483648}}`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
    });

    after(
      "Verify Drop table & Deletion of the datasource after all created queries are deleted",
      () => {
        query = inputData.query.dropTable;
        dataSources.EnterQuery(query);
        dataSources.RunQuery();

        // ["falseCases", "createTable"].forEach((type) => {
        //   entityExplorer.ActionContextMenuByEntityName(
        //     type,
        //     "Delete",
        //     "Are you sure?",
        //   );
        // });
        entityExplorer.DeleteAllQueriesForDB(dsName);
        deployMode.DeployApp();
        deployMode.NavigateBacktoEditor();
        dataSources.DeleteDatasourceFromWithinDS(dsName, 200);
      },
    );
  },
);
