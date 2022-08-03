import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any, query: string, imageNameToUpload: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode;

describe("Binary Datatype tests", function() {
  before(() => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("0. Importing App & setting theme", () => {
    cy.fixture("Datatypes/BinaryDTdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    ee.NavigateToSwitcher("widgets");
    propPane.ChangeColor(24, "Primary");
    propPane.ChangeColor(-37, "Background");
  });

  it("1. Creating table query - binarytype", () => {
    query = `CREATE table binarytype (serialid SERIAL primary key, imagename TEXT, existingImage bytea, newImage bytea);`;
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("createTable");
    dataSources.EnterQuery(query);
    dataSources.RunQuery();

    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(
      ee._entityNameInExplorer("public.binarytype"),
    );
  });

  it("2. Creating SELECT query - binarytype + Bug 14493", () => {
    query = `SELECT binarytype.serialid, binarytype.imagename, encode(binarytype.existingimage, 'escape') as "OldImage", encode(binarytype.newimage, 'escape') as "NewImage" from public."binarytype";`;
    ee.ActionTemplateMenuByEntityName("public.binarytype", "SELECT");
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
    dataSources.EnterQuery(query);
  });

  it("3. Creating all queries - binarytype", () => {
    query = `INSERT INTO public."binarytype" ("imagename", "existingimage", "newimage") VALUES ('{{Insertimagename.text}}', '{{Insertimage.files[0].data}}', '{{Insertimage.files[0].data}}');`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("insertRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `UPDATE public."binarytype" SET "imagename" ='{{Updatename.text}}', "existingimage" = '{{Table1.selectedRow.OldImage}}',  "newimage" = '{{Updateimage.files[0].data}}' WHERE serialid = {{Table1.selectedRow.serialid}};`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("updateRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."binarytype" WHERE serialId = {{Table1.selectedRow.serialid}}`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."binarytype"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteAllRecords");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `drop table public."binarytype"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("dropTable");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    ee.ExpandCollapseEntity("QUERIES/JS", false);
    ee.ExpandCollapseEntity(dsName, false);
  });

  it("4. Inserting record - binarytype", () => {
    imageNameToUpload = "Datatypes/Bridge.jpg";
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.ClickButton("Select New Image");
    agHelper.UploadFile(imageNameToUpload);

    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Insert did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.WaitUntilTableLoad();
    agHelper.Sleep(2000); //for all rows with images to be populated
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("Bridge.jpg");
    });
    table.AssertTableRowImageColumnIsLoaded(0, 2).then(($oldimage) => {
      table.AssertTableRowImageColumnIsLoaded(0, 3).then(($newimage) => {
        expect($oldimage).to.eq($newimage);
      });
    });
  });

  it("5. Inserting another record - binarytype", () => {
    imageNameToUpload = "Datatypes/Georgia.jpeg";

    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.ClickButton("Select New Image");
    agHelper.UploadFile(imageNameToUpload);

    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Insert did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.WaitUntilTableLoad();
    agHelper.Sleep(2000); //for all rows with images to be populated
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("Georgia.jpeg");
    });
    table.AssertTableRowImageColumnIsLoaded(1, 2).then(($oldimage) => {
      table.AssertTableRowImageColumnIsLoaded(1, 3).then(($newimage) => {
        expect($oldimage).to.eq($newimage);
      });
    });
  });

  it("6. Inserting another record - binarytype", () => {
    imageNameToUpload = "Datatypes/Maine.jpeg";

    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.ClickButton("Select New Image");
    agHelper.UploadFile(imageNameToUpload);

    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Insert did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.WaitUntilTableLoad();
    agHelper.Sleep(2000); //for all rows with images to be populated
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("Maine.jpeg");
    });
    table.AssertTableRowImageColumnIsLoaded(2, 2).then(($oldimage) => {
      table.AssertTableRowImageColumnIsLoaded(2, 3).then(($newimage) => {
        expect($oldimage).to.eq($newimage);
      });
    });
  });

  it("7. Updating record - binarytype", () => {
    imageNameToUpload = "Datatypes/NewJersey.jpeg";

    table.SelectTableRow(1);
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.ClickButton("Select update image");
    agHelper.UploadFile(imageNameToUpload);

    agHelper.ClickButton("Update");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Update did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run UpdateQuery"));
    table.WaitUntilTableLoad();
    agHelper.Sleep(10000); //for the update row to appear at last
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("NewJersey.jpeg");
    });
    table.AssertTableRowImageColumnIsLoaded(2, 2).then(($oldimage) => {
      table.AssertTableRowImageColumnIsLoaded(2, 3).then(($newimage) => {
        expect($oldimage).to.not.eq($newimage);
      });
    });
  });

  it("8. Validating Binary (bytea) - escape, hex, base64 functions", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    ee.ExpandCollapseEntity("QUERIES/JS");
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.RenameWithInPane("verifyBinaryFunctions");

    //Validating zero octet
    query = `select encode('\\000'::bytea, 'hex') as "zero octet Hex", encode('\\000'::bytea, 'escape') as "zero octet Escape";`;
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
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
      "Escape1", "Hex1", "Escape2", "Hex2",  "Escape3", "Hex3"
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

    agHelper.ActionContextMenuWithInPane("Delete");
    ee.ExpandCollapseEntity("QUERIES/JS", false);
  });

  it("9. Deleting records - binarytype", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitUntilTableLoad();
    table.SelectTableRow(1);
    agHelper.ClickButton("DeleteQuery", 1);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(10000); //Allwowing time for delete to be success
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).not.to.eq("3"); //asserting 2nd record is deleted
    });
    table.ReadTableRowColumnData(1, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("2");
    });
  });

  it("10. Deleting all records from table - binarytype", () => {
    agHelper.GetNClick(locator._deleteIcon);
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("11. Inserting another record (to check serial column) - binarytype", () => {
    imageNameToUpload = "Datatypes/Massachusetts.jpeg";

    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    //agHelper.EnterInputText("Imagename", "Massachusetts");
    agHelper.ClickButton("Select New Image");
    agHelper.UploadFile(imageNameToUpload);

    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Insert did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.WaitUntilTableLoad();
    agHelper.Sleep(2000); //for all rows with images to be populated
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("Massachusetts.jpeg");
    });
    table.AssertTableRowImageColumnIsLoaded(0, 2).then(($oldimage) => {
      table.AssertTableRowImageColumnIsLoaded(0, 3).then(($newimage) => {
        expect($oldimage).to.eq($newimage);
      });
    });
  });

  it("12. Validate Drop of the Newly Created - binarytype - Table from Postgres datasource", () => {
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
      ee._entityNameInExplorer("public.binarytype"),
    );
    ee.ExpandCollapseEntity(dsName, false);
    ee.ExpandCollapseEntity("DATASOURCES", false);
  });

  it("13. Verify Deletion of all created queries", () => {
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
  });

  it("14. Verify Deletion of datasource", () => {
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("QUERIES/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
  });
});
