import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any, query: string;

describe("Boolean & Enum Datatype tests", function () {
  before("Create Postgress DS, Add dsl, Appply theme", () => {
    cy.fixture("Datatypes/BooleanEnumDTdsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
    _.appSettings.OpenPaneAndChangeThemeColors(-18, -20);
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Creating enum & table queries - boolenumtypes + Bug 14493", () => {
    query = `CREATE TYPE weekdays AS ENUM ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');`;
    _.dataSources.CreateQueryAfterDSSaved(query, "createEnum");
    _.dataSources.RunQuery();

    query = `create table boolenumtypes (serialId SERIAL not null primary key, workingDay weekdays, AreWeWorking boolean)`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "createTable");
    _.dataSources.RunQuery();

    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ExpandCollapseEntity(dsName); //Clicking Create Query from Active DS is already expanding ds
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementVisible(
      _.entityExplorer._entityNameInExplorer("public.boolenumtypes"),
    );

    //Select query:
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.boolenumtypes",
      "SELECT",
    );
    _.agHelper.RenameWithInPane("selectRecords");
    _.dataSources.RunQuery();
    _.agHelper
      .GetText(_.dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));

    //Other queries
    query = `INSERT INTO public."boolenumtypes" ("workingday", "areweworking") VALUES ({{Insertworkingday.selectedOptionValue}}, {{Insertareweworking.isSwitchedOn}})`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "insertRecord");

    query = `UPDATE public."boolenumtypes" SET "workingday" = {{Updateworkingday.selectedOptionValue}}, "areweworking" = {{Updateareweworking.isSwitchedOn}} WHERE serialid = {{Table1.selectedRow.serialid}};`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "updateRecord");

    query = `SELECT * from enum_range(NULL::weekdays)`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "getEnum");

    query = `DELETE FROM public."boolenumtypes" WHERE serialId ={{Table1.selectedRow.serialid}}`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "deleteRecord");

    query = `DELETE FROM public."boolenumtypes"`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "deleteAllRecords");

    query = `DROP table public."boolenumtypes"`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "dropTable");

    query = `drop type weekdays`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "dropEnum");

    _.entityExplorer.ExpandCollapseEntity("Queries/JS", false);
    _.entityExplorer.ExpandCollapseEntity(dsName, false);
  });

  it("2. Inserting record - boolenumtypes", () => {
    _.entityExplorer.SelectEntityByName("Page1");
    _.deployMode.DeployApp();
    _.table.WaitForTableEmpty(); //asserting _.table is empty before inserting!
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.SelectDropDown("Monday");
    _.agHelper.ToggleSwitch("Areweworking");
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementAbsence(_.locators._toastMsg); //Assert that Insert did not fail
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Monday");
    });
    _.table.ReadTableRowColumnData(0, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("true");
    });
  });

  it("3. Inserting another record - boolenumtypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.SelectDropDown("Saturday");
    _.agHelper.ToggleSwitch("Areweworking", "uncheck");
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Saturday");
    });
    _.table.ReadTableRowColumnData(1, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("false");
    });
  });

  it("4. Inserting another record - boolenumtypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.SelectDropDown("Friday");
    _.agHelper.ToggleSwitch("Areweworking", "uncheck");
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Friday");
    });
    _.table.ReadTableRowColumnData(2, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("false");
    });
  });

  it("5. Updating record - boolenumtypes", () => {
    _.table.SelectTableRow(2);
    _.agHelper.ClickButton("Run UpdateQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.ToggleSwitch("Areweworking", "check");
    _.agHelper.ClickButton("Update");
    _.agHelper.AssertElementAbsence(_.locators._toastMsg); //Assert that Update did not fail
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run UpdateQuery"));
    _.table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Friday");
    });
    _.table.ReadTableRowColumnData(2, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("true");
    });
  });

  it("6. Validating Enum Ordering", () => {
    _.deployMode.NavigateBacktoEditor();
    _.table.WaitUntilTableLoad();
    query = `SELECT * FROM boolenumtypes WHERE workingday > 'Tuesday';`;
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.CreateNewDsQuery(dsName);
    _.agHelper.RenameWithInPane("verifyEnumOrdering");
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Saturday");
    });
    _.dataSources.ReadQueryTableResponse(4).then(($cellData) => {
      expect($cellData).to.eq("Friday");
    });

    query = `SELECT * FROM boolenumtypes WHERE workingday = (SELECT MIN(workingday) FROM boolenumtypes);`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Monday");
    });
    _.agHelper.ActionContextMenuWithInPane("Delete");
    _.entityExplorer.ExpandCollapseEntity("Queries/JS", false);
  });

  it("7. Deleting records - boolenumtypes", () => {
    _.entityExplorer.SelectEntityByName("Page1");
    _.deployMode.DeployApp();
    _.table.WaitUntilTableLoad();
    _.table.SelectTableRow(1);
    _.agHelper.ClickButton("DeleteQuery", 1);
    _.agHelper.ValidateNetworkStatus("@postExecute", 200);
    _.agHelper.ValidateNetworkStatus("@postExecute", 200);
    _.agHelper.Sleep(2500); //Allwowing time for delete to be success
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).not.to.eq("2"); //asserting 2nd record is deleted
    });
    _.table.ReadTableRowColumnData(1, 0, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("3");
    });

    //Deleting all records from table
    _.agHelper.GetNClick(_.locators._deleteIcon);
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.agHelper.Sleep(2000);
    _.table.WaitForTableEmpty();
  });

  it("8. Inserting another record (to check serial column) - boolenumtypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.SelectDropDown("Wednesday");
    _.agHelper.ToggleSwitch("Areweworking", "check");
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Wednesday");
    });
    _.table.ReadTableRowColumnData(0, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("true");
    });
  });

  after(
    "Verify Deletion of the datasource after all created queries are Deleted",
    () => {
      //Drop table:

      _.deployMode.NavigateBacktoEditor();
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
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
        _.entityExplorer._entityNameInExplorer("public.boolenumtypes"),
      );
      _.entityExplorer.ExpandCollapseEntity(dsName, false);
      _.entityExplorer.ExpandCollapseEntity("Datasources", false);

      //Delete queries
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      _.entityExplorer.ActionContextMenuByEntityName(
        "createEnum",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "createTable",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "deleteAllRecords",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "deleteRecord",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "dropTable",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "dropEnum",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "getEnum",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "insertRecord",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "selectRecords",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "updateRecord",
        "Delete",
        "Are you sure?",
      );

      //Delete ds
      _.deployMode.DeployApp();
      _.deployMode.NavigateBacktoEditor();
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
    },
  );
});
