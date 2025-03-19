import {
  agHelper,
  appSettings,
  assertHelper,
  dataSources,
  deployMode,
  entityExplorer,
  entityItems,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Boolean & Enum Datatype tests",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
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
      dataSources.RunQuery({ toValidateResponse: false });

      query = `create table boolenumtypes (serialId SERIAL not null primary key, workingDay weekdays, AreWeWorking boolean)`;
      dataSources.CreateQueryFromOverlay(dsName, query, "createTable");
      dataSources.RunQuery({ toValidateResponse: false });

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

      //Select query:
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.boolenumtypes",
        "Select",
      );
      agHelper.RenameQuery("selectRecords");
      dataSources.RunQuery();
      agHelper
        .GetText(dataSources._noRecordFound)
        .then(($noRecMsg) =>
          expect($noRecMsg).to.eq("No data records to show"),
        );
    });

    it("2. Inserting record - boolenumtypes", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      table.WaitForTableEmpty(); //asserting table is empty before inserting!
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.SelectDropDown("Monday");
      agHelper.ToggleSwitch("Areweworking");
      agHelper.ClickButton("Insert");
      agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Insert did not fail
      // agHelper.AssertElementAbsence(
      //   locators._specificToast("Error while inserting resource"),
      // );
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
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
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.SelectDropDown("Saturday");
      agHelper.ToggleSwitch("Areweworking", "uncheck");
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
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
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.SelectDropDown("Friday");
      agHelper.ToggleSwitch("Areweworking", "uncheck");
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
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
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.ToggleSwitch("Areweworking", "check");
      agHelper.ClickButton("Update");
      agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Update did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run UpdateQuery"),
      );
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
      entityExplorer.CreateNewDsQuery(dsName);
      agHelper.RenameQuery("verifyEnumOrdering");
      dataSources.EnterQuery(query);
      dataSources.RunQuery({ toValidateResponse: false });
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
    });

    it("7. Deleting records - boolenumtypes", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
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
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      agHelper.Sleep(2000);
      table.WaitForTableEmpty();
    });

    it("8. Inserting another record (to check serial column) - boolenumtypes", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.SelectDropDown("Wednesday");
      agHelper.ToggleSwitch("Areweworking", "check");
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
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
        EditorNavigation.SelectEntityByName("dropTable", EntityType.Query);
        dataSources.RunQuery();
        dataSources.ReadQueryTableResponse(0).then(($cellData) => {
          expect($cellData).to.eq("0"); //Success response for dropped table!
        });

        //Delete queries
        dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Since all queries exists
        AppSidebar.navigate(AppSidebarButton.Editor);
        entityExplorer.DeleteAllQueriesForDB(dsName);

        //Delete ds
        deployMode.DeployApp();
        deployMode.NavigateBacktoEditor();
        dataSources.DeleteDatasourceFromWithinDS(dsName, 200);
      },
    );
  },
);
