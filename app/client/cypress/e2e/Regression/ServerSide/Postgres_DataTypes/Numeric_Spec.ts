import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any, query: string;

describe("Numeric Datatype tests", function () {
  before("Create Postgress DS, set Theme", () => {
    cy.fixture("Datatypes/NumericDTdsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
    _.appSettings.OpenPaneAndChangeTheme("Moon");
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Creating table - numerictypes", () => {
    query = `create table numerictypes (serialId SERIAL not null primary key, bigintId bigint not null, decimalId decimal not null, numericId numeric not null)`;
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("createTable");
    _.agHelper.FocusElement(_.locators._codeMirrorTextArea);
    _.dataSources.RunQuery();
    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ExpandCollapseEntity(dsName);
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementVisible(
      _.entityExplorer._entityNameInExplorer("public.numerictypes"),
    );
  });

  it("2. Creating SELECT query - numerictypes + Bug 14493", () => {
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.numerictypes",
      "SELECT",
    );
    _.dataSources.RunQuery();
    _.agHelper
      .GetText(_.dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
    _.agHelper.RenameWithInPane("selectRecords");
  });

  it("3. Creating all queries - numerictypes", () => {
    query = `INSERT INTO public."numerictypes" ("bigintid", "decimalid", "numericid")
    VALUES ({{Insertbigint.text}}, {{Insertdecimal.text}}, {{Insertnumeric.text}})`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.numerictypes",
      "INSERT",
    );
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("insertRecord");

    query = `UPDATE public."numerictypes" SET
    "bigintid" = {{Updatebigint.text}},
    "decimalid" = {{Updatedecimal.text}},
    "numericid" = {{Updatenumeric.text}}
  WHERE serialid = {{Table1.selectedRow.serialid}};`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.numerictypes",
      "UPDATE",
    );
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("updateRecord");

    query = `DELETE FROM public."numerictypes"`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.numerictypes",
      "DELETE",
    );
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("deleteAllRecords");

    query = `drop table public."numerictypes"`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.numerictypes",
      "DELETE",
    );
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("dropTable");

    query = `DELETE FROM public."numerictypes"
    WHERE serialId ={{Table1.selectedRow.serialid}}`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.numerictypes",
      "DELETE",
    );
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("deleteRecord");
    _.entityExplorer.ExpandCollapseEntity("Queries/JS", false);
    _.entityExplorer.ExpandCollapseEntity(dsName, false);
  });

  it("4. Inserting record (+ve limit) - numerictypes + Bug 14516", () => {
    _.entityExplorer.SelectEntityByName("Page1");
    _.deployMode.DeployApp();
    _.table.WaitForTableEmpty(); //asserting table is empty before inserting!
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.EnterInputText("Bigintid", "922337203685477"); //9223372036854775807
    _.agHelper.EnterInputText("Decimalid", "865456.987654567");
    _.agHelper.EnterInputText("Numericid", "2147483647.2147484"); //2147483647.2147483647
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("922337203685477");
    });
    _.table.ReadTableRowColumnData(0, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("865456.987654567");
    });
    _.table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("2147483647.2147484");
    });
  });

  it("5. Inserting record (-ve limit) - numerictypes + Bug 14516", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.EnterInputText("Bigintid", "-922337203685477"); //-9223372036854775808
    _.agHelper.EnterInputText("Decimalid", "232143455655456.34"); //232143455655456.3434456565
    _.agHelper.EnterInputText("Numericid", "9877700000.143423"); //9877700000.14342340008876
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("-922337203685477"); //-9223372036854775808
    });
    _.table.ReadTableRowColumnData(1, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("232143455655456.34");
    });
    _.table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("9877700000.143423");
    });
  });

  it("6. Inserting another record (+ve record) - numerictypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.EnterInputText("Bigintid", "12233720368547758");
    _.agHelper.EnterInputText("Decimalid", "877675655441232.1"); //877675655441232.00998765 , 877675655441232.111
    _.agHelper.EnterInputText("Numericid", "86542300099.1"); //86542300099.1000099999876
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("12233720368547758");
    });
    _.table.ReadTableRowColumnData(2, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("877675655441232.1");
    });
    _.table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("86542300099.1");
    });
  });

  it("7. Updating record (permissible value) - numerictypes", () => {
    _.table.SelectTableRow(2);
    _.agHelper.ClickButton("Run UpdateQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.EnterInputText("Bigintid", "11233720368547758", true);
    _.agHelper.EnterInputText("Decimalid", "777675655441232.1", true); //777675655441232.00998765 , 777675655441232.111
    _.agHelper.EnterInputText("Numericid", "76542300099.10988", true); //76542300099.109876788
    _.agHelper.ClickButton("Update");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run UpdateQuery"));
    _.table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("11233720368547758");
    });
    _.table.ReadTableRowColumnData(2, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("777675655441232.1");
    });
    _.table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("76542300099.10988");
    });
  });

  it("8. Deleting records - numerictypes", () => {
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
  });

  it("9. Updating record again - numerictypes", () => {
    _.table.SelectTableRow(1);
    _.agHelper.ClickButton("Run UpdateQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.EnterInputText("Bigintid", "11133720368547700", true);
    _.agHelper.EnterInputText("Decimalid", "777575655441232.1", true); //777575655441232.716716716716 , 777575655441232.1115
    _.agHelper.EnterInputText("Numericid", "66542300099.00088", true); //66542300099.0008767675
    _.agHelper.ClickButton("Update");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run UpdateQuery"));
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("11133720368547700");
    });
    _.table.ReadTableRowColumnData(1, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("777575655441232.1");
    });
    _.table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("66542300099.00088");
    });
  });

  it("10. Inserting another record (+ve record - to check serial column) - numerictypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.EnterInputText("Bigintid", "11111720368547700");
    _.agHelper.EnterInputText("Decimalid", "8765456.987654345"); //8765456.98765434567
    _.agHelper.EnterInputText("Numericid", "87654356.98765436"); // 87654356.987654356
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("11111720368547700");
    });
    _.table.ReadTableRowColumnData(2, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("8765456.987654345");
    });
    _.table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("87654356.98765436");
    });
  });

  it("11. Deleting records - numerictypes", () => {
    _.table.SelectTableRow(1);
    _.agHelper.ClickButton("DeleteQuery", 1);
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).not.to.eq("3"); //asserting 3rd record is deleted
    });
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("4");
    });
  });

  it("12. Deleting all records from table - numerictypes", () => {
    _.agHelper.GetNClick(_.locators._deleteIcon);
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.agHelper.Sleep(2000);
    _.table.WaitForTableEmpty();
  });

  it("13. Inserting record (+ve record - to check serial column) - numerictypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.EnterInputText("Bigintid", "11111720368547700");
    _.agHelper.EnterInputText("Decimalid", "8765456.987654345");
    _.agHelper.EnterInputText("Numericid", "87654356.98765436"); // 87654356.9876543567
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("5"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("11111720368547700");
    });
    _.table.ReadTableRowColumnData(0, 2, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("8765456.987654345");
    });
    _.table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("87654356.98765436");
    });
  });

  it("14. Validate Drop of the Newly Created - numerictypes - Table from Postgres datasource", () => {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("dropTable");
    _.dataSources.RunQuery();
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0"); //Success response for dropped table!
    });
    _.entityExplorer.ExpandCollapseEntity("Queries/JS", false);
    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ExpandCollapseEntity(dsName);
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementAbsence(
      _.entityExplorer._entityNameInExplorer("public.numerictypes"),
    );
    _.entityExplorer.ExpandCollapseEntity(dsName, false);
    _.entityExplorer.ExpandCollapseEntity("Datasources", false);
  });

  it("15. Verify Deletion of the datasource after all created queries are deleted", () => {
    _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.DeleteAllQueriesForDB(dsName);
    _.deployMode.DeployApp();
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 200); //ProductLines, Employees pages are still using this ds
  });
});
