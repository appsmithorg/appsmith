import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any, query: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode;

describe("Json & JsonB Datatype tests", function() {
  before(() => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  //#region Json Datatype

  it("0. Importing App & setting theme", () => {
    cy.fixture("Datatypes/JsonDTdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    ee.NavigateToSwitcher("widgets");
    propPane.ChangeColor(33, "Primary");
    propPane.ChangeColor(39, "Background");
  });

  it("1. Creating table query - jsonbooks", () => {
    query = `CREATE TABLE jsonbooks(serialId SERIAL PRIMARY KEY, details JSON)`;
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("createTable");
    dataSources.EnterQuery(query);
    dataSources.RunQuery();

    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(ee._entityNameInExplorer("public.jsonbooks"));
  });

  it("2. Creating SELECT query - jsonbooks + Bug 14493", () => {
    ee.ActionTemplateMenuByEntityName("public.jsonbooks", "SELECT");
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
  });

  it("3. Creating all queries - jsonbooks", () => {
    query = `INSERT INTO jsonbooks(details) VALUES('{"customer": "{{InsertJSONForm.formData.customer}}", "title": "{{InsertJSONForm.formData.title}}", "type": {{InsertJSONForm.formData.type}}, "info": {"published": {{InsertJSONForm.formData.info.published}}, "price": {{InsertJSONForm.formData.info.price}}}}');`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("insertRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.ToggleUsePreparedStatement(false);

    query = `UPDATE public."jsonbooks" SET "details" = '{"customer": "{{UpdateJSONForm.formData.customer}}", "title": "{{UpdateJSONForm.formData.title}}", "type": {{UpdateJSONForm.formData.type}}, "info": {"published": {{UpdateJSONForm.formData.info.published}}, "price": {{UpdateJSONForm.formData.info.price}}}}' WHERE serialid = {{Table1.selectedRow.serialid}};`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("updateRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.ToggleUsePreparedStatement(false);

    query = `DELETE FROM public."jsonbooks" WHERE serialId ={{Table1.selectedRow.serialid}}`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."jsonbooks"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteAllRecords");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `drop table public."jsonbooks"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("dropTable");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    ee.ExpandCollapseEntity("QUERIES/JS", false);
    ee.ExpandCollapseEntity(dsName, false);
  });

  it("4. Inserting record - jsonbooks", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    deployMode.EnterJSONInputValue("Customer", "Lily Bush");
    deployMode.EnterJSONInputValue("Title", "PostgreSQL for Beginners");
    deployMode.SelectJsonFormMultiSelect("Type", ["Programming", "Computer"]);
    agHelper.ToggleSwitch("Published", "check", true);
    deployMode.EnterJSONInputValue("Price", "150");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Insert did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("5. Inserting another record - jsonbooks", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    deployMode.EnterJSONInputValue("Customer", "Josh William");
    deployMode.EnterJSONInputValue("Title", "Ivanhoe");
    deployMode.SelectJsonFormMultiSelect("Type", ["Adventure", "Novel"]);
    agHelper.ToggleSwitch("Published", "check", true);
    deployMode.EnterJSONInputValue("Price", "400");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("6. Inserting another record - jsonbooks", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    deployMode.EnterJSONInputValue("Customer", "Mary Clark");
    deployMode.EnterJSONInputValue("Title", "The Pragmatic Programmer");
    deployMode.SelectJsonFormMultiSelect("Type", ["Programming"], 0, true);
    agHelper.ToggleSwitch("Published", "uncheck", true);
    deployMode.EnterJSONInputValue("Price", "360");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("7. Updating record - jsonbooks", () => {
    table.SelectTableRow(1);
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locator._modal);

    deployMode.EnterJSONInputValue("Title", " Bill"); //Adding Bill to name
    agHelper.ToggleSwitch("Published", "uncheck", true);
    deployMode.ClearJSONFieldValue("Price");
    deployMode.EnterJSONInputValue("Price", "660");

    agHelper.ClickButton("Update");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Update did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run UpdateQuery"));
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //Since recently updated column to pushed to last!
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("8. Validating JSON functions", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    ee.ExpandCollapseEntity("QUERIES/JS");
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.RenameWithInPane("verifyJsonFunctions");

    //Verifying -> - returns results in json format
    query = `SELECT details -> 'title' AS "BookTitle" FROM jsonbooks;`;
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
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

    agHelper.ActionContextMenuWithInPane("Delete");
    ee.ExpandCollapseEntity("QUERIES/JS", false);
  });

  it("9. Deleting records - jsonbooks", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitUntilTableLoad();
    table.SelectTableRow(1);
    agHelper.ClickButton("DeleteQuery", 1);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(2500); //Allwowing time for delete to be success
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).not.to.eq("3"); //asserting 2nd record is deleted
    });
    table.ReadTableRowColumnData(1, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("2");
    });
  });

  it("10. Deleting all records from table - jsonbooks", () => {
    agHelper.GetNClick(locator._deleteIcon);
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("11. Inserting another record (to check serial column) - jsonbooks", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    deployMode.EnterJSONInputValue("Customer", "Bob Sim");
    deployMode.EnterJSONInputValue("Title", "Treasure Island");
    deployMode.SelectJsonFormMultiSelect("Type", ["Novel"]);
    agHelper.ToggleSwitch("Published", "uncheck", true);

    deployMode.EnterJSONInputValue("Price", "80");
    agHelper.AssertElementVisible(locator._visibleTextDiv("Out of range!"));
    deployMode.ClearJSONFieldValue("Price");
    deployMode.EnterJSONInputValue("Price", "800");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("12. Validate Drop of the Newly Created - jsonbooks - Table from Postgres datasource", () => {
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
    agHelper.AssertElementAbsence(ee._entityNameInExplorer("public.jsonbooks"));
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

  //#endregion

  //#region JsonB Datatype

  it("14. Importing App & setting theme", () => {
    cy.fixture("Datatypes/JsonBDTdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    ee.NavigateToSwitcher("widgets");
    propPane.ChangeColor(12, "Primary");
    propPane.ChangeColor(23, "Background");
  });

  it("15. Creating enum & table queries - jsonBbooks", () => {
    query = `CREATE TYPE genres AS ENUM ('Fiction', 'Thriller', 'Horror', 'Marketing & Sales', 'Self-Help', 'Psychology', 'Law', 'Politics', 'Productivity', 'Reference', 'Spirituality');`;
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("createEnum");
    dataSources.EnterQuery(query);
    dataSources.RunQuery();

    query = `CREATE TABLE "jsonBbooks" (serialId SERIAL PRIMARY KEY, details JSONB)`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("createTable");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.RunQuery();

    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(
      ee._entityNameInExplorer("public.jsonBbooks"),
    );
  });

  it("16. Creating SELECT query - jsonBbooks + Bug 14493", () => {
    ee.ActionTemplateMenuByEntityName("public.jsonBbooks", "SELECT");
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
  });

  it("17. Creating all queries - jsonBbooks", () => {
    query = `INSERT INTO "jsonBbooks"(details) VALUES('{"title": "{{InsertJSONForm.formData.title}}", "genres": {{InsertJSONForm.formData.genres}}, "info": {"published": {{InsertJSONForm.formData.info.published}}, "publishedDate": "{{InsertJSONForm.formData.info.publishedDate}}"}}');`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("insertRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.ToggleUsePreparedStatement(false);

    query = `UPDATE public."jsonBbooks" SET "details" = '{"title": "{{UpdateJSONForm.formData.title}}", "genres": {{UpdateJSONForm.formData.genres}}, "info": {"published": {{UpdateJSONForm.formData.info.published}}, "publishedDate": "{{UpdateJSONForm.formData.info.publishedDate}}"}}' WHERE serialid = {{Table1.selectedRow.serialid}};`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("updateRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.ToggleUsePreparedStatement(false);

    query = `SELECT * from enum_range(NULL::genres)`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("getEnum");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."jsonBbooks" WHERE serialId ={{Table1.selectedRow.serialid}}`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."jsonBbooks"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteAllRecords");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `drop table public."jsonBbooks"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("dropTable");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `drop type genres`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("dropEnum");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    ee.ExpandCollapseEntity("QUERIES/JS", false);
    ee.ExpandCollapseEntity(dsName, false);
  });

  it("18. Inserting record - jsonbooks", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    deployMode.EnterJSONInputValue("Title", "Sleeping Beauties");
    agHelper.ToggleSwitch("Published", "check", true);
    agHelper.GetNClick(
      deployMode._jsonFormDatepickerFieldByName("Published Date"),
    );
    agHelper.GetNClick(locator._datePicker(5));
    deployMode.SelectJsonFormMultiSelect("Genres", [
      "Fiction",
      "Thriller",
      "Horror",
    ]);

    agHelper.ClickButton("Insert");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Insert did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("19. Inserting another record - jsonbooks", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    deployMode.EnterJSONInputValue("Title", "Deep Work");
    agHelper.ToggleSwitch("Published", "check", true);
    agHelper.GetNClick(
      deployMode._jsonFormDatepickerFieldByName("Published Date"),
    );
    agHelper.GetNClick(locator._datePicker(15));
    deployMode.SelectJsonFormMultiSelect("Genres", [
      "Productivity",
      "Reference",
    ]);

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("20. Inserting another record - jsonbooks", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    deployMode.EnterJSONInputValue("Title", "Siddhartha");
    agHelper.ToggleSwitch("Published", "uncheck", true);
    agHelper.GetNClick(
      deployMode._jsonFormDatepickerFieldByName("Published Date"),
    );
    agHelper.GetNClick(locator._datePicker(15));
    deployMode.SelectJsonFormMultiSelect("Genres", ["Fiction", "Spirituality"]);

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("21. Updating record - jsonbooks", () => {
    //table.SelectTableRow(0);
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locator._modal);

    deployMode.ClearJSONFieldValue("Title");
    deployMode.EnterJSONInputValue("Title", "The Dictator''s Handbook"); //Adding Bill to name
    agHelper.ToggleSwitch("Published", "uncheck", true);
    agHelper.GetNClick(
      deployMode._jsonFormDatepickerFieldByName("Published Date"),
    );
    agHelper.GetNClick(locator._datePicker(25));
    deployMode.SelectJsonFormMultiSelect(
      "Genres",
      ["Fiction", "Thriller", "Horror"],
      0,
      false,
    );
    deployMode.SelectJsonFormMultiSelect("Genres", ["Law", "Politics"]);

    agHelper.ClickButton("Update");
    agHelper.AssertElementAbsence(locator._toastMsg); //Assert that Update did not fail
    agHelper.AssertElementVisible(locator._spanButton("Run UpdateQuery"));
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //Since recently updated column to pushed to last!
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("22. Validating JSON functions", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    ee.ExpandCollapseEntity("QUERIES/JS");
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.RenameWithInPane("verifyJsonBFunctions");

    //Verifying @> contains
    query = `SELECT '["Fiction", "Thriller", "Horror"]'::jsonb @> '["Fiction", "Horror"]'::jsonb as "Result1", '["Fiction", "Horror"]'::jsonb @> '["Fiction", "Thriller", "Horror"]'::jsonb as "Result2", '{"name": "Alice", "agent": {"bot": true} }'::jsonb -> 'agent' ->> 'bot' is not null as "Filter"`;
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
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
    dataSources.AssertQueryResponseHeaders(["jsonb_each", "jsonb_object_keys", "jsonb_extract_path"]);
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

    agHelper.ActionContextMenuWithInPane("Delete");
    ee.ExpandCollapseEntity("QUERIES/JS", false);
  });

  it("23. Deleting records - jsonbooks", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitUntilTableLoad();
    table.SelectTableRow(1);
    agHelper.ClickButton("DeleteQuery", 1);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(2500); //Allwowing time for delete to be success
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).not.to.eq("3"); //asserting 2nd record is deleted
    });
    table.ReadTableRowColumnData(1, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("1");
    });
  });

  it("24. Deleting all records from table - jsonbooks", () => {
    agHelper.GetNClick(locator._deleteIcon);
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("25. Inserting another record (to check serial column) - jsonbooks", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    deployMode.EnterJSONInputValue("Title", "Influence");
    agHelper.ToggleSwitch("Published", "check", true);
    agHelper.GetNClick(
      deployMode._jsonFormDatepickerFieldByName("Published Date"),
    );
    agHelper.GetNClick(locator._datePicker(16));
    deployMode.SelectJsonFormMultiSelect("Genres", ["Marketing & Sales", "Self-Help", "Psychology"]);

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("26. Validate Drop of the Newly Created - jsonbooks - Table from Postgres datasource", () => {
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
    agHelper.AssertElementAbsence(ee._entityNameInExplorer("public.jsonBbooks"));
    ee.ExpandCollapseEntity(dsName, false);
    ee.ExpandCollapseEntity("DATASOURCES", false);
  });

  it("27. Verify Deletion of all created queries", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("createEnum", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("createTable", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName(
      "deleteAllRecords",
      "Delete",
      "Are you sure?",
    );
    ee.ActionContextMenuByEntityName("deleteRecord", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("dropTable", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("dropEnum", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("getEnum", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("insertRecord", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName(
      "selectRecords",
      "Delete",
      "Are you sure?",
    );
    ee.ActionContextMenuByEntityName("updateRecord", "Delete", "Are you sure?");
  });

  //#endregion

  it("28. Verify Deletion of datasource", () => {
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("QUERIES/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
  });
});
