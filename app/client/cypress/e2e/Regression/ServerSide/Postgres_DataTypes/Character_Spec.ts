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
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Character Datatype tests",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let dsName: any, query: string;

    before("Create Postgress DS", () => {
      agHelper.AddDsl("Datatypes/CharacterDTdsl");
      appSettings.OpenPaneAndChangeTheme("Pacific");
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
    });

    it("1. Creating table - chartypes", () => {
      query = `create table charTypes(serialid serial primary key, "One(1)" char, "AsMany" varchar, "Limited(4)" varchar(4), "Unlimited" text)`;
      dataSources.CreateQueryForDS(dsName, query, "createTable");
      agHelper.FocusElement(locators._codeMirrorTextArea);
      dataSources.RunQuery();
    });

    it("2. Creating SELECT query - chartypes + Bug 14493", () => {
      query = `SELECT *, char_length("AsMany") as "AsMany-Len", char_length("Unlimited") as "Unlimited-Len" FROM public."chartypes" as charT LIMIT 10;`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.chartypes",
        "Select",
      );
      dataSources.RunQuery();
      agHelper
        .GetText(dataSources._noRecordFound)
        .then(($noRecMsg: any) =>
          expect($noRecMsg).to.eq("No data records to show"),
        );
      dataSources.EnterQuery(query);
      agHelper.RenameQuery("selectRecords");
    });

    it("3. Creating all queries - chartypes", () => {
      query = `INSERT INTO public."chartypes" ("One(1)", "AsMany", "Limited(4)", "Unlimited")
    VALUES ({{Insertone.text}}, {{Insertasmany.text}}, {{Insertlimited.text}}::varchar(4), {{Insertunlimited.text}});`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.chartypes",
        "Insert",
      );
      dataSources.EnterQuery(query);
      agHelper.RenameQuery("insertRecord");

      query = `UPDATE public."chartypes" SET
    "One(1)" = {{Updateone.text}},
    "AsMany" = {{Updateasmany.text}},
    "Limited(4)" = {{Updatelimited.text}}::varchar(4),
    "Unlimited" = {{Updateunlimited.text}}
  WHERE serialid = {{Table1.selectedRow.serialid}};`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.chartypes",
        "Update",
      );
      dataSources.EnterQuery(query);
      agHelper.RenameQuery("updateRecord");

      query = `DELETE FROM public."chartypes"`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.chartypes",
        "Delete",
      );
      dataSources.EnterQuery(query);
      agHelper.RenameQuery("deleteAllRecords");

      query = `drop table public."chartypes"`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.chartypes",
        "Delete",
      );
      dataSources.EnterQuery(query);
      agHelper.RenameQuery("dropTable");

      query = `DELETE FROM public."chartypes" WHERE serialId = {{Table1.selectedRow.serialid}};`;
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.chartypes",
        "Delete",
      );
      dataSources.EnterQuery(query);
      agHelper.RenameQuery("deleteRecord");
    });

    it("4. Inserting record (null values) - chartypes", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      table.WaitForTableEmpty(); //asserting table is empty before inserting!
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq(" "); //white space for padding length!
      });
      table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("");
      });
      table.ReadTableRowColumnData(0, 5, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.eq(0);
      });
      table.ReadTableRowColumnData(0, 6, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.eq(0);
      });
    });

    it("5. Inserting record (not null values) - chartypes", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.EnterInputText("One_1_", "a");
      agHelper.EnterInputText(
        "AsMany",
        "Sailing ships were used for thousands of years!",
      );
      agHelper.EnterInputText("Limited_4_", "Ocean");
      agHelper.EnterInputText(
        "Unlimited",
        "At one time, the steamships Titanic, Olympic, and Britannic were the largest ships in the world, Titanic sank on her maiden voyage after hitting an iceberg, becoming one of the most famous shipwrecks of all time",
        false,
        false,
      );
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("a");
      });
      table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Ocea"); //asserting only 4 chars are inserted due to column dt constraint
      });
      table.ReadTableRowColumnData(1, 5, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
      });
      table.ReadTableRowColumnData(1, 6, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
      });
    });

    it("6. Inserting another record (not null values) - chartypes", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.EnterInputText("One_1_", "<");
      agHelper.EnterInputText(
        "AsMany",
        "Some planes can fly for more than five hours after one of their engines goes out.!",
      );
      agHelper.EnterInputText("Limited_4_", "Planes");
      agHelper.EnterInputText(
        "Unlimited",
        " In fact, according to the FAA, there are 5,000 planes in the air over the United States at any moment in time, and more than 8,000 flying across the globe.",
        false,
        false,
      );
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("<");
      });
      table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Plan");
      });
      table.ReadTableRowColumnData(2, 5, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.be.greaterThan(0);
      });
      table.ReadTableRowColumnData(2, 6, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.be.greaterThan(0);
      });
    });

    it("7. Updating record (emtying some field) - chartypes", () => {
      table.SelectTableRow(2);
      agHelper.ClickButton("Run UpdateQuery");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.EnterInputText("One_1_", ">", true);
      agHelper.EnterInputText(
        "AsMany",
        "Dimming the aircraft's lights serves a purpose beyond sleep.!",
        true,
      );
      agHelper.EnterInputText("Limited_4_", "Flights", true);
      agHelper.ClearInputText("Unlimited", false);
      agHelper.ClickButton("Update");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run UpdateQuery"),
      );
      table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq(">");
      });
      table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Flig");
      });
      table.ReadTableRowColumnData(2, 5, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.be.greaterThan(0);
      });
      table.ReadTableRowColumnData(2, 6, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.eq(0);
      });
    });

    it("8. Deleting records - chartypes", () => {
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

    it("9. Updating record (null inserted record) - chartypes", () => {
      agHelper.ClickButton("Run UpdateQuery");
      agHelper.AssertElementVisibility(locators._modal);
      //agHelper.EnterInputText("One_1_", "&");
      agHelper.EnterInputText(
        "AsMany",
        "First electric tram in England was opened in 1885 in Blackpool!",
      );
      agHelper.EnterInputText("Limited_4_", "Trams");
      agHelper.EnterInputText(
        "Unlimited",
        "The word tram is used mainly outside North America, while within North America these vehicles are called streetcars or trolleys as they run mainly on streets.The word tram is used mainly outside North America, while within North America these vehicles are called streetcars or trolleys as they run mainly on streets.",
        false,
        false,
      );
      agHelper.ClickButton("Update");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run UpdateQuery"),
      );
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        //since record updated is moving to last row in table - BUg 14347!
        expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq(" "); //Not updating one column
      });
      table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Tram");
      });
      table.ReadTableRowColumnData(1, 5, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.be.greaterThan(0);
      });
      table.ReadTableRowColumnData(1, 6, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.be.greaterThan(0);
      });
    });

    it("10. Inserting another record (+ve record - to check serial column) - chartypes", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.EnterInputText("One_1_", "e");
      agHelper.EnterInputText(
        "AsMany",
        "Sailing ships were used for thousands of years!",
      );
      agHelper.EnterInputText(
        "Unlimited",
        "At one time, the steamships Titanic, Olympic, and Britannic were the largest ships in the world, Titanic sank on her maiden voyage after hitting an iceberg, becoming one of the most famous shipwrecks of all time",
        false,
        false,
      );
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("e");
      });
      table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq(""); //asserting empty field inserted
      });
      table.ReadTableRowColumnData(2, 5, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
      });
      table.ReadTableRowColumnData(2, 6, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
      });
    });

    it("11. Deleting records - chartypes", () => {
      table.SelectTableRow(1);
      agHelper.ClickButton("DeleteQuery", 1);
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

    it("12. Deleting all records from table - chartypes", () => {
      agHelper.GetNClick(locators._deleteIcon);
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      agHelper.Sleep(2000);
      table.WaitForTableEmpty();
    });

    it("13. Inserting record (null record - to check serial column) - chartypes", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("5"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq(" ");
      });
      table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("");
      });
      table.ReadTableRowColumnData(0, 5, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.eq(0);
      });
      table.ReadTableRowColumnData(0, 6, "v1", 200).then(($cellData) => {
        expect(Number($cellData)).to.eq(0);
      });
    });

    it("14. Validate Drop of the Newly Created - chartypes - Table from Postgres datasource", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("dropTable", EntityType.Query);
      dataSources.RunQuery();
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("0"); //Success response for dropped table!
      });
      dataSources.AssertTableInVirtuosoList(dsName, "public.chartypes", false);
    });

    it("15. Verify Deletion of the datasource after all created queries are deleted", () => {
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Since all queries exists
      AppSidebar.navigate(AppSidebarButton.Editor);
      entityExplorer.DeleteAllQueriesForDB(dsName);
      deployMode.DeployApp();
      deployMode.NavigateBacktoEditor();
      dataSources.DeleteDatasourceFromWithinDS(dsName, 200); //ProductLines, Employees pages are still using this ds
    });
  },
);
