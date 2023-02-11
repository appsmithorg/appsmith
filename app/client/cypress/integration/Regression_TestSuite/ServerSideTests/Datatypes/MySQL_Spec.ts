import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import inputData from "../../../../support/Objects/mySqlData";

let dsName: any, query: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode,
  appSettings = ObjectsRegistry.AppSettings;

describe("MySQL Datatype tests", function() {
  before(() => {
    cy.fixture("Datatypes/mySQLdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    appSettings.OpenPaneAndChangeTheme("Moon");
  });

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

  it("3. Creating SELECT query", () => {
    ee.ActionTemplateMenuByEntityName(inputData.tableName, "SELECT");
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
  });

  it("4. Creating all queries", () => {
    query = inputData.query.insertRecord;
    ee.ActionTemplateMenuByEntityName(inputData.tableName, "INSERT");
    agHelper.RenameWithInPane("insertRecord");
    dataSources.EnterQuery(query);

    query = inputData.query.dropTable;
    ee.ActionTemplateMenuByEntityName(inputData.tableName, "DELETE");
    agHelper.RenameWithInPane("dropTable");
    dataSources.EnterQuery(query);
  });

  //Insert valid/true values into datasource
  it("5. Inserting record", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    inputData.input.forEach((valueArr, i) => {
      agHelper.ClickButton("Run InsertQuery");
      valueArr.forEach((value, index) => {
        if (value !== "")
          agHelper.EnterInputText(inputData.inputFieldName[index], value);
      });
      i % 2 && agHelper.ToggleSwitch("Bool_column");
      agHelper.ClickButton("insertRecord");
      agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
      agHelper.Sleep(2000);
    });
  });

  //Verify weather expected value is present in each cell
  //i.e. weather right data is pushed and fetched from datasource.
  it("6. Validating values in each cell", () => {
    cy.wait(2000);
    inputData.result.forEach((res_array, i) => {
      res_array.forEach((value, j) => {
        table.ReadTableRowColumnData(j, i, 0).then(($cellData) => {
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

  //null will be displayed as empty string in tables
  //So test null we have to intercept execute request.
  //And check response payload.
  it("7. Testing null value", () => {
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("Queries/JS");
    ee.SelectEntityByName("selectRecords");
    dataSources.RunQuery(true, false);
    cy.wait("@postExecute").then((intercept) => {
      expect(
        typeof intercept.response?.body.data.body[5].varchar_column,
      ).to.be.equal("object");
      expect(intercept.response?.body.data.body[5].varchar_column).to.be.equal(
        null,
      );
    });
  });

  it("8. Validate drop of mysqlDTs - Table from MySQL datasource", () => {
    ee.SelectEntityByName("dropTable");
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0"); //Success response for dropped table!
    });
    ee.ExpandCollapseEntity("Queries/JS", false);
    ee.ExpandCollapseEntity("Datasources");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementAbsence(
      ee._entityNameInExplorer(inputData.tableName),
    );
    ee.ExpandCollapseEntity(dsName, false);
    ee.ExpandCollapseEntity("Datasources", false);
  });

  it("9. Verify Deletion of the datasource after all created queries are Deleted", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
    ee.ExpandCollapseEntity("Queries/JS");
    ["createTable", "dropTable", "insertRecord", "selectRecords"].forEach(
      (type) => {
        ee.ActionContextMenuByEntityName(type, "Delete", "Are you sure?");
      },
    );
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("Queries/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
  });
});
