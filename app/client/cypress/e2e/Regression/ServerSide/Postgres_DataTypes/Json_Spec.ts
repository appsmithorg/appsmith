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
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(
  "Json & JsonB Datatype tests",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let dsName: any, query: string;

    before("Importing App & setting theme", () => {
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
      agHelper.AddDsl("Datatypes/JsonDTdsl");

      appSettings.OpenPaneAndChangeThemeColors(16, 20);
    });

    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    //#region Json Datatype

    it("1. Creating table query - jsonbooks", () => {
      query = `CREATE TABLE jsonbooks(serialId SERIAL PRIMARY KEY, details JSON)`;
      dataSources.CreateQueryForDS(dsName, query, "createTable");
      dataSources.RunQuery();
    });

    it("2. Creating SELECT query - jsonbooks + Bug 14493", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.jsonbooks",
        "Select",
      );
      agHelper.RenameWithInPane("selectRecords");
      dataSources.RunQuery();
      agHelper
        .GetText(dataSources._noRecordFound)
        .then(($noRecMsg) =>
          expect($noRecMsg).to.eq("No data records to show"),
        );
    });

    it("3. Creating all queries - jsonbooks", () => {
      query = `INSERT INTO jsonbooks(details) VALUES('{"customer": "{{InsertJSONForm.formData.customer}}", "title": "{{InsertJSONForm.formData.title}}", "type": {{InsertJSONForm.formData.type}}, "info": {"published": {{InsertJSONForm.formData.info.published}}, "price": {{InsertJSONForm.formData.info.price}}}}');`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("insertRecord");
      dataSources.ToggleUsePreparedStatement(false);

      query = `UPDATE public."jsonbooks" SET "details" = '{"customer": "{{UpdateJSONForm.formData.customer}}", "title": "{{UpdateJSONForm.formData.title}}", "type": {{UpdateJSONForm.formData.type}}, "info": {"published": {{UpdateJSONForm.formData.info.published}}, "price": {{UpdateJSONForm.formData.info.price}}}}' WHERE serialid = {{Table1.selectedRow.serialid}};`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("updateRecord");
      dataSources.ToggleUsePreparedStatement(false);

      query = `DELETE FROM public."jsonbooks" WHERE serialId ={{Table1.selectedRow.serialid}}`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("deleteRecord");

      query = `DELETE FROM public."jsonbooks"`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("deleteAllRecords");

      query = `drop table public."jsonbooks"`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("dropTable");
    });

    it("4. Inserting record - jsonbooks", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      table.WaitForTableEmpty(); //asserting table is empty before inserting!
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      deployMode.EnterJSONInputValue("Customer", "Lily Bush");
      deployMode.EnterJSONInputValue("Title", "PostgreSQL for Beginners");
      deployMode.SelectJsonFormMultiSelect("Type", ["Programming", "Computer"]);
      agHelper.ToggleSwitch("Published", "check", true);
      deployMode.EnterJSONInputValue("Price", "150");

      agHelper.ClickButton("Insert");
      agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Insert did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
        expect($cellData).not.to.eq("");
      });
    });

    it("5. Inserting another record - jsonbooks", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      deployMode.EnterJSONInputValue("Customer", "Josh William");
      deployMode.EnterJSONInputValue("Title", "Ivanhoe");
      deployMode.SelectJsonFormMultiSelect("Type", ["Adventure", "Novel"]);
      agHelper.ToggleSwitch("Published", "check", true);
      deployMode.EnterJSONInputValue("Price", "400");

      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
        expect($cellData).not.to.eq("");
      });
    });

    it("6. Inserting another record - jsonbooks", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      deployMode.EnterJSONInputValue("Customer", "Mary Clark");
      deployMode.EnterJSONInputValue("Title", "The Pragmatic Programmer");
      deployMode.SelectJsonFormMultiSelect("Type", ["Programming"], 0, true);
      agHelper.ToggleSwitch("Published", "uncheck", true);
      deployMode.EnterJSONInputValue("Price", "360");

      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
        expect($cellData).not.to.eq("");
      });
    });

    it("7. Updating record - jsonbooks", () => {
      table.SelectTableRow(1);
      agHelper.ClickButton("Run UpdateQuery");
      agHelper.AssertElementVisibility(locators._modal);

      deployMode.EnterJSONInputValue("Title", " Bill"); //Adding Bill to name
      agHelper.ToggleSwitch("Published", "uncheck", true);
      deployMode.ClearJSONFieldValue("Price");
      deployMode.EnterJSONInputValue("Price", "660");

      agHelper.ClickButton("Update");
      agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Update did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run UpdateQuery"),
      );
      agHelper.Sleep(5000); //Allowing time for update to be success for CI flaky behavior
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("3");
      });
      table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("2"); //Since recently updated column to pushed to last!
      });
      table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
        expect($cellData).not.to.eq("");
      });
    });

    it("8. Validating JSON functions", () => {
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
      //Verifying -> - returns results in json format
      query = `SELECT details -> 'title' AS "BookTitle" FROM jsonbooks;`;
      dataSources.CreateQueryForDS(dsName, query, "verifyJsonFunctions");
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["BookTitle"]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("PostgreSQL for Beginners");
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.eq("The Pragmatic Programmer");
      });
      dataSources.ReadQueryTableResponse(2).then(($cellData) => {
        expect($cellData).to.eq("Ivanhoe Bill");
      });

      //Verifying ->> - returns result in text format
      query = `SELECT details -> 'info' ->> 'price' AS "BookPrice" FROM jsonbooks;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["BookPrice"]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("150");
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.eq("360");
      });
      dataSources.ReadQueryTableResponse(2).then(($cellData) => {
        expect($cellData).to.eq("660");
      });

      //Verifying 'CAST' with 'WHERE' clause
      query = `SELECT details -> 'customer' AS "P+ Customer", details -> 'info'  ->> 'price' as "Book Price" FROM jsonbooks where CAST (details -> 'info'  ->> 'price' as INTEGER) > 360;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["P+ Customer", "Book Price"]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("Josh William");
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.eq("660");
      });

      //Verifying Aggregate functions
      query = `SELECT MIN (CAST (details -> 'info'  ->> 'price' as INTEGER)), MAX (CAST (details -> 'info'  ->> 'price' as INTEGER)), SUM (CAST (details -> 'info'  ->> 'price' as INTEGER)), AVG (CAST (details -> 'info'  ->> 'price' as INTEGER)), count(*) FROM jsonbooks;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "min",
        "max",
        "sum",
        "avg",
        "count",
      ]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("150");
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.eq("660");
      });
      dataSources.ReadQueryTableResponse(2).then(($cellData) => {
        expect($cellData).to.eq("1170");
      });
      dataSources.ReadQueryTableResponse(3).then(($cellData) => {
        expect($cellData).to.eq("390");
      });
      dataSources.ReadQueryTableResponse(4).then(($cellData) => {
        expect($cellData).to.eq("3");
      });

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("9. Deleting records - jsonbooks", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      table.WaitUntilTableLoad();
      table.SelectTableRow(1);
      agHelper.ClickButton("DeleteQuery", 1);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.Sleep(2500); //Allwowing time for delete to be success
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).not.to.eq("3"); //asserting 2nd record is deleted
      });
      table.ReadTableRowColumnData(1, 0, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("2");
      });
    });

    it("10. Deleting all records from table - jsonbooks", () => {
      agHelper.GetNClick(locators._deleteIcon);
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      agHelper.Sleep(2000);
      table.WaitForTableEmpty();
    });

    it("11. Inserting another record (to check serial column) - jsonbooks", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      deployMode.EnterJSONInputValue("Customer", "Bob Sim");
      deployMode.EnterJSONInputValue("Title", "Treasure Island");
      deployMode.SelectJsonFormMultiSelect("Type", ["Novel"]);
      agHelper.ToggleSwitch("Published", "uncheck", true);

      deployMode.EnterJSONInputValue("Price", "80");
      agHelper.AssertElementVisibility(
        locators._visibleTextDiv("Out of range!"),
      );
      deployMode.ClearJSONFieldValue("Price");
      deployMode.EnterJSONInputValue("Price", "800");

      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
        expect($cellData).not.to.eq("");
      });
    });

    it("12. Validate Drop of the Newly Created - jsonbooks - Table from Postgres datasource", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("dropTable", EntityType.Query);
      dataSources.RunQuery();
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("0"); //Success response for dropped table!
      });
      dataSources.AssertTableInVirtuosoList(dsName, "public.jsonbooks", false);
    });

    it("13. Verify Deletion of all created queries", () => {
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Since all queries exists
      entityExplorer.DeleteAllQueriesForDB(dsName);
    });

    //#endregion

    //#region JsonB Datatype

    it("14. Importing App & setting theme", () => {
      agHelper.AddDsl("Datatypes/JsonBDTdsl");

      appSettings.OpenPaneAndChangeThemeColors(12, 23);
    });

    it("15. Creating enum & table queries - jsonBbooks", () => {
      query = `CREATE TYPE genres AS ENUM ('Fiction', 'Thriller', 'Horror', 'Marketing & Sales', 'Self-Help', 'Psychology', 'Law', 'Politics', 'Productivity', 'Reference', 'Spirituality');`;
      dataSources.CreateQueryForDS(dsName, query, "createEnum");
      dataSources.RunQuery();

      query = `CREATE TABLE "jsonBbooks" (serialId SERIAL PRIMARY KEY, details JSONB)`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("createTable");
      dataSources.RunQuery();
    });

    it("16. Creating SELECT query - jsonBbooks + Bug 14493", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.jsonBbooks",
        "Select",
      );
      agHelper.RenameWithInPane("selectRecords");
      dataSources.RunQuery();
      agHelper
        .GetText(dataSources._noRecordFound)
        .then(($noRecMsg) =>
          expect($noRecMsg).to.eq("No data records to show"),
        );
    });

    it("17. Creating all queries - jsonBbooks", () => {
      query = `INSERT INTO "jsonBbooks"(details) VALUES('{"title": "{{InsertJSONForm.formData.title}}", "genres": {{InsertJSONForm.formData.genres}}, "info": {"published": {{InsertJSONForm.formData.info.published}}, "publishedDate": "{{InsertJSONForm.formData.info.publishedDate}}"}}');`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("insertRecord");
      dataSources.ToggleUsePreparedStatement(false);

      query = `UPDATE public."jsonBbooks" SET "details" = '{"title": "{{UpdateJSONForm.formData.title}}", "genres": {{UpdateJSONForm.formData.genres}}, "info": {"published": {{UpdateJSONForm.formData.info.published}}, "publishedDate": "{{UpdateJSONForm.formData.info.publishedDate}}"}}' WHERE serialid = {{Table1.selectedRow.serialid}};`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("updateRecord");
      dataSources.ToggleUsePreparedStatement(false);

      query = `SELECT * from enum_range(NULL::genres)`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("getEnum");

      query = `DELETE FROM public."jsonBbooks" WHERE serialId ={{Table1.selectedRow.serialid}}`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("deleteRecord");

      query = `DELETE FROM public."jsonBbooks"`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("deleteAllRecords");

      query = `drop table public."jsonBbooks"`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("dropTable");

      query = `drop type genres`;
      entityExplorer.CreateNewDsQuery(dsName);
      dataSources.EnterQuery(query);
      agHelper.RenameWithInPane("dropEnum");
    });

    it("18. Inserting record - jsonbooks", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      table.WaitForTableEmpty(); //asserting table is empty before inserting!
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      deployMode.EnterJSONInputValue("Title", "Sleeping Beauties");
      agHelper.ToggleSwitch("Published", "check", true);
      agHelper.GetNClick(
        deployMode._jsonFormDatepickerFieldByName("Published Date"),
      );
      agHelper.GetNClick(locators._datePicker(5));
      agHelper.GetNClick(deployMode._jsonFieldName("Genres"));
      deployMode.SelectJsonFormMultiSelect("Genres", [
        "Fiction",
        "Thriller",
        "Horror",
      ]);

      agHelper.ClickButton("Insert");
      agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Insert did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
        expect($cellData).not.to.eq("");
      });
    });

    it("19. Inserting another record - jsonbooks", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      deployMode.EnterJSONInputValue("Title", "Deep Work");
      agHelper.ToggleSwitch("Published", "check", true);
      agHelper.GetNClick(
        deployMode._jsonFormDatepickerFieldByName("Published Date"),
      );
      agHelper.GetNClick(locators._datePicker(15));
      agHelper.GetNClick(deployMode._jsonFieldName("Genres"));
      deployMode.SelectJsonFormMultiSelect("Genres", [
        "Productivity",
        "Reference",
      ]);

      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
        expect($cellData).not.to.eq("");
      });
    });

    it("20. Inserting another record - jsonbooks", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      deployMode.EnterJSONInputValue("Title", "Siddhartha");
      agHelper.ToggleSwitch("Published", "uncheck", true);
      agHelper.GetNClick(
        deployMode._jsonFormDatepickerFieldByName("Published Date"),
      );
      agHelper.GetNClick(locators._datePicker(15));
      agHelper.GetNClick(deployMode._jsonFieldName("Genres"));
      deployMode.SelectJsonFormMultiSelect("Genres", [
        "Fiction",
        "Spirituality",
      ]);

      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
        expect($cellData).not.to.eq("");
      });
    });

    it("21. Updating record - jsonbooks", () => {
      //table.SelectTableRow(0);
      agHelper.ClickButton("Run UpdateQuery");
      agHelper.AssertElementVisibility(locators._modal);

      deployMode.ClearJSONFieldValue("Title");
      deployMode.EnterJSONInputValue("Title", "The Dictator''s Handbook"); //Adding Bill to name
      agHelper.ToggleSwitch("Published", "uncheck", true);
      agHelper.GetNClick(
        deployMode._jsonFormDatepickerFieldByName("Published Date"),
      );
      agHelper.GetNClick(locators._datePicker(25));
      agHelper.GetNClick(deployMode._jsonFieldName("Genres"));
      deployMode.SelectJsonFormMultiSelect(
        "Genres",
        ["Fiction", "Thriller", "Horror"],
        0,
        false,
      );
      deployMode.SelectJsonFormMultiSelect("Genres", ["Law", "Politics"]);

      agHelper.ClickButton("Update");
      agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Update did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run UpdateQuery"),
      );
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("3");
      });
      table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("1"); //Since recently updated column to pushed to last!
      });
      table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
        expect($cellData).not.to.eq("");
      });
    });

    it("22. Validating JSON functions", () => {
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
      //Verifying @> contains
      query = `SELECT '["Fiction", "Thriller", "Horror"]'::jsonb @> '["Fiction", "Horror"]'::jsonb as "Result1", '["Fiction", "Horror"]'::jsonb @> '["Fiction", "Thriller", "Horror"]'::jsonb as "Result2", '{"name": "Alice", "agent": {"bot": true} }'::jsonb -> 'agent' ->> 'bot' is not null as "Filter"`;
      dataSources.CreateQueryForDS(dsName, query, "verifyJsonBFunctions");
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["Result1", "Result2", "Filter"]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("true");
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.eq("false");
      });
      dataSources.ReadQueryTableResponse(2).then(($cellData) => {
        expect($cellData).to.eq("true");
      });

      //Verifying ->> - returns result in text format & checks contains
      query = `SELECT details->'title' as "BookTitle", details -> 'info' ->> 'publishedDate' as "Published Date" FROM "jsonBbooks" WHERE details->'genres' @> '["Fiction"]'::jsonb;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["BookTitle", "Published Date"]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("Siddhartha");
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.contain("15");
      });

      //Verifying Top Level key is present
      query = `SELECT '{"book": {"title": "War and Peace"}}'::jsonb @> '{"book": {}}'::jsonb as "Top Level Key"; `;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["Top Level Key"]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("true");
      });

      //Verifying jsonb functions
      query = `select jsonb_each( '{"name": "Alice", "agent": {"bot": true} }'::jsonb), jsonb_object_keys( '{"name": "Alice", "agent": {"bot": true} }'::jsonb), jsonb_extract_path( '{"name": "Alice", "agent": {"bot": true} }'::jsonb, 'agent', 'bot');`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "jsonb_each",
        "jsonb_object_keys",
        "jsonb_extract_path",
      ]);
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq('(name,"""Alice""")');
      });
      dataSources.ReadQueryTableResponse(1).then(($cellData) => {
        expect($cellData).to.eq("name");
      });
      dataSources.ReadQueryTableResponse(2).then(($cellData) => {
        expect($cellData).to.eq("true");
      });
      dataSources.ReadQueryTableResponse(3).then(($cellData) => {
        expect($cellData).to.eq('(agent,"{""bot"": true}")');
      });
      dataSources.ReadQueryTableResponse(4).then(($cellData) => {
        expect($cellData).to.eq("agent");
      });
      dataSources.ReadQueryTableResponse(5).then(($cellData) => {
        expect($cellData).to.eq("true");
      });

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("23. Deleting records - jsonbooks", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      table.WaitUntilTableLoad();
      table.SelectTableRow(1);
      agHelper.ClickButton("DeleteQuery", 1);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.Sleep(2500); //Allwowing time for delete to be success
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).not.to.eq("3"); //asserting 2nd record is deleted
      });
      table.ReadTableRowColumnData(1, 0, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("1");
      });
    });

    it("24. Deleting all records from table - jsonbooks", () => {
      agHelper.GetNClick(locators._deleteIcon);
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      agHelper.Sleep(2000);
      table.WaitForTableEmpty();
    });

    it("25. Inserting another record (to check serial column) - jsonbooks", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      deployMode.EnterJSONInputValue("Title", "Influence");
      agHelper.ToggleSwitch("Published", "check", true);
      agHelper.GetNClick(
        deployMode._jsonFormDatepickerFieldByName("Published Date"),
      );
      agHelper.GetNClick(locators._datePicker(16));
      agHelper.GetNClick(deployMode._jsonFieldName("Genres"));

      deployMode.SelectJsonFormMultiSelect("Genres", [
        "Marketing & Sales",
        "Self-Help",
        "Psychology",
      ]);

      agHelper.ClickButton("Insert");
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
      });
      table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
        expect($cellData).not.to.eq("");
      });
    });

    it("26. Validate Drop of the Newly Created - jsonbooks - Table from Postgres datasource", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("dropTable", EntityType.Query);
      dataSources.RunQuery();
      dataSources.ReadQueryTableResponse(0).then(($cellData) => {
        expect($cellData).to.eq("0"); //Success response for dropped table!
      });
      dataSources.AssertTableInVirtuosoList(dsName, "public.jsonBbooks", false);
    });

    it("27. Verify Deletion of all created queries", () => {
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Since all queries exists
      entityExplorer.DeleteAllQueriesForDB(dsName);
    });

    //#endregion

    it("28. Verify Deletion of datasource", () => {
      deployMode.DeployApp();
      deployMode.NavigateBacktoEditor();
      dataSources.DeleteDatasourceFromWithinDS(dsName, 200);
    });
  },
);
