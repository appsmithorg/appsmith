import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any, query: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode;

describe("Boolean & Enum Datatype tests", function() {
  before(() => {
    cy.fixture("Datatypes/BooleanEnumDTdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    propPane.ChangeColor(-18, "Primary");
    propPane.ChangeColor(-20, "Background");
  });

  it("1. Create Postgress DS", function() {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Creating enum & table queries - boolenumtypes", () => {
    query = `CREATE TYPE weekdays AS ENUM ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');`;
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("createEnum");
    dataSources.EnterQuery(query);
    dataSources.RunQuery();

    query = `create table boolenumtypes (serialId SERIAL not null primary key, workingDay weekdays, AreWeWorking boolean)`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("createTable");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.RunQuery();

    //ee.ExpandCollapseEntity(dsName); //Clicking Create Query from Active DS is already expanding ds
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(
      ee._entityNameInExplorer("public.boolenumtypes"),
    );
  });

  it("3. Creating SELECT query - boolenumtypes + Bug 14493", () => {
    ee.ActionTemplateMenuByEntityName("public.boolenumtypes", "SELECT");
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
  });

  it("4. Creating all queries - boolenumtypes", () => {
    query = `INSERT INTO public."boolenumtypes" ("workingday", "areweworking") VALUES ({{Insertworkingday.selectedOptionValue}}, {{Insertareweworking.isSwitchedOn}})`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("insertRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `UPDATE public."boolenumtypes" SET "workingday" = {{Updateworkingday.selectedOptionValue}}, "areweworking" = {{Updateareweworking.isSwitchedOn}} WHERE serialid = {{Table1.selectedRow.serialid}};`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("updateRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `SELECT * from enum_range(NULL::weekdays)`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("getEnum");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."boolenumtypes" WHERE serialId ={{Table1.selectedRow.serialid}}`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."boolenumtypes"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteAllRecords");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `drop table public."boolenumtypes"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("dropTable");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `drop type weekdays`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("dropEnum");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    ee.ExpandCollapseEntity("QUERIES/JS", false);
    ee.ExpandCollapseEntity(dsName, false);
  });

  it("5. Inserting record - boolenumtypes", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.SelectDropDown("Monday");
    agHelper.ToggleSwitch("Areweworking");
    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locator._toastMsg);//Assert that Insert did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("Monday");
    });
    table.ReadTableRowColumnData(0, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("true");
    });
  });

  it("6. Inserting another record - boolenumtypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.SelectDropDown("Saturday");
    agHelper.ToggleSwitch("Areweworking", "uncheck");
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("Saturday");
    });
    table.ReadTableRowColumnData(1, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("false");
    });
  });

  it("7. Inserting another record - boolenumtypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.SelectDropDown("Friday");
    agHelper.ToggleSwitch("Areweworking", "uncheck");
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("Friday");
    });
    table.ReadTableRowColumnData(2, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("false");
    });
  });

  it("8. Updating record - boolenumtypes", () => {
    table.SelectTableRow(2);
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.ToggleSwitch("Areweworking", "check");
    agHelper.ClickButton("Update");
    agHelper.AssertElementAbsence(locator._toastMsg);//Assert that Update did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run UpdateQuery"));
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("Friday");
    });
    table.ReadTableRowColumnData(2, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("true");
    });
  });

  it("9. Validating Enum Ordering", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    query = `SELECT * FROM boolenumtypes WHERE workingday > 'Tuesday';`;
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("verifyEnumOrdering");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Saturday");
    });
    dataSources.ReadQueryTableResponse(4).then(($cellData) => {
      expect($cellData).to.eq("Friday");
    });

    query = `SELECT * FROM boolenumtypes WHERE workingday = (SELECT MIN(workingday) FROM boolenumtypes);`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Monday");
    });
    agHelper.ActionContextMenuWithInPane("Delete");
    ee.ExpandCollapseEntity("QUERIES/JS", false);
  });

  it("10. Deleting records - boolenumtypes", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitUntilTableLoad();
    table.SelectTableRow(1);
    agHelper.ClickButton("DeleteQuery", 1);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(2500); //Allwowing time for delete to be success
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).not.to.eq("2"); //asserting 2nd record is deleted
    });
    table.ReadTableRowColumnData(1, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
  });

  it("11. Deleting all records from table - boolenumtypes", () => {
    agHelper.GetNClick(locator._deleteIcon);
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("12. Inserting another record (to check serial column) - boolenumtypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.SelectDropDown("Wednesday");
    agHelper.ToggleSwitch("Areweworking", "check");
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("Wednesday");
    });
    table.ReadTableRowColumnData(0, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("true");
    });
  });

  it("13. Validate Drop of the Newly Created - boolenumtypes - Table from Postgres datasource", () => {
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("dropTable");
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0"); //Success response for dropped table!
    });
    ee.ExpandCollapseEntity("QUERIES/JS", false);
    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementAbsence(
      ee._entityNameInExplorer("public.boolenumtypes"),
    );
    ee.ExpandCollapseEntity(dsName, false);
    ee.ExpandCollapseEntity("DATASOURCES", false);
  });

  it("14. Verify Deletion of the datasource after all created queries are Deleted", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("createEnum", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("createTable", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName(
      "deleteAllRecords",
      "Delete",
      "Are you sure?",
    );
    ee.ActionContextMenuByEntityName("deleteRecord", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("dropTable", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("dropEnum", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("getEnum", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("insertRecord", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName(
      "selectRecords",
      "Delete",
      "Are you sure?",
    );
    ee.ActionContextMenuByEntityName("updateRecord", "Delete", "Are you sure?");
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("QUERIES/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
  });
});
