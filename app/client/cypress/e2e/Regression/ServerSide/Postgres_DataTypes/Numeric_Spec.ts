import {
  agHelper,
  appSettings,
  assertHelper,
  dataSources,
  deployMode,
  entityExplorer,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Numeric Datatype tests",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let dsName: any, query: string;

    before("Create Postgress DS, set Theme", () => {
      agHelper.AddDsl("Datatypes/NumericDTdsl");

      appSettings.OpenPaneAndChangeTheme("Moon");
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
    });

    it("1. Creating table - numerictypes", () => {
      query = `create table numerictypes (serialId SERIAL not null primary key, bigintId bigint not null, decimalId decimal not null, numericId numeric not null)`;
      dataSources.CreateQueryForDS(dsName, query, "createTable");
      agHelper.FocusElement(locators._codeMirrorTextArea);
      dataSources.RunQuery();
    });

    it("2. Creating SELECT query - numerictypes + Bug 14493", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.numerictypes",
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

    it("3. Creating all queries - numerictypes", () => {
      query = `INSERT INTO public."numerictypes" ("bigintid", "decimalid", "numericid")
    VALUES ({{Insertbigint.text}}, {{Insertdecimal.text}}, {{Insertnumeric.text}})`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.numerictypes",
        "Insert",
      );
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("insertRecord");

      query = `UPDATE public."numerictypes" SET
    "bigintid" = {{Updatebigint.text}},
    "decimalid" = {{Updatedecimal.text}},
    "numericid" = {{Updatenumeric.text}}
  WHERE serialid = {{Table1.selectedRow.serialid}};`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.numerictypes",
        "Update",
      );
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("updateRecord");

      query = `DELETE FROM public."numerictypes"`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.numerictypes",
        "Delete",
      );
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("deleteAllRecords");

      query = `drop table public."numerictypes"`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.numerictypes",
        "Delete",
      );
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("dropTable");

      query = `DELETE FROM public."numerictypes"
    WHERE serialId ={{Table1.selectedRow.serialid}}`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.numerictypes",
        "Delete",
      );
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("deleteRecord");
    });

    it("4. Inserting record (+ve limit) - numerictypes + Bug 14516", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      table.WaitForTableEmpty(); //asserting table is empty before inserting!
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.EnterInputText("Bigintid", "922337203685477"); //9223372036854775807
      agHelper.EnterInputText("Decimalid", "865456.987654567");
      agHelper.EnterInputText("Numericid", "2147483647.2147484"); //2147483647.2147483647
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
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
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.EnterInputText("Bigintid", "-922337203685477"); //-9223372036854775808
      agHelper.EnterInputText("Decimalid", "232143455655456.34"); //232143455655456.3434456565
      agHelper.EnterInputText("Numericid", "9877700000.143423"); //9877700000.14342340008876
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
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
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.EnterInputText("Bigintid", "12233720368547758");
      agHelper.EnterInputText("Decimalid", "877675655441232.1"); //877675655441232.00998765 , 877675655441232.111
      agHelper.EnterInputText("Numericid", "86542300099.1"); //86542300099.1000099999876
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
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
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.EnterInputText("Bigintid", "11233720368547758", true);
      agHelper.EnterInputText("Decimalid", "777675655441232.1", true); //777675655441232.00998765 , 777675655441232.111
      agHelper.EnterInputText("Numericid", "76542300099.10988", true); //76542300099.109876788
      agHelper.ClickButton("Update");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run UpdateQuery"),
      );
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
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
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
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.EnterInputText("Bigintid", "11133720368547700", true);
      agHelper.EnterInputText("Decimalid", "777575655441232.1", true); //777575655441232.716716716716 , 777575655441232.1115
      agHelper.EnterInputText("Numericid", "66542300099.00088", true); //66542300099.0008767675
      agHelper.ClickButton("Update");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run UpdateQuery"),
      );
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
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.EnterInputText("Bigintid", "11111720368547700");
      agHelper.EnterInputText("Decimalid", "8765456.987654345"); //8765456.98765434567
      agHelper.EnterInputText("Numericid", "87654356.98765436"); // 87654356.987654356
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
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
      agHelper.Sleep(3000); //for CI to finish delete
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).not.to.eq("3"); //asserting 3rd record is deleted
      });
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("4");
      });
    });

    it("12. Deleting all records from table - numerictypes", () => {
      agHelper.GetNClick(locators._deleteIcon);
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      agHelper.Sleep(2000);
      table.WaitForTableEmpty();
    });

    it("13. Inserting record (+ve record - to check serial column) - numerictypes", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.EnterInputText("Bigintid", "11111720368547700");
      agHelper.EnterInputText("Decimalid", "8765456.987654345");
      agHelper.EnterInputText("Numericid", "87654356.98765436"); // 87654356.9876543567
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
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
      EditorNavigation.SelectEntityByName("dropTable", EntityType.Query);
      dataSources.RunQuery();
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("0"); //Success response for dropped table!
      });
      dataSources.AssertTableInVirtuosoList(
        dsName,
        "public.numerictypes",
        false,
      );
    });

    it("15. Verify Deletion of the datasource after all created queries are deleted", () => {
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Since all queries exists
      entityExplorer.DeleteAllQueriesForDB(dsName);
      deployMode.DeployApp();
      deployMode.NavigateBacktoEditor();
      dataSources.DeleteDatasourceFromWithinDS(dsName, 200); //ProductLines, Employees pages are still using this ds
    });
  },
);
