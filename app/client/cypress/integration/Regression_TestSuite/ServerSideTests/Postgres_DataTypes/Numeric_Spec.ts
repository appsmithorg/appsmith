import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any, query: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode,
  appSettings = ObjectsRegistry.AppSettings;

describe("Numeric Datatype tests", function () {
  before("Create Postgress DS, set Theme", () => {
    cy.fixture("Datatypes/NumericDTdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    appSettings.OpenPaneAndChangeTheme("Moon");
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Creating table - numerictypes", () => {
    query = `create table numerictypes (serialId SERIAL not null primary key, bigintId bigint not null, decimalId decimal not null, numericId numeric not null)`;
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("createTable");
    dataSources.EnterQuery(query);
    agHelper.FocusElement(locator._codeMirrorTextArea);
    dataSources.RunQuery();
    ee.ExpandCollapseEntity("Datasources");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(
      ee._entityNameInExplorer("public.numerictypes"),
    );
  });

  it("2. Creating SELECT query - numerictypes + Bug 14493", () => {
    ee.ActionTemplateMenuByEntityName("public.numerictypes", "SELECT");
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
  });

  it("3. Creating all queries - numerictypes", () => {
    query = `INSERT INTO public."numerictypes" ("bigintid", "decimalid", "numericid")
    VALUES ({{Insertbigint.text}}, {{Insertdecimal.text}}, {{Insertnumeric.text}})`;
    ee.ActionTemplateMenuByEntityName("public.numerictypes", "INSERT");
    agHelper.RenameWithInPane("insertRecord");
    dataSources.EnterQuery(query);

    query = `UPDATE public."numerictypes" SET
    "bigintid" = {{Updatebigint.text}},
    "decimalid" = {{Updatedecimal.text}},
    "numericid" = {{Updatenumeric.text}}
  WHERE serialid = {{Table1.selectedRow.serialid}};`;
    ee.ActionTemplateMenuByEntityName("public.numerictypes", "UPDATE");
    agHelper.RenameWithInPane("updateRecord");
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."numerictypes"
    WHERE serialId ={{Table1.selectedRow.serialid}}`;
    ee.ActionTemplateMenuByEntityName("public.numerictypes", "DELETE");
    agHelper.RenameWithInPane("deleteRecord");
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."numerictypes"`;
    ee.ActionTemplateMenuByEntityName("public.numerictypes", "DELETE");
    agHelper.RenameWithInPane("deleteAllRecords");
    dataSources.EnterQuery(query);

    query = `drop table public."numerictypes"`;
    ee.ActionTemplateMenuByEntityName("public.numerictypes", "DELETE");
    agHelper.RenameWithInPane("dropTable");
    dataSources.EnterQuery(query);
    ee.ExpandCollapseEntity("Queries/JS", false);
    ee.ExpandCollapseEntity(dsName, false);
  });

  it("4. Inserting record (+ve limit) - numerictypes + Bug 14516", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.EnterInputText("Bigintid", "922337203685477"); //9223372036854775807
    agHelper.EnterInputText("Decimalid", "865456.987654567");
    agHelper.EnterInputText("Numericid", "2147483647.2147484"); //2147483647.2147483647
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("922337203685477");
    });
    table.ReadTableRowColumnData(0, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("865456.987654567");
    });
    table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("2147483647.2147484");
    });
  });

  it("5. Inserting record (-ve limit) - numerictypes + Bug 14516", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.EnterInputText("Bigintid", "-922337203685477"); //-9223372036854775808
    agHelper.EnterInputText("Decimalid", "232143455655456.34"); //232143455655456.3434456565
    agHelper.EnterInputText("Numericid", "9877700000.143423"); //9877700000.14342340008876
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("-922337203685477"); //-9223372036854775808
    });
    table.ReadTableRowColumnData(1, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("232143455655456.34");
    });
    table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("9877700000.143423");
    });
  });

  it("6. Inserting another record (+ve record) - numerictypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.EnterInputText("Bigintid", "12233720368547758");
    agHelper.EnterInputText("Decimalid", "877675655441232.1"); //877675655441232.00998765 , 877675655441232.111
    agHelper.EnterInputText("Numericid", "86542300099.1"); //86542300099.1000099999876
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("12233720368547758");
    });
    table.ReadTableRowColumnData(2, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("877675655441232.1");
    });
    table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("86542300099.1");
    });
  });

  it("7. Updating record (permissible value) - numerictypes", () => {
    table.SelectTableRow(2);
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.EnterInputText("Bigintid", "11233720368547758", true);
    agHelper.EnterInputText("Decimalid", "777675655441232.1", true); //777675655441232.00998765 , 777675655441232.111
    agHelper.EnterInputText("Numericid", "76542300099.10988", true); //76542300099.109876788
    agHelper.ClickButton("Update");
    agHelper.AssertElementVisible(locator._spanButton("Run UpdateQuery"));
    table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("11233720368547758");
    });
    table.ReadTableRowColumnData(2, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("777675655441232.1");
    });
    table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("76542300099.10988");
    });
  });

  it("8. Deleting records - numerictypes", () => {
    table.SelectTableRow(1);
    agHelper.ClickButton("DeleteQuery", 1);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(2500); //Allwowing time for delete to be success
    table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).not.to.eq("2"); //asserting 2nd record is deleted
    });
    table.ReadTableRowColumnData(1, 0, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
  });

  it("9. Updating record again - numerictypes", () => {
    table.SelectTableRow(1);
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.EnterInputText("Bigintid", "11133720368547700", true);
    agHelper.EnterInputText("Decimalid", "777575655441232.1", true); //777575655441232.716716716716 , 777575655441232.1115
    agHelper.EnterInputText("Numericid", "66542300099.00088", true); //66542300099.0008767675
    agHelper.ClickButton("Update");
    agHelper.AssertElementVisible(locator._spanButton("Run UpdateQuery"));
    table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("11133720368547700");
    });
    table.ReadTableRowColumnData(1, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("777575655441232.1");
    });
    table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("66542300099.00088");
    });
  });

  it("10. Inserting another record (+ve record - to check serial column) - numerictypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.EnterInputText("Bigintid", "11111720368547700");
    agHelper.EnterInputText("Decimalid", "8765456.987654345"); //8765456.98765434567
    agHelper.EnterInputText("Numericid", "87654356.98765436"); // 87654356.987654356
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("11111720368547700");
    });
    table.ReadTableRowColumnData(2, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("8765456.987654345");
    });
    table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("87654356.98765436");
    });
  });

  it("11. Deleting records - numerictypes", () => {
    table.SelectTableRow(1);
    agHelper.ClickButton("DeleteQuery", 1);
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).not.to.eq("3"); //asserting 3rd record is deleted
    });
    table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("4");
    });
  });

  it("12. Deleting all records from table - numerictypes", () => {
    agHelper.GetNClick(locator._deleteIcon);
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("13. Inserting record (+ve record - to check serial column) - numerictypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.EnterInputText("Bigintid", "11111720368547700");
    agHelper.EnterInputText("Decimalid", "8765456.987654345");
    agHelper.EnterInputText("Numericid", "87654356.98765436"); // 87654356.9876543567
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("5"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("11111720368547700");
    });
    table.ReadTableRowColumnData(0, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("8765456.987654345");
    });
    table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("87654356.98765436");
    });
  });

  it("14. Validate Drop of the Newly Created - numerictypes - Table from Postgres datasource", () => {
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("Queries/JS");
    ee.SelectEntityByName("dropTable");
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0"); //Success response for dropped table!
    });
    ee.ExpandCollapseEntity("Queries/JS", false);
    ee.ExpandCollapseEntity("Datasources");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementAbsence(
      ee._entityNameInExplorer("public.numerictypes"),
    );
    ee.ExpandCollapseEntity(dsName, false);
    ee.ExpandCollapseEntity("Datasources", false);
  });

  it("15. Verify Deletion of the datasource after all created queries are Deleted", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
    ee.ExpandCollapseEntity("Queries/JS");
    ee.DeleteAllQueriesForDB(dsName);
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("Queries/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200); //ProductLines, Employees pages are still using this ds
  });
});
