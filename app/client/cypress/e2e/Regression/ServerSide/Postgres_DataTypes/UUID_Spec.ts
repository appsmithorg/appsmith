import {
  agHelper,
  apiPage,
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
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(
  "UUID Datatype tests",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let dsName: any, query: string, imageNameToUpload: string;

    before("Importing App & setting theme", () => {
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
      agHelper.AddDsl("Datatypes/UUIDDTdsl");

      appSettings.OpenPaneAndChangeTheme("Earth");
    });

    it("1. Creating supporting api's for generating random UUID's", () => {
      cy.fixture("datasources").then((datasourceFormData) => {
        apiPage.CreateAndFillApi(datasourceFormData.uuid1Api, "version1");
        apiPage.CreateAndFillApi(datasourceFormData.uuid4Api, "version4");
        apiPage.CreateAndFillApi(datasourceFormData.nillApi, "nill");
      });
    });

    it("2. Creating table query - uuidtype", () => {
      query = `CREATE table uuidtype (serialid SERIAL primary key, v1 uuid, v4 uuid, nil uuid);`;
      dataSources.CreateQueryForDS(dsName, query, "createTable");
      dataSources.RunQuery();
    });

    it("3. Creating SELECT query - uuidtype + Bug 14493", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.uuidtype",
        "Select",
      );
      dataSources.RunQuery();
      agHelper
        .GetText(dataSources._noRecordFound)
        .then(($noRecMsg) =>
          expect($noRecMsg).to.eq("No data records to show"),
        );
      agHelper.RenameWithInPane("selectRecords");
    });

    it("4. Creating all queries - uuidtype", () => {
      query = `INSERT INTO public."uuidtype" ("v1", "v4", "nil") VALUES ('{{version1.data}}', '{{version4.data}}', '{{nill.data}}');`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("insertRecord");

      query = `UPDATE public."uuidtype" SET "v1" ='{{version1.data ? version1.data : Table1.selectedRow.v1}}', "v4" ='{{version4.data ? version4.data : Table1.selectedRow.v4}}', "nil" ='{{nill.data ? nill.data : Table1.selectedRow.nil}}' WHERE serialid = {{Table1.selectedRow.serialid}};`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("updateRecord");

      query = `DELETE FROM public."uuidtype"`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("deleteAllRecords");

      query = `drop table public."uuidtype"`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("dropTable");

      query = `DELETE FROM public."uuidtype" WHERE serialId = {{Table1.selectedRow.serialid}}`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("deleteRecord");
    });

    it("5. Inserting record - uuidtype", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      table.WaitForTableEmpty(); //asserting table is empty before inserting!
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.ClickButton("Generate UUID's");
      agHelper.AssertContains("All UUIDs generated & available");
      agHelper.ClickButton("Insert");
      agHelper.AssertElementAbsence(
        locators._specificToast("failed to execute"),
      ); //Assert that Insert did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.WaitUntilTableLoad();
      table.ReadTableRowColumnData(0, 0).then(($cellData) => {
        expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(0, 1, "v1", 200).then(($v1) => {
        expect($v1).not.empty;
      });
      table.ReadTableRowColumnData(0, 2, "v1", 200).then(($v4) => {
        expect($v4).not.empty;
      });
      table.ReadTableRowColumnData(0, 3, "v1", 200).then(($nil) => {
        expect($nil).not.empty;
      });
    });

    it("6. Inserting another record - uuidtype", () => {
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.ClickButton("Generate UUID's");
      agHelper.AssertContains("All UUIDs generated & available");

      agHelper.ClickButton("Insert");
      agHelper.AssertElementAbsence(
        locators._specificToast("failed to execute"),
      ); //Assert that Insert did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.WaitUntilTableLoad();
      table.ReadTableRowColumnData(1, 0).then(($cellData) => {
        expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(1, 1, "v1", 200).then(($v1) => {
        expect($v1).not.empty;
      });
      table.ReadTableRowColumnData(1, 2, "v1", 200).then(($v4) => {
        expect($v4).not.empty;
      });
      table.ReadTableRowColumnData(1, 3, "v1", 200).then(($nil) => {
        expect($nil).not.empty;
      });
    });

    it("7. Inserting another record - uuidtype", () => {
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.ClickButton("Generate UUID's");
      agHelper.AssertContains("All UUIDs generated & available");

      agHelper.ClickButton("Insert");
      agHelper.AssertElementAbsence(
        locators._specificToast("failed to execute"),
      ); //Assert that Insert did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.WaitUntilTableLoad();
      table.ReadTableRowColumnData(2, 0).then(($cellData) => {
        expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(2, 1, "v1", 200).then(($v1) => {
        expect($v1).not.empty;
      });
      table.ReadTableRowColumnData(2, 2, "v1", 200).then(($v4) => {
        expect($v4).not.empty;
      });
      table.ReadTableRowColumnData(2, 3, "v1", 200).then(($nil) => {
        expect($nil).not.empty;
      });
    });

    it("8. Updating record - uuidtype - updating only v1", () => {
      table.SelectTableRow(2); //As Table Selected row has issues due to fast selction
      agHelper.Sleep(2000); //for table selection to be captured

      table.ReadTableRowColumnData(2, 1, "v1", 200).then(($oldV1) => {
        table.ReadTableRowColumnData(2, 2, "v1", 200).then(($oldV4) => {
          agHelper.ClickButton("Run UpdateQuery");
          agHelper.AssertElementVisibility(locators._modal);

          agHelper.ClickButton("Generate new v1");
          agHelper.AssertContains("New V1 UUID available!");

          agHelper.ClickButton("Update");
          agHelper.AssertElementAbsence(
            locators._specificToast("failed to execute"),
          ); //Assert that Insert did not fail
          agHelper.AssertElementVisibility(
            locators._buttonByText("Run UpdateQuery"),
          );
          table.WaitUntilTableLoad();
          agHelper.Sleep(5000); //some more time for rows to rearrange for CI flakyness!
          table.ReadTableRowColumnData(2, 0).then(($cellData) => {
            expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
          });
          table.ReadTableRowColumnData(2, 1, "v1", 200).then(($newV1) => {
            expect($oldV1).to.not.eq($newV1); //making sure new v1 is updated
          });
          table.ReadTableRowColumnData(2, 2, "v1", 200).then(($newV4) => {
            expect($oldV4).to.eq($newV4); //making sure new v4 is not updated
          });
        });
      });
    });

    it("9. Updating record - uuidtype - updating v4 ", () => {
      //table.SelectTableRow(2); //As Table Selected row has issues due to fast selction
      table.ReadTableRowColumnData(2, 1, "v1", 200).then(($oldV1) => {
        table.ReadTableRowColumnData(2, 2, "v1", 200).then(($oldV4) => {
          //table.ReadTableRowColumnData(2, 3, "v1", 200).then(($oldguid) => {
          agHelper.ClickButton("Run UpdateQuery");
          agHelper.AssertElementVisibility(locators._modal);

          agHelper.ClickButton("Generate new v4");
          agHelper.AssertContains("New V4 UUID available!");

          agHelper.ClickButton("Update");
          agHelper.AssertElementAbsence(
            locators._specificToast("failed to execute"),
          ); //Assert that Insert did not fail
          agHelper.AssertElementVisibility(
            locators._buttonByText("Run UpdateQuery"),
          );
          table.WaitUntilTableLoad();
          table.ReadTableRowColumnData(2, 0).then(($cellData) => {
            expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
          });
          table.ReadTableRowColumnData(2, 1, "v1", 200).then(($newV1) => {
            expect($oldV1).to.eq($newV1); //making sure v1 is same
          });
          table.ReadTableRowColumnData(2, 2, "v1", 200).then(($newV4) => {
            expect($oldV4).to.not.eq($newV4); //making sure new v4 is updated
          });
          /*table.ReadTableRowColumnData(2, 3, "v1", 200).then(($newguid) => {
            expect($oldguid).to.not.eq($newguid); //making sure new guid is updated
          }); */
        });
      });
    });

    it("10. Validating UUID functions", () => {
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      //Validating use of extention
      query = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
      dataSources.CreateQueryForDS(dsName, query, "verifyUUIDFunctions");
      dataSources.runQueryAndVerifyResponseViews(1);
      dataSources.AssertQueryResponseHeaders(["affectedRows"]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("0");
      });

      agHelper.Sleep(2000); // Above entensions settling time

      //Validating generation of new uuid via the extension package
      query = `SELECT uuid_generate_v1() as v1, uuid_generate_v4() as v4, gen_random_uuid() as cryptov4, uuid_in(overlay(overlay(md5(random()::text || ':' || random()::text) placing '4' from 13) placing to_hex(floor(random()*(11-8+1) + 8)::int)::text from 17)::cstring) as form_uuid1, uuid_in(md5(random()::text || random()::text)::cstring) as form_uuid2;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "v1",
        "v4",
        "cryptov4",
        "form_uuid1",
        "form_uuid2",
      ]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).not.to.be.empty;
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).not.to.be.empty;
      });
      dataSources.ReadQueryTableResponse(2).then(($cellData) => {
        expect($cellData).not.to.be.empty;
      });
      dataSources.ReadQueryTableResponse(3).then(($cellData) => {
        expect($cellData).not.to.be.empty;
      });
      dataSources.ReadQueryTableResponse(4).then(($cellData) => {
        expect($cellData).not.to.be.empty;
      });

      //Validating Addition of new column taking default value form package method
      query = `ALTER TABLE uuidtype ADD COLUMN newUUID uuid DEFAULT uuid_generate_v4();`;
      dataSources.EnterQuery(query);
      dataSources.runQueryAndVerifyResponseViews(1);
      dataSources.AssertQueryResponseHeaders(["affectedRows"]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("0");
      });
      deployMode.DeployApp();
      table.WaitUntilTableLoad();
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
      EditorNavigation.SelectEntityByName(
        "verifyUUIDFunctions",
        EntityType.Query,
      );

      //Validating altering the new column default value to generate id from pgcrypto package
      query = `ALTER TABLE uuidtype ALTER COLUMN newUUID SET DEFAULT gen_random_uuid();`;
      dataSources.EnterQuery(query);
      dataSources.runQueryAndVerifyResponseViews(1);
      dataSources.AssertQueryResponseHeaders(["affectedRows"]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("0");
      });
      deployMode.DeployApp();
      table.WaitUntilTableLoad();

      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
      EditorNavigation.SelectEntityByName(
        "verifyUUIDFunctions",
        EntityType.Query,
      );
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("11. Deleting records - uuidtype", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      table.WaitUntilTableLoad();
      table.SelectTableRow(1);
      agHelper.ClickButton("DeleteQuery", 1);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      table.ReadTableRowColumnData(1, 0).then(($cellData) => {
        expect($cellData).not.to.eq("2"); //asserting 2nd record is deleted
      });
    });

    it("12. Deleting all records from table - uuidtype", () => {
      agHelper.GetNClick(locators._deleteIcon);
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      agHelper.Sleep(2000);
      table.WaitForTableEmpty();
    });

    it("13. Inserting another record (to check serial column & new default column added) - uuidtype", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.ClickButton("Generate UUID's");
      agHelper.AssertContains("All UUIDs generated & available");

      agHelper.ClickButton("Insert");
      agHelper.AssertElementAbsence(
        locators._specificToast("failed to execute"),
      ); //Assert that Insert did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.WaitUntilTableLoad();
      table.ReadTableRowColumnData(0, 0).then(($cellData) => {
        expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(0, 1, "v1", 200).then(($v1) => {
        expect($v1).not.empty;
      });
      table.ReadTableRowColumnData(0, 2, "v1", 200).then(($v4) => {
        expect($v4).not.empty;
      });
      table.ReadTableRowColumnData(0, 3, "v1", 200).then(($nil) => {
        expect($nil).not.empty;
      });
      table.ReadTableRowColumnData(0, 4, "v1", 200).then(($newGenUUID) => {
        expect($newGenUUID).not.empty;
      });
    });

    it("14. Validate Drop of the Newly Created - uuidtype - Table from Postgres datasource", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("dropTable", EntityType.Query);
      dataSources.RunQuery();
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("0"); //Success response for dropped table!
      });
      dataSources.AssertTableInVirtuosoList(dsName, "public.uuidtype", false);
    });

    it("15. Verify Deletion of all created queries", () => {
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Since all queries exists
      entityExplorer.DeleteAllQueriesForDB(dsName);
    });

    it("16. Verify Deletion of datasource", () => {
      deployMode.DeployApp();
      deployMode.NavigateBacktoEditor();
      dataSources.DeleteDatasourceFromWithinDS(dsName, 200);
    });
  },
);
