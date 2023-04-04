import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any, query: string, imageNameToUpload: string;

describe("Binary Datatype tests", function () {
  before("Create DS, Importing App & setting theme", () => {
    cy.fixture("Datatypes/BinaryDTdsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
    _.appSettings.OpenPaneAndChangeThemeColors(24, -37);
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Creating table queries - binarytype + Bug 14493", () => {
    query = `CREATE table binarytype (serialid SERIAL primary key, imagename TEXT, existingImage bytea, newImage bytea);`;
    _.dataSources.CreateQueryAfterDSSaved(query, "createTable");
    _.dataSources.RunQuery();

    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementVisible(
      _.entityExplorer._entityNameInExplorer("public.binarytype"),
    );

    //Creating SELECT query - binarytype + Bug 14493
    query = `SELECT binarytype.serialid, binarytype.imagename, encode(binarytype.existingimage, 'escape') as "OldImage", encode(binarytype.newimage, 'escape') as "NewImage" from public."binarytype";`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.binarytype",
      "SELECT",
    );
    _.agHelper.RenameWithInPane("selectRecords");
    _.dataSources.RunQuery();
    _.agHelper
      .GetText(_.dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
    _.dataSources.EnterQuery(query);

    //Other queries
    query = `INSERT INTO public."binarytype" ("imagename", "existingimage", "newimage") VALUES ('{{Insertimagename.text}}', '{{Insertimage.files[0].data}}', '{{Insertimage.files[0].data}}');`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "insertRecord");

    query = `UPDATE public."binarytype" SET "imagename" ='{{Updatename.text}}', "existingimage" = '{{Table1.selectedRow.OldImage}}',  "newimage" = '{{Updateimage.files[0].data}}' WHERE serialid = {{Table1.selectedRow.serialid}};`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "updateRecord");

    query = `DELETE FROM public."binarytype" WHERE serialId = {{Table1.selectedRow.serialid}}`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "deleteRecord");

    query = `DELETE FROM public."binarytype"`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "deleteAllRecords");

    query = `DROP table public."binarytype"`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "dropTable");

    _.entityExplorer.ExpandCollapseEntity("Queries/JS", false);
    _.entityExplorer.ExpandCollapseEntity(dsName, false);
  });

  it("2. Inserting record - binarytype", () => {
    imageNameToUpload = "Datatypes/Bridge.jpg";
    _.entityExplorer.SelectEntityByName("Page1");
    _.deployMode.DeployApp();
    _.table.WaitForTableEmpty(); //asserting _.table is empty before inserting!
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);

    _.agHelper.ClickButton("Select New Image");
    _.agHelper.UploadFile(imageNameToUpload);

    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementAbsence(_.locators._toastMsg); //Assert that Insert did not fail
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.agHelper.AssertElementAbsence(_.locators._spinner, 20000); //for the update row to appear at last
    _.table.WaitUntilTableLoad();
    _.agHelper.Sleep(2000); //some more time for all rows with images to be populated
    _.table.ReadTableRowColumnData(0, 0).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Bridge.jpg");
    });
    _.table.AssertTableRowImageColumnIsLoaded(0, 2).then(($oldimage) => {
      _.table.AssertTableRowImageColumnIsLoaded(0, 3).then(($newimage) => {
        expect($oldimage).to.eq($newimage);
      });
    });
  });

  it("3. Inserting another record - binarytype", () => {
    imageNameToUpload = "Datatypes/Georgia.jpeg";

    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);

    _.agHelper.ClickButton("Select New Image");
    _.agHelper.UploadFile(imageNameToUpload);

    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementAbsence(_.locators._toastMsg); //Assert that Insert did not fail
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.agHelper.AssertElementAbsence(_.locators._spinner, 20000); //for the update row to appear at last
    _.table.WaitUntilTableLoad();
    _.agHelper.Sleep(2000); //some more time for all rows with images to be populated
    _.table.ReadTableRowColumnData(1, 0).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Georgia.jpeg");
    });
    _.table.AssertTableRowImageColumnIsLoaded(1, 2).then(($oldimage) => {
      _.table.AssertTableRowImageColumnIsLoaded(1, 3).then(($newimage) => {
        expect($oldimage).to.eq($newimage);
      });
    });
  });

  it("4. Inserting another record - binarytype", () => {
    imageNameToUpload = "Datatypes/Maine.jpeg";

    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);

    _.agHelper.ClickButton("Select New Image");
    _.agHelper.UploadFile(imageNameToUpload);

    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementAbsence(_.locators._toastMsg); //Assert that Insert did not fail
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.agHelper.AssertElementAbsence(_.locators._spinner, 20000); //for the update row to appear at last
    _.table.WaitUntilTableLoad();
    _.agHelper.Sleep(2000); //some more time for all rows with images to be populated
    _.table.ReadTableRowColumnData(2, 0).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Maine.jpeg");
    });
    _.table.AssertTableRowImageColumnIsLoaded(2, 2).then(($oldimage) => {
      _.table.AssertTableRowImageColumnIsLoaded(2, 3).then(($newimage) => {
        expect($oldimage).to.eq($newimage);
      });
    });
  });

  it("5. Updating record - binarytype", () => {
    imageNameToUpload = "Datatypes/NewJersey.jpeg";

    _.table.SelectTableRow(1);
    _.agHelper.ClickButton("Run UpdateQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);

    _.agHelper.ClickButton("Select update image");
    _.agHelper.UploadFile(imageNameToUpload);

    _.agHelper.ClickButton("Update");
    _.agHelper.AssertElementAbsence(_.locators._toastMsg); //Assert that Update did not fail
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run UpdateQuery"));
    _.agHelper.AssertElementAbsence(_.locators._spinner, 20000); //for the update row to appear at last
    _.table.WaitUntilTableLoad();
    _.agHelper.Sleep(10000); //some more time for rows to rearrange!
    _.table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("NewJersey.jpeg");
    });
    _.table.AssertTableRowImageColumnIsLoaded(2, 2).then(($oldimage) => {
      _.table.AssertTableRowImageColumnIsLoaded(2, 3).then(($newimage) => {
        expect($oldimage).to.not.eq($newimage);
      });
    });
  });

  it("6. Validating Binary (bytea) - escape, hex, base64 functions", () => {
    _.deployMode.NavigateBacktoEditor();
    _.table.WaitUntilTableLoad();
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.agHelper.RenameWithInPane("verifyBinaryFunctions");

    //Validating zero octet
    query = `select encode('\\000'::bytea, 'hex') as "zero octet Hex", encode('\\000'::bytea, 'escape') as "zero octet Escape";`;
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "zero octet Hex",
      "zero octet Escape",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("00");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq(`\\000`);
    });

    //Validating single quote
    query = `select encode(''''::bytea, 'escape') as "single quote Escape1", encode('\\047'::bytea, 'escape') as "single quote Escape2", encode(''''::bytea, 'hex') as "single quote Hex1", encode('\\047'::bytea, 'hex') as "single quote Hex2", encode(''''::bytea, 'base64') as "single quote Base64";`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "single quote Escape1",
      "single quote Escape2",
      "single quote Hex1",
      "single quote Hex2",
      "single quote Base64",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("'");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("'");
    });
    _.dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("27");
    });
    _.dataSources.ReadQueryTableResponse(3).then(($cellData) => {
      expect($cellData).to.eq("27");
    });
    _.dataSources.ReadQueryTableResponse(4).then(($cellData) => {
      expect($cellData).to.eq("Jw==");
    });

    //Validating backslash
    query = `select encode('\\\\'::bytea, 'escape') as "backslash Escape1", encode('\\134'::bytea, 'escape') as "backslash Escape2", encode('\\\\'::bytea, 'hex') as "backslash Hex1", encode('\\134'::bytea, 'hex') as "backslash Hex2", encode('\\\\'::bytea, 'base64') as "backslash Base64";`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "backslash Escape1",
      "backslash Escape2",
      "backslash Hex1",
      "backslash Hex2",
      "backslash Base64",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("\\\\");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("\\\\");
    });
    _.dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("5c");
    });
    _.dataSources.ReadQueryTableResponse(3).then(($cellData) => {
      expect($cellData).to.eq("5c");
    });
    _.dataSources.ReadQueryTableResponse(4).then(($cellData) => {
      expect($cellData).to.eq("XA==");
    });

    //Validating random string
    query = `select encode('abc \\153\\154\\155 \\052\\251\\124'::bytea::bytea, 'escape') as "string bytea_output Escape", encode('abc \\153\\154\\155 \\052\\251\\124'::bytea::bytea, 'hex') as "string bytea_output Hex", encode('abc \\153\\154\\155 \\052\\251\\124'::bytea::bytea, 'base64') as "string bytea_output Base64";`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "string bytea_output Escape",
      "string bytea_output Hex",
      "string bytea_output Base64",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`abc klm *\\251T`);
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("616263206b6c6d202aa954");
    });
    _.dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("YWJjIGtsbSAqqVQ=");
    });

    //Validating text value1
    query = `select encode(E'123abc456', 'escape') as "Escape1", encode(E'123abc456', 'hex') as "Hex1", encode('abc456', 'escape') as "Escape2", encode('abc456', 'hex') as "Hex2", encode(E'123\\\\000456'::bytea, 'escape') as "Escape3", encode(E'123\\\\000456'::bytea, 'hex') as "Hex3";`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "Escape1",
      "Hex1",
      "Escape2",
      "Hex2",
      "Escape3",
      "Hex3",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("123abc456");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("313233616263343536");
    });
    _.dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("abc456");
    });
    _.dataSources.ReadQueryTableResponse(3).then(($cellData) => {
      expect($cellData).to.eq("616263343536");
    });
    _.dataSources.ReadQueryTableResponse(4).then(($cellData) => {
      expect($cellData).to.eq(`123\\000456`);
    });
    _.dataSources.ReadQueryTableResponse(5).then(($cellData) => {
      expect($cellData).to.eq("31323300343536");
    });

    _.agHelper.ActionContextMenuWithInPane("Delete");
    _.entityExplorer.ExpandCollapseEntity("Queries/JS", false);
  });

  it("7. Deleting records - binarytype", () => {
    _.entityExplorer.SelectEntityByName("Page1");
    _.deployMode.DeployApp();
    _.table.WaitUntilTableLoad();
    _.table.SelectTableRow(1);
    _.agHelper.ClickButton("DeleteQuery", 1);
    _.agHelper.ValidateNetworkStatus("@postExecute", 200);
    _.agHelper.ValidateNetworkStatus("@postExecute", 200);
    _.agHelper.AssertElementAbsence(_.locators._spinner, 20000); //Allowing time for delete to be success
    _.agHelper.Sleep(6000); //Allwowing time for delete to be success
    _.table.ReadTableRowColumnData(1, 0).then(($cellData) => {
      expect($cellData).not.to.eq("3"); //asserting 2nd record is deleted
    });
    _.table.ReadTableRowColumnData(1, 0, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("2");
    });

    //Deleting all records from .table
    _.agHelper.GetNClick(_.locators._deleteIcon);
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.agHelper.Sleep(2000);
    _.table.WaitForTableEmpty();
  });

  it("8. Inserting another record (to check serial column) - binarytype", () => {
    imageNameToUpload = "Datatypes/Massachusetts.jpeg";

    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);

    //_.agHelper.EnterInputText("Imagename", "Massachusetts");
    _.agHelper.ClickButton("Select New Image");
    _.agHelper.UploadFile(imageNameToUpload);

    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementAbsence(_.locators._toastMsg); //Assert that Insert did not fail
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.WaitUntilTableLoad();
    _.agHelper.Sleep(2000); //for all rows with images to be populated
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Massachusetts.jpeg");
    });
    _.table.AssertTableRowImageColumnIsLoaded(0, 2).then(($oldimage) => {
      _.table.AssertTableRowImageColumnIsLoaded(0, 3).then(($newimage) => {
        expect($oldimage).to.eq($newimage);
      });
    });
  });

  after(
    "Validate Drop of the Newly Created - binarytype - Table & Verify Deletion of all created queries",
    () => {
      //Drop table
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
        _.entityExplorer._entityNameInExplorer("public.binarytype"),
      );
      _.entityExplorer.ExpandCollapseEntity(dsName, false);
      _.entityExplorer.ExpandCollapseEntity("Datasources", false);

      //Delete all queries
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
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

      //Delete DS
      _.deployMode.DeployApp();
      _.deployMode.NavigateBacktoEditor();
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
    },
  );
});
