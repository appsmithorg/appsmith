import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import inputData from "../../../../support/Objects/mySqlData"

let dsName: any, query: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode;


describe("Boolean Datatype tests", function() {
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

  it("2. Creating datatypes", () => {
    //IF NOT EXISTS can be used - which creates tabel if it does not exist and donot throw any error if table exists.
    //But if we add this option then next case could fail inn that case.
    query = `CREATE TABLE datatypes (serialId SERIAL not null primary key, stinyint_column TINYINT, utinyint_column TINYINT UNSIGNED, 
      ssmallint_column SMALLINT, usmallint_column SMALLINT UNSIGNED, smediumint_column MEDIUMINT, umediumint_column MEDIUMINT UNSIGNED, 
      sint_column INT, uint_column INT UNSIGNED, bigint_column BIGINT, float_column FLOAT( 10, 2 ), double_column DOUBLE, decimal_column DECIMAL( 10, 2 ), 
      datetime_column DATETIME, timestamp_column TIMESTAMP, date_column DATE, time_column TIME, year_column YEAR, varchar_column VARCHAR( 20 ), 
      char_column CHAR( 10 ), enum_column ENUM( 'a', 'b', 'c' ), bool_column BOOL, json_column JSON);`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("createTable");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.RunQuery();

    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(ee._entityNameInExplorer("datatypes"));
  });

  it("3. Creating SELECT query - datatypes + boolean", () => {
    ee.ActionTemplateMenuByEntityName("datatypes", "SELECT");
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
  });

  it("4. Creating all queries - datatypes", () => {
    query = `INSERT INTO datatypes (stinyint_column, utinyint_column, ssmallint_column, usmallint_column, smediumint_column, umediumint_column, 
      sint_column, uint_column, bigint_column, float_column, double_column, decimal_column, datetime_column, timestamp_column, 
      date_column, time_column, year_column, varchar_column, char_column, enum_column, bool_column, json_column ) 
      VALUES 
      ({{InsertStinyint.text}}, {{InsertUtinyint.text}}, {{InsertSsmallint.text}}, {{InsertUsmallint.text}}, {{InsertSmediumint.text}}, 
      {{InsertUmediumint.text}}, {{InsertSint.text}}, {{InsertUint.text}}, {{InsertBigint.text}}, {{InsertFloat.text}}, {{InsertDouble.text}}, 
      {{InsertDecimal.text}}, {{InsertDatetime.text}}, {{InsertTimestamp.text}}, {{InsertDate.text}}, {{InsertTime.text}}, 
      {{InsertYear.text}}, {{InsertVarchar.text}}, {{InsertChar.text}}, {{InsertEnum.text}}, {{InsertBoolean.isSwitchedOn}}, {{InputJson.text}});`;
    ee.ActionTemplateMenuByEntityName("datatypes", "INSERT");
    agHelper.RenameWithInPane("insertRecord");
    dataSources.EnterQuery(query);

    query = `UPDATE datatypes SET
      "bigintid" = {{Updatebigint.text}},
      "decimalid" = {{Updatedecimal.text}},
      "numericid" = {{Updatenumeric.text}},
      "isTrue" = {{Updateboolean.isSwitchedOn}}
      WHERE serialid = {{Table1.selectedRow.serialid}};`;
    ee.ActionTemplateMenuByEntityName("datatypes", "UPDATE");
    agHelper.RenameWithInPane("updateRecord");
    dataSources.EnterQuery(query);

    query = `DELETE FROM datatypes
      WHERE serialId ={{Table1.selectedRow.serialid}}`;
    ee.ActionTemplateMenuByEntityName("datatypes", "DELETE");
    agHelper.RenameWithInPane("deleteRecord");
    dataSources.EnterQuery(query);

    query = `DELETE FROM datatypes`;
    ee.ActionTemplateMenuByEntityName("datatypes", "DELETE");
    agHelper.RenameWithInPane("deleteAllRecords");
    dataSources.EnterQuery(query);

    query = `drop table datatypes`;
    ee.ActionTemplateMenuByEntityName("datatypes", "DELETE");
    agHelper.RenameWithInPane("dropTable");
    dataSources.EnterQuery(query); 
  });

  it("5. False Cases ", () => {
    ee.ActionTemplateMenuByEntityName("datatypes", "INSERT");
    agHelper.RenameWithInPane("falseCases");
    inputData.falseResult.forEach((res_array, i) => {
      res_array.forEach((value) => {
        query = `INSERT INTO datatypes (${inputData.inputFieldName[i]}) VALUES (${value})`;
        dataSources.EnterQuery(query);
        dataSources.RunQuery(false);
      })
    })
  })

  it("6. Inserting record (+ve limit) - datatypes", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    inputData.input.forEach((valueArr,i) => {
      agHelper.ClickButton("Run InsertQuery");
      valueArr.forEach((value, index) => {
        if(inputData.inputFieldName[index] === "Json_column"){
          agHelper.EnterInputText(inputData.inputFieldName[index], value, false, true, {parseSpecialCharSequences: false})
        }else{
          agHelper.EnterInputText(inputData.inputFieldName[index], value)
        }
      })
      i % 2 && agHelper.ToggleSwitch("Bool_column");
      agHelper.ClickButton("insertRecord");
      agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
      cy.wait(2000);
    })
  });

  it("7. Validating values", () => {
    cy.wait(2000);
    inputData.result.forEach((res_array, i) => {
      res_array.forEach((value, j) => {
        table.ReadTableRowColumnData(j, i, 0).then(($cellData) => {
          expect($cellData).to.eq(value);
        });
      })
    })
  })

  it("8. Verify Deletion of the datasource after all created queries are Deleted", () => {
    deployMode.NavigateBacktoEditor();
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
    ee.ExpandCollapseEntity("Queries/JS");
    ee.ActionContextMenuByEntityName("falseCases", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("createTable", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName(
      "deleteAllRecords",
      "Delete",
      "Are you sure?",
    );
    ee.ActionContextMenuByEntityName("deleteRecord", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("dropTable", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("insertRecord", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName(
      "selectRecords",
      "Delete",
      "Are you sure?",
    );
    ee.ActionContextMenuByEntityName("updateRecord", "Delete", "Are you sure?");
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("Queries/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200); //ProductLines, Employees pages are still using this ds
  });
});