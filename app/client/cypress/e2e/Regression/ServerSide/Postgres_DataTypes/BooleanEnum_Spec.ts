import {
  agHelper,
  locators,
  entityExplorer,
  deployMode,
  appSettings,
  dataSources,
  table,
  entityItems,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Boolean & Enum Datatype tests", function () {
  let dsName: any, query: string;

  before("Create Postgress DS, Add dsl, Appply theme", () => {
    agHelper.AddDsl("Datatypes/BooleanEnumDTdsl");
    appSettings.OpenPaneAndChangeThemeColors(-18, -20);
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Creating enum & table queries - boolenumtypes + Bug 14493", () => {
    query = `CREATE TYPE weekdays AS ENUM ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');`;
    dataSources.CreateQueryAfterDSSaved(query, "createEnum");
    dataSources.RunQuery();

    query = `create table boolenumtypes (serialId SERIAL not null primary key, workingDay weekdays, AreWeWorking boolean)`;
    dataSources.CreateQueryFromOverlay(dsName, query, "createTable");
    dataSources.RunQuery();

    entityExplorer.ExpandCollapseEntity("Datasources");
    entityExplorer.ExpandCollapseEntity(dsName); //Clicking Create Query from Active DS is already expanding ds
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: dsName,
      action: "Refresh",
    });
    agHelper.AssertElementVisible(
      entityExplorer._entityNameInExplorer("public.boolenumtypes"),
    );

    //Select query:
    entityExplorer.ActionTemplateMenuByEntityName(
      "public.boolenumtypes",
      "SELECT",
    );
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));

    //Other queries
    query = `INSERT INTO public."boolenumtypes" ("workingday", "areweworking") VALUES ({{Insertworkingday.selectedOptionValue}}, {{Insertareweworking.isSwitchedOn}})`;
    dataSources.CreateQueryFromOverlay(dsName, query, "insertRecord");

    query = `UPDATE public."boolenumtypes" SET "workingday" = {{Updateworkingday.selectedOptionValue}}, "areweworking" = {{Updateareweworking.isSwitchedOn}} WHERE serialid = {{Table1.selectedRow.serialid}};`;
    dataSources.CreateQueryFromOverlay(dsName, query, "updateRecord");

    query = `SELECT * from enum_range(NULL::weekdays)`;
    dataSources.CreateQueryFromOverlay(dsName, query, "getEnum");

    query = `DELETE FROM public."boolenumtypes" WHERE serialId ={{Table1.selectedRow.serialid}}`;
    dataSources.CreateQueryFromOverlay(dsName, query, "deleteRecord");

    query = `DELETE FROM public."boolenumtypes"`;
    dataSources.CreateQueryFromOverlay(dsName, query, "deleteAllRecords");

    query = `DROP table public."boolenumtypes"`;
    dataSources.CreateQueryFromOverlay(dsName, query, "dropTable");

    query = `drop type weekdays`;
    dataSources.CreateQueryFromOverlay(dsName, query, "dropEnum");

    entityExplorer.ExpandCollapseEntity("Queries/JS", false);
    entityExplorer.ExpandCollapseEntity(dsName, false);
  });

  it("2. Inserting record - boolenumtypes", () => {
    entityExplorer.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locators._modal);
    agHelper.SelectDropDown("Monday");
    agHelper.ToggleSwitch("Areweworking");
    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Insert did not fail
    agHelper.AssertElementVisible(locators._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Monday");
    });
    table.ReadTableRowColumnData(0, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("true");
    });
  });

  it("3. Inserting another record - boolenumtypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locators._modal);
    agHelper.SelectDropDown("Saturday");
    agHelper.ToggleSwitch("Areweworking", "uncheck");
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locators._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Saturday");
    });
    table.ReadTableRowColumnData(1, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("false");
    });
  });

  it("4. Inserting another record - boolenumtypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locators._modal);
    agHelper.SelectDropDown("Friday");
    agHelper.ToggleSwitch("Areweworking", "uncheck");
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locators._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Friday");
    });
    table.ReadTableRowColumnData(2, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("false");
    });
  });

  it("5. Updating record - boolenumtypes", () => {
    table.SelectTableRow(2);
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locators._modal);
    agHelper.ToggleSwitch("Areweworking", "check");
    agHelper.ClickButton("Update");
    agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Update did not fail
    agHelper.AssertElementVisible(locators._spanButton("Run UpdateQuery"));
    table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Friday");
    });
    table.ReadTableRowColumnData(2, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("true");
    });
  });

  it("6. Validating Enum Ordering", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    query = `SELECT * FROM boolenumtypes WHERE workingday > 'Tuesday';`;
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("verifyEnumOrdering");
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
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Query,
    });
    entityExplorer.ExpandCollapseEntity("Queries/JS", false);
  });

  it("7. Deleting records - boolenumtypes", () => {
    entityExplorer.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitUntilTableLoad();
    table.SelectTableRow(1);
    agHelper.ClickButton("DeleteQuery", 1);
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    agHelper.Sleep(2500); //Allwowing time for delete to be success
    table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).not.to.eq("2"); //asserting 2nd record is deleted
    });
    table.ReadTableRowColumnData(1, 0, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("3");
    });

    //Deleting all records from table
    agHelper.GetNClick(locators._deleteIcon);
    agHelper.AssertElementVisible(locators._spanButton("Run InsertQuery"));
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("8. Inserting another record (to check serial column) - boolenumtypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locators._modal);
    agHelper.SelectDropDown("Wednesday");
    agHelper.ToggleSwitch("Areweworking", "check");
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locators._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Wednesday");
    });
    table.ReadTableRowColumnData(0, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("true");
    });
  });

  after(
    "Verify Deletion of the datasource after all created queries are deleted",
    () => {
      //Drop table:

      deployMode.NavigateBacktoEditor();
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      entityExplorer.SelectEntityByName("dropTable");
      dataSources.RunQuery();
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("0"); //Success response for dropped table!
      });
      entityExplorer.ExpandCollapseEntity("Queries/JS", false);
      entityExplorer.ExpandCollapseEntity("Datasources");
      entityExplorer.ExpandCollapseEntity(dsName);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: dsName,
        action: "Refresh",
      });
      agHelper.AssertElementAbsence(
        entityExplorer._entityNameInExplorer("public.boolenumtypes"),
      );
      entityExplorer.ExpandCollapseEntity(dsName, false);
      entityExplorer.ExpandCollapseEntity("Datasources", false);

      //Delete queries
      dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      entityExplorer.DeleteAllQueriesForDB(dsName);

      //Delete ds
      deployMode.DeployApp();
      deployMode.NavigateBacktoEditor();
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
    },
  );
});
