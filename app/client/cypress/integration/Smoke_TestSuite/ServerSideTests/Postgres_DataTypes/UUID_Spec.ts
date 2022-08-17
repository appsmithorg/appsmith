import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any, query: string, imageNameToUpload: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode,
  apiPage = ObjectsRegistry.ApiPage;

describe("UUID Datatype tests", function() {
  before(() => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("0. Importing App & setting theme", () => {
    cy.fixture("Datatypes/UUIDDTdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    ee.NavigateToSwitcher("widgets");
    propPane.ChangeTheme("Earth");
  });

  it("1. Creating supporting api's for generating random UUID's", () => {
    apiPage.CreateAndFillApi(
      "https://www.uuidgenerator.net/api/version1",
      "version1",
    );
    apiPage.CreateAndFillApi(
      "https://www.uuidgenerator.net/api/version4",
      "version4",
    );
    apiPage.CreateAndFillApi("https://www.uuidgenerator.net/api/guid", "guid");
    apiPage.CreateAndFillApi(
      "https://www.uuidgenerator.net/api/version-nil",
      "nill",
    );
  });

  it("2. Creating table query - uuidtype", () => {
    query = `CREATE table uuidtype (serialid SERIAL primary key, v1 uuid, v4 uuid, guid uuid, nil uuid);`;
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("createTable");
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(ee._entityNameInExplorer("public.uuidtype"));
  });

  it("3. Creating SELECT query - uuidtype + Bug 14493", () => {
    ee.ActionTemplateMenuByEntityName("public.uuidtype", "SELECT");
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
  });

  it("4. Creating all queries - uuidtype", () => {
    query = `INSERT INTO public."uuidtype" ("v1", "v4", "guid", "nil") VALUES ('{{version1.data}}', '{{version4.data}}', '{{guid.data}}', '{{nill.data}}');`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("insertRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `UPDATE public."uuidtype" SET "v1" ='{{version1.data ? version1.data : Table1.selectedRow.v1}}', "v4" ='{{version4.data ? version4.data : Table1.selectedRow.v4}}', "guid" ='{{guid.data ? guid.data :  Table1.selectedRow.guid}}', "nil" ='{{nill.data ? nill.data : Table1.selectedRow.nil}}' WHERE serialid = {{Table1.selectedRow.serialid}};`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("updateRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."uuidtype" WHERE serialId = {{Table1.selectedRow.serialid}}`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."uuidtype"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteAllRecords");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `drop table public."uuidtype"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("dropTable");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    ee.ExpandCollapseEntity("QUERIES/JS", false);
    ee.ExpandCollapseEntity(dsName, false);
  });

  it("5. Inserting record - uuidtype", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.ClickButton("Generate UUID's");
    agHelper.WaitUntilToastDisappear("All UUIDs generated & available");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Insert did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.WaitUntilTableLoad();
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($v1) => {
      expect($v1).not.empty;
    });
    table.ReadTableRowColumnData(0, 2, 200).then(($v4) => {
      expect($v4).not.empty;
    });
    table.ReadTableRowColumnData(0, 3, 200).then(($guid) => {
      expect($guid).not.empty;
    });
    table.ReadTableRowColumnData(0, 4, 200).then(($nil) => {
      expect($nil).not.empty;
    });
  });

  it("6. Inserting another record - uuidtype", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.ClickButton("Generate UUID's");
    agHelper.WaitUntilToastDisappear("All UUIDs generated & available");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Insert did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.WaitUntilTableLoad();
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, 200).then(($v1) => {
      expect($v1).not.empty;
    });
    table.ReadTableRowColumnData(1, 2, 200).then(($v4) => {
      expect($v4).not.empty;
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($guid) => {
      expect($guid).not.empty;
    });
    table.ReadTableRowColumnData(1, 4, 200).then(($nil) => {
      expect($nil).not.empty;
    });
  });

  it("7. Inserting another record - uuidtype", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.ClickButton("Generate UUID's");
    agHelper.WaitUntilToastDisappear("All UUIDs generated & available");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Insert did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.WaitUntilTableLoad();
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($v1) => {
      expect($v1).not.empty;
    });
    table.ReadTableRowColumnData(2, 2, 200).then(($v4) => {
      expect($v4).not.empty;
    });
    table.ReadTableRowColumnData(2, 3, 200).then(($guid) => {
      expect($guid).not.empty;
    });
    table.ReadTableRowColumnData(2, 4, 200).then(($nil) => {
      expect($nil).not.empty;
    });
  });

  it("8. Updating record - uuidtype - updating only v1", () => {
    table.SelectTableRow(2); //As Table Selected row has issues due to fast selction
    agHelper.Sleep(2000); //for table selection to be captured

    table.ReadTableRowColumnData(2, 1, 200).then(($oldV1) => {
      table.ReadTableRowColumnData(2, 2, 2000).then(($oldV4) => {
        agHelper.ClickButton("Run UpdateQuery");
        agHelper.AssertElementVisible(locator._modal);

        agHelper.ClickButton("Generate new v1");
        agHelper.WaitUntilToastDisappear("New V1 UUID available!");

        agHelper.ClickButton("Update");
        agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Update did not fail
        agHelper.AssertElementVisible(locator._spanButton("Run UpdateQuery"));
        table.WaitUntilTableLoad();
        table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
          expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
        });
        table.ReadTableRowColumnData(2, 1, 200).then(($newV1) => {
          expect($oldV1).to.not.eq($newV1); //making sure new v1 is updated
        });
        table.ReadTableRowColumnData(2, 2, 200).then(($newV4) => {
          expect($oldV4).to.eq($newV4); //making sure new v4 is not updated
        });
      });
    });
  });

  it("9. Updating record - uuidtype - updating v4, guid", () => {
    //table.SelectTableRow(2); //As Table Selected row has issues due to fast selction
    table.ReadTableRowColumnData(2, 1, 200).then(($oldV1) => {
      table.ReadTableRowColumnData(2, 2, 2000).then(($oldV4) => {
        table.ReadTableRowColumnData(2, 3, 2000).then(($oldguid) => {
          agHelper.ClickButton("Run UpdateQuery");
          agHelper.AssertElementVisible(locator._modal);

          agHelper.ClickButton("Generate new v4");
          agHelper.WaitUntilToastDisappear("New V4 UUID available!");

          agHelper.ClickButton("Generate new GUID");
          agHelper.WaitUntilToastDisappear("New GUID available!");

          agHelper.ClickButton("Update");
          agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Update did not fail
          agHelper.AssertElementVisible(locator._spanButton("Run UpdateQuery"));
          table.WaitUntilTableLoad();
          table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
            expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
          });
          table.ReadTableRowColumnData(2, 1, 200).then(($newV1) => {
            expect($oldV1).to.eq($newV1); //making sure v1 is same
          });
          table.ReadTableRowColumnData(2, 2, 200).then(($newV4) => {
            expect($oldV4).to.not.eq($newV4); //making sure new v4 is updated
          });
          table.ReadTableRowColumnData(2, 3, 200).then(($newguid) => {
            expect($oldguid).to.not.eq($newguid); //making sure new guid is updated
          });
        });
      });
    });
  });

  it("10. Validating UUID functions", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    ee.ExpandCollapseEntity("QUERIES/JS");
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.RenameWithInPane("verifyUUIDFunctions");

    //Validating use of extention
    query = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.RunQueryNVerifyResponseViews(1);
    dataSources.AssertQueryResponseHeaders(["affectedRows"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0");
    });

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
    dataSources.RunQueryNVerifyResponseViews(1);
    dataSources.AssertQueryResponseHeaders(["affectedRows"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0");
    });
    deployMode.DeployApp();
    table.WaitUntilTableLoad();
    table.ReadTableRowColumnData(1, 5, 200).then(($newFormedguid1) => {
      expect($newFormedguid1).not.to.be.empty; //making sure new guid is set for row

      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
      ee.ExpandCollapseEntity("QUERIES/JS");
      ee.SelectEntityByName("verifyUUIDFunctions");

      //Validating altering the new column default value to generate id from pgcrypto package
      query = `ALTER TABLE uuidtype ALTER COLUMN newUUID SET DEFAULT gen_random_uuid();`;
      dataSources.EnterQuery(query);
      dataSources.RunQueryNVerifyResponseViews(1);
      dataSources.AssertQueryResponseHeaders(["affectedRows"]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("0");
      });
      deployMode.DeployApp();
      table.WaitUntilTableLoad();
      table.ReadTableRowColumnData(1, 5, 200).then(($newFormedguid2) => {
        expect($newFormedguid1).to.eq($newFormedguid2);
      });
    });

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("verifyUUIDFunctions");
    agHelper.ActionContextMenuWithInPane("Delete");
    ee.ExpandCollapseEntity("QUERIES/JS", false);
  });

  it("11. Deleting records - uuidtype", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitUntilTableLoad();
    table.SelectTableRow(1);
    agHelper.ClickButton("DeleteQuery", 1);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData)
        .not.to.eq("2"); //asserting 2nd record is deleted
    });
  });

  it("12. Deleting all records from table - uuidtype", () => {
    agHelper.GetNClick(locator._deleteIcon);
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("13. Inserting another record (to check serial column & new default column added) - uuidtype", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.ClickButton("Generate UUID's");
    agHelper.WaitUntilToastDisappear("All UUIDs generated & available");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Insert did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.WaitUntilTableLoad();
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($v1) => {
      expect($v1).not.empty;
    });
    table.ReadTableRowColumnData(0, 2, 200).then(($v4) => {
      expect($v4).not.empty;
    });
    table.ReadTableRowColumnData(0, 3, 200).then(($guid) => {
      expect($guid).not.empty;
    });
    table.ReadTableRowColumnData(0, 4, 200).then(($nil) => {
      expect($nil).not.empty;
    });
    table.ReadTableRowColumnData(0, 5, 200).then(($newGenUUID) => {
      expect($newGenUUID).not.empty;
    });
  });

  it("14. Validate Drop of the Newly Created - uuidtype - Table from Postgres datasource", () => {
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
    agHelper.AssertElementAbsence(ee._entityNameInExplorer("public.uuidtype"));
    ee.ExpandCollapseEntity(dsName, false);
    ee.ExpandCollapseEntity("DATASOURCES", false);
  });

  it("15. Verify Deletion of all created queries", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
    ee.ExpandCollapseEntity("QUERIES/JS");
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

    //Deleting APi's also
    ee.ActionContextMenuByEntityName("guid", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("nill", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("version4", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("version1", "Delete", "Are you sure?");
  });

  it("16. Verify Deletion of datasource", () => {
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("QUERIES/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
  });
});
