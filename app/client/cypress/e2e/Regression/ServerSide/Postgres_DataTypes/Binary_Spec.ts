import {
  agHelper,
  appSettings,
  assertHelper,
  dataSources,
  deployMode,
  entityItems,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Binary Datatype tests",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let dsName: any, query: string, imageNameToUpload: string;

    before("Create DS, Importing App & setting theme", () => {
      agHelper.AddDsl("Datatypes/BinaryDTdsl");
      appSettings.OpenPaneAndChangeThemeColors(7, -9);
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
    });

    it("1. Creating SELECT query - binarytype + Bug 14493", () => {
      query = `CREATE table binarytype (serialid SERIAL primary key, imagename TEXT, existingImage bytea, newImage bytea);`;
      dataSources.CreateQueryAfterDSSaved(query, "createTable");
      dataSources.RunQuery();

      //Creating SELECT query - binarytype + Bug 14493
      query = `SELECT binarytype.serialid, binarytype.imagename, encode(binarytype.existingimage, 'escape') as "OldImage", encode(binarytype.newimage, 'escape') as "NewImage" from public."binarytype";`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.binarytype",
        "Select",
      );
      dataSources.RunQuery();
      agHelper
        .GetText(dataSources._noRecordFound)
        .then(($noRecMsg) =>
          expect($noRecMsg).to.eq("No data records to show"),
        );
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("selectRecords");
    });

    it("2. Creating all queries- binarytype", () => {
      //Other queries
      query = `INSERT INTO public."binarytype" ("imagename", "existingimage", "newimage") VALUES ('{{Insertimagename.text}}', '{{Insertimage.files[0].data}}', '{{Insertimage.files[0].data}}');`;
      dataSources.CreateQueryFromOverlay(dsName, query, "insertRecord");
      dataSources.SetQueryTimeout(30000);

      query = `UPDATE public."binarytype" SET "imagename" ='{{Updatename.text}}', "existingimage" = '{{Table1.selectedRow.OldImage}}',  "newimage" = '{{Updateimage.files[0].data}}' WHERE serialid = {{Table1.selectedRow.serialid}};`;
      dataSources.CreateQueryFromOverlay(dsName, query, "updateRecord");
      dataSources.SetQueryTimeout(30000);

      query = `DELETE FROM public."binarytype" WHERE serialId = {{Table1.selectedRow.serialid}}`;
      dataSources.CreateQueryFromOverlay(dsName, query, "deleteRecord");
      dataSources.SetQueryTimeout(30000);

      query = `DELETE FROM public."binarytype"`;
      dataSources.CreateQueryFromOverlay(dsName, query, "deleteAllRecords");
      dataSources.SetQueryTimeout(30000);

      query = `DROP table public."binarytype"`;
      dataSources.CreateQueryFromOverlay(dsName, query, "dropTable");
      dataSources.SetQueryTimeout(30000);

      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      table.WaitForTableEmpty(); //asserting table is empty before inserting!
    });

    it("3. Inserting another record - binarytype", () => {
      imageNameToUpload = "Datatypes/Georgia.jpeg";

      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.ClickButton("Select New Image");
      agHelper.UploadFile(imageNameToUpload);

      agHelper.ClickButton("Insert");
      agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Insert did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      agHelper.AssertElementAbsence(locators._btnSpinner, 20000); //for the update row to appear at last
      table.WaitUntilTableLoad();
      const rowIndex = 0;
      table.ReadTableRowColumnData(rowIndex, 0).then(($cellData) => {
        expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(rowIndex, 1, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Georgia.jpeg");
      });
      table.AssertTableRowImageColumnIsLoaded(rowIndex, 2).then(($oldimage) => {
        table
          .AssertTableRowImageColumnIsLoaded(rowIndex, 3)
          .then(($newimage) => {
            expect($oldimage).to.eq($newimage);
          });
      });
    });

    it("4. Inserting another record - binarytype", () => {
      imageNameToUpload = "Datatypes/Maine.jpeg";

      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.ClickButton("Select New Image");
      agHelper.UploadFile(imageNameToUpload);

      agHelper.ClickButton("Insert");
      agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Insert did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      agHelper.AssertElementAbsence(locators._btnSpinner, 20000); //for the update row to appear at last
      table.WaitUntilTableLoad();
      const rowIndex = 1;
      table.ReadTableRowColumnData(rowIndex, 0).then(($cellData) => {
        expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(rowIndex, 1, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Maine.jpeg");
      });
      table.AssertTableRowImageColumnIsLoaded(rowIndex, 2).then(($oldimage) => {
        table
          .AssertTableRowImageColumnIsLoaded(rowIndex, 3)
          .then(($newimage) => {
            expect($oldimage).to.eq($newimage);
          });
      });
    });

    it("5. Updating record - binarytype", () => {
      imageNameToUpload = "Datatypes/NewJersey.jpeg";

      table.SelectTableRow(1);
      agHelper.ClickButton("Run UpdateQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.ClickButton("Select update image");
      agHelper.UploadFile(imageNameToUpload);

      agHelper.ClickButton("Update");
      agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Update did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run UpdateQuery"),
      );
      agHelper.AssertElementAbsence(locators._btnSpinner, 20000); //for the update row to appear at last
      table.WaitUntilTableLoad();
      const rowIndex = 1;
      table
        .ReadTableRowColumnData(rowIndex, 0, "v1", 2000)
        .then(($cellData) => {
          expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
        });
      table.ReadTableRowColumnData(rowIndex, 1, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("NewJersey.jpeg");
      });
      table.AssertTableRowImageColumnIsLoaded(rowIndex, 2).then(($oldimage) => {
        table
          .AssertTableRowImageColumnIsLoaded(rowIndex, 3)
          .then(($newimage) => {
            expect($oldimage).to.not.eq($newimage);
          });
      });
    });

    it("6. Deleting records - binarytype", () => {
      table.WaitUntilTableLoad();
      table.SelectTableRow(1);
      agHelper.ClickButton("DeleteQuery", 1);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.WaitUntilEleDisappear(locators._btnSpinner); //Allowing time for delete to be success
      table.ReadTableRowColumnData(0, 0).then(($cellData) => {
        expect($cellData).to.eq("1");
      });

      //Deleting all records from .table
      agHelper.GetNClick(locators._deleteIcon);
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.WaitForTableEmpty();
    });

    it("7. Inserting another record (to check serial column) - binarytype", () => {
      imageNameToUpload = "Datatypes/Massachusetts.jpeg";

      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      //agHelper.EnterInputText("Imagename", "Massachusetts");
      agHelper.ClickButton("Select New Image");
      agHelper.UploadFile(imageNameToUpload);

      agHelper.ClickButton("Insert");
      agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Insert did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.WaitUntilTableLoad();
      table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Massachusetts.jpeg");
      });
      table.AssertTableRowImageColumnIsLoaded(0, 2).then(($oldimage) => {
        table.AssertTableRowImageColumnIsLoaded(0, 3).then(($newimage) => {
          expect($oldimage).to.eq($newimage);
        });
      });
    });

    it("8. Validating Binary (bytea) - escape, hex, base64 functions", () => {
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      //Validating zero octet
      query = `select encode('\\000'::bytea, 'hex') as "zero octet Hex", encode('\\000'::bytea, 'escape') as "zero octet Escape";`;
      dataSources.CreateQueryForDS(dsName, query, "verifyBinaryFunctions");
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "zero octet Hex",
        "zero octet Escape",
      ]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("00");
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.eq(`\\000`);
      });

      //Validating single quote
      query = `select encode(''''::bytea, 'escape') as "single quote Escape1", encode('\\047'::bytea, 'escape') as "single quote Escape2", encode(''''::bytea, 'hex') as "single quote Hex1", encode('\\047'::bytea, 'hex') as "single quote Hex2", encode(''''::bytea, 'base64') as "single quote Base64";`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "single quote Escape1",
        "single quote Escape2",
        "single quote Hex1",
        "single quote Hex2",
        "single quote Base64",
      ]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("'");
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.eq("'");
      });
      dataSources.ReadQueryTableResponse(2).then(($cellData) => {
        expect($cellData).to.eq("27");
      });
      dataSources.ReadQueryTableResponse(3).then(($cellData) => {
        expect($cellData).to.eq("27");
      });
      dataSources.ReadQueryTableResponse(4).then(($cellData) => {
        expect($cellData).to.eq("Jw==");
      });
    });

    it("9. Validating Binary (bytea) - escape, hex, base64 functions, conts", () => {
      //Validating backslash
      query = `select encode('\\\\'::bytea, 'escape') as "backslash Escape1", encode('\\134'::bytea, 'escape') as "backslash Escape2", encode('\\\\'::bytea, 'hex') as "backslash Hex1", encode('\\134'::bytea, 'hex') as "backslash Hex2", encode('\\\\'::bytea, 'base64') as "backslash Base64";`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "backslash Escape1",
        "backslash Escape2",
        "backslash Hex1",
        "backslash Hex2",
        "backslash Base64",
      ]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("\\\\");
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.eq("\\\\");
      });
      dataSources.ReadQueryTableResponse(2).then(($cellData) => {
        expect($cellData).to.eq("5c");
      });
      dataSources.ReadQueryTableResponse(3).then(($cellData) => {
        expect($cellData).to.eq("5c");
      });
      dataSources.ReadQueryTableResponse(4).then(($cellData) => {
        expect($cellData).to.eq("XA==");
      });

      //Validating random string
      query = `select encode('abc \\153\\154\\155 \\052\\251\\124'::bytea::bytea, 'escape') as "string bytea_output Escape", encode('abc \\153\\154\\155 \\052\\251\\124'::bytea::bytea, 'hex') as "string bytea_output Hex", encode('abc \\153\\154\\155 \\052\\251\\124'::bytea::bytea, 'base64') as "string bytea_output Base64";`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "string bytea_output Escape",
        "string bytea_output Hex",
        "string bytea_output Base64",
      ]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq(`abc klm *\\251T`);
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.eq("616263206b6c6d202aa954");
      });
      dataSources.ReadQueryTableResponse(2).then(($cellData) => {
        expect($cellData).to.eq("YWJjIGtsbSAqqVQ=");
      });

      //Validating text value1
      query = `select encode(E'123abc456', 'escape') as "Escape1", encode(E'123abc456', 'hex') as "Hex1", encode('abc456', 'escape') as "Escape2", encode('abc456', 'hex') as "Hex2", encode(E'123\\\\000456'::bytea, 'escape') as "Escape3", encode(E'123\\\\000456'::bytea, 'hex') as "Hex3";`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "Escape1",
        "Hex1",
        "Escape2",
        "Hex2",
        "Escape3",
        "Hex3",
      ]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("123abc456");
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.eq("313233616263343536");
      });
      dataSources.ReadQueryTableResponse(2).then(($cellData) => {
        expect($cellData).to.eq("abc456");
      });
      dataSources.ReadQueryTableResponse(3).then(($cellData) => {
        expect($cellData).to.eq("616263343536");
      });
      dataSources.ReadQueryTableResponse(4).then(($cellData) => {
        expect($cellData).to.eq(`123\\000456`);
      });
      dataSources.ReadQueryTableResponse(5).then(($cellData) => {
        expect($cellData).to.eq("31323300343536");
      });

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });
    // after(
    //   "Validate Drop of the Newly Created - binarytype - Table & Verify Deletion of all created queries",
    //   () => {
    //     //Drop table
    //     deployMode.NavigateBacktoEditor();
    //     entityExplorer.ExpandCollapseEntity("Queries/JS");
    //     entityExplorer.SelectEntityByName("dropTable");
    //     dataSources.RunQuery();
    //     dataSources.ReadQueryTableResponse(0).then(($cellData) => {
    //       expect($cellData).to.eq("0"); //Success response for dropped table!
    //     });
    //     entityExplorer.ExpandCollapseEntity("Queries/JS", false);
    //     entityExplorer.ExpandCollapseEntity("Datasources");
    //     entityExplorer.ExpandCollapseEntity(dsName);
    //     entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    //     agHelper.AssertElementAbsence(
    //       entityExplorer._entityNameInExplorer("public.binarytype"),
    //     );

    //     //Delete all queries
    //     dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Since all queries exists
    //     entityExplorer.ExpandCollapseEntity("Queries/JS");
    //      entityExplorer.DeleteAllQueriesForDB(dsName);

    //     //Delete DS
    //     deployMode.DeployApp();
    //     deployMode.NavigateBacktoEditor();
    //     entityExplorer.ExpandCollapseEntity("Queries/JS");
    //     dataSources.DeleteDatasourceFromWithinDS(dsName, 200);
    //   },
    // );
  },
);
