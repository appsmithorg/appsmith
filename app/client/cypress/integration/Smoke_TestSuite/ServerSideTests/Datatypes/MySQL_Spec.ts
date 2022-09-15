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
  before(() => {
    cy.fixture("Datatypes/mySQLdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    propPane.ChangeTheme("Moon");
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

    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(ee._entityNameInExplorer(inputData.tableName));
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

    query = inputData.query.deleteAllRecords;
    ee.ActionTemplateMenuByEntityName(inputData.tableName, "DELETE");
    agHelper.RenameWithInPane("deleteAllRecords");
    dataSources.EnterQuery(query);

    query = inputData.query.dropTable;
    ee.ActionTemplateMenuByEntityName(inputData.tableName, "DELETE");
    agHelper.RenameWithInPane("dropTable");
    dataSources.EnterQuery(query);
  });

  //Insert false values to each column and check for the error status of the request.
  it("5. False Cases", () => {
    ee.ActionTemplateMenuByEntityName(inputData.tableName, "INSERT");
    agHelper.RenameWithInPane("falseCases");
    inputData.falseResult.forEach((res_array, i) => {
      res_array.forEach((value) => {
        query = `INSERT INTO ${inputData.tableName} (${inputData.inputFieldName[i]}) VALUES (${value})`;
        dataSources.EnterQuery(query);
        dataSources.RunQuery(false);
      });
    });
  });

  //Insert valid/true values into datasource
  it("6. Inserting record", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    inputData.input.forEach((valueArr, i) => {
      agHelper.ClickButton("Run InsertQuery");
      valueArr.forEach((value, index) => {
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
  it("7. Validating values in each cell", () => {
    cy.wait(2000);
    inputData.result.forEach((res_array, i) => {
      res_array.forEach((value, j) => {
        table.ReadTableRowColumnData(j, i, 0).then(($cellData) => {
          expect($cellData).to.eq(value);
        });
      });
    });
  });

  it("8. Deleting all records from table ", () => {
    agHelper.GetNClick(locator._deleteIcon);
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("9. Validate Drop of the Newly Created - mysqlDTs - Table from MySQL datasource", () => {
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("Queries/JS");
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

  it("10. Verify Deletion of the datasource after all created queries are Deleted", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
    ee.ExpandCollapseEntity("Queries/JS");
    ["falseCases", "createTable", "deleteAllRecords", "dropTable", "insertRecord", "selectRecords"].forEach(type => {
      ee.ActionContextMenuByEntityName(type, "Delete", "Are you sure?");
    })
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("Queries/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200); 
  });
});
