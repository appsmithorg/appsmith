import * as _ from "../../../../support/Objects/ObjectsCore";
import inputData from "../../../../support/Objects/mySqlData";

let dsName: any, query: string;

describe("MySQL Datatype tests", function () {
  before("Load dsl, Change theme, Create Mysql DS", () => {
    cy.fixture("Datatypes/mySQLdsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
    _.appSettings.OpenPaneAndChangeTheme("Moon");
    _.dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Creating mysqlDTs _.table & queries", () => {
    //IF NOT EXISTS can be used - which creates tabel if it does not exist and donot throw any error if _.table exists.
    //But if we add this option then next case could fail inn that case.
    query = inputData.query.createTable;

    _.dataSources.CreateQueryFromOverlay(dsName, query, "createTable"); //Creating query from EE overlay
    _.dataSources.RunQuery();

    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementVisible(
      _.entityExplorer._entityNameInExplorer(inputData.tableName),
    );

    //Creating SELECT query
    _.entityExplorer.ActionTemplateMenuByEntityName(
      inputData.tableName,
      "SELECT",
    );
    _.agHelper.RenameWithInPane("selectRecords");
    _.dataSources.RunQuery();
    _.agHelper
      .GetText(_.dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));

    //Other queries
    query = inputData.query.insertRecord;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      inputData.tableName,
      "INSERT",
    );
    _.agHelper.RenameWithInPane("insertRecord");
    _.dataSources.EnterQuery(query);

    query = inputData.query.dropTable;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      inputData.tableName,
      "DELETE",
    );
    _.agHelper.RenameWithInPane("dropTable");
    _.dataSources.EnterQuery(query);
  });

  //Insert valid/true values into datasource
  it("2. Inserting record", () => {
    _.entityExplorer.SelectEntityByName("Page1");
    _.deployMode.DeployApp();
    _.table.WaitForTableEmpty(); //asserting table is empty before inserting!
    _.agHelper.ClickButton("Run InsertQuery");
    inputData.input.forEach((valueArr, i) => {
      _.agHelper.ClickButton("Run InsertQuery");
      valueArr.forEach((value, index) => {
        if (value !== "")
          _.agHelper.EnterInputText(inputData.inputFieldName[index], value);
      });
      i % 2 && _.agHelper.ToggleSwitch("Bool_column");
      _.agHelper.ClickButton("insertRecord");
      _.agHelper.AssertElementVisible(
        _.locators._spanButton("Run InsertQuery"),
      );
      _.agHelper.Sleep(2000);
    });
  });

  //Verify weather expected value is present in each cell
  //i.e. weather right data is pushed and fetched from datasource.
  it("3. Validating values in each cell", () => {
    cy.wait(2000);
    inputData.result.forEach((res_array, i) => {
      res_array.forEach((value, j) => {
        _.table.ReadTableRowColumnData(j, i, "v1", 0).then(($cellData) => {
          if (i === inputData.result.length - 1) {
            const obj = JSON.parse($cellData);
            expect(JSON.stringify(obj)).to.eq(JSON.stringify(value));
          } else {
            expect($cellData).to.eq(value);
          }
        });
      });
    });
  });

  //null will be displayed as empty string in _.tables
  //So test null we have to intercept execute request.
  //And check response payload.
  it("4. Testing null value", () => {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("selectRecords");
    _.dataSources.RunQuery({ toValidateResponse: false });
    cy.wait("@postExecute").then((intercept) => {
      expect(
        typeof intercept.response?.body.data.body[5].varchar_column,
      ).to.be.equal("object");
      expect(intercept.response?.body.data.body[5].varchar_column).to.be.equal(
        null,
      );
    });
  });

  after(
    "Verify Drop of tables & Deletion of the datasource after all created queries are Deleted",
    () => {
      _.entityExplorer.SelectEntityByName("dropTable");
      _.dataSources.RunQuery();
      _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("0"); //Success response for dropped _.table!
      });
      _.entityExplorer.ExpandCollapseEntity("Queries/JS", false);
      _.entityExplorer.ExpandCollapseEntity("Datasources");
      _.entityExplorer.ExpandCollapseEntity(dsName);
      _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
      _.agHelper.AssertElementAbsence(
        _.entityExplorer._entityNameInExplorer(inputData.tableName),
      );
      _.entityExplorer.ExpandCollapseEntity(dsName, false);
      _.entityExplorer.ExpandCollapseEntity("Datasources", false);

      //DS deletion
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      ["createTable", "dropTable", "insertRecord", "selectRecords"].forEach(
        (type) => {
          _.entityExplorer.ActionContextMenuByEntityName(
            type,
            "Delete",
            "Are you sure?",
          );
        },
      );
      _.deployMode.DeployApp();
      _.deployMode.NavigateBacktoEditor();
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
    },
  );
});
