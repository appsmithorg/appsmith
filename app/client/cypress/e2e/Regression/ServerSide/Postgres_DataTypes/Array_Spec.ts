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
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Array Datatype tests",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let dsName: any, query: string;

    before("Create DS, Add DS & setting theme", () => {
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
      agHelper.AddDsl("Datatypes/ArrayDTdsl");
      appSettings.OpenPaneAndChangeThemeColors(-31, -27);
    });

    it("1. Creating table query - arraytypes + Bug 14493", () => {
      dataSources.CreateQueryForDS(
        dsName,
        `CREATE TABLE arraytypes (serialId SERIAL not null primary key, name text, pay_by_quarter  integer[], schedule text[][]);`,
        "createTable",
      );
      dataSources.RunQuery();

      //Creating other queries
      query = `INSERT INTO arraytypes ("name", "pay_by_quarter", "schedule")  VALUES ('{{Insertname.text}}', ARRAY{{Insertpaybyquarter.text.split(',').map(Number)}}, ARRAY[['{{Insertschedule.text.split(',').slice(0,2).toString()}}'],['{{Insertschedule.text.split(',').slice(2,4).toString()}}']]);`;

      dataSources.CreateQueryFromOverlay(dsName, query, "insertRecord"); //Creating query from EE overlay
      dataSources.ToggleUsePreparedStatement(false);

      query = `UPDATE public."arraytypes" SET "name" = '{{Updatename.text}}', "pay_by_quarter" = ARRAY{{Updatepaybyquarter.text.split(',').map(Number)}},
      "schedule" = ARRAY[['{{Updateschedule.text.split(',').slice(0,2).toString()}}'],['{{Updateschedule.text.split(',').slice(2,4).toString()}}']] WHERE serialid = {{Table1.selectedRow.serialid}};`;

      dataSources.CreateQueryFromOverlay(dsName, query, "updateRecord"); //Creating query from EE overlay
      dataSources.ToggleUsePreparedStatement(false);

      query = `DELETE FROM public."arraytypes" WHERE serialId = {{Table1.selectedRow.serialid}}`;
      dataSources.CreateQueryFromOverlay(dsName, query, "deleteRecord"); //Creating query from EE overlay

      query = `DELETE FROM public."arraytypes"`;
      dataSources.CreateQueryFromOverlay(dsName, query, "deleteAllRecords"); //Creating query from EE overlay

      query = `DROP table public."arraytypes"`;
      dataSources.CreateQueryFromOverlay(dsName, query, "dropTable"); //Creating query from EE overlay

      //Creating SELECT query - arraytypes + Bug 14493
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.arraytypes",
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

    it("2. Inserting record - arraytypes", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      deployMode.DeployApp();
      table.WaitForTableEmpty(); //asserting table is empty before inserting!
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.EnterInputText("Name", "Lily Bush");
      agHelper.EnterInputText("Pay_by_quarter", "100,200,300,400");
      agHelper.EnterInputText("Schedule", "Arrival,Breakfast,Meeting,Lunch");

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

    it("3. Inserting another record - arraytypes", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.EnterInputText("Name", "Josh William");
      agHelper.EnterInputText("Pay_by_quarter", "8700,5454,9898,23257");
      agHelper.EnterInputText("Schedule", "Stand up,Update,Report,Executive");

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

    it("4. Inserting another record - arraytypes", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.EnterInputText("Name", "Mary Clark");
      agHelper.EnterInputText("Pay_by_quarter", "9898,21726,87387,8372837");
      agHelper.EnterInputText(
        "Schedule",
        "Travel,Meet Sales,Take Action,Sky Rocket",
      );

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

    it("5. Updating record - arraytypes", () => {
      table.SelectTableRow(1);
      agHelper.ClickButton("Run UpdateQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.EnterInputText("Name", "Josh Clarion", true);
      agHelper.EnterInputText("Pay_by_quarter", "3232,3232,4567,12234", true);
      agHelper.EnterInputText(
        "Schedule",
        "Breakfat,Presentation,Consulting,Training",
        true,
      );

      agHelper.ClickButton("Update");
      agHelper.AssertElementAbsence(locators._toastMsg); //Assert that Update did not fail
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run UpdateQuery"),
      );
      table.WaitUntilTableLoad();
      agHelper.Sleep(5000); //some more time for rows to rearrange!
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

    it("6. Validating JSON functions", () => {
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      dataSources.CreateQueryForDS(dsName);
      agHelper.RenameWithInPane("verifyArrayFunctions");

      query = `SELECT name FROM arraytypes WHERE pay_by_quarter[1] <> pay_by_quarter[2];`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["name"]);
      dataSources.AssertQueryTableResponse(0, "Lily Bush");
      dataSources.AssertQueryTableResponse(1, "Mary Clark");

      query = `SELECT pay_by_quarter[3] FROM arraytypes;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["pay_by_quarter"]);
      dataSources.AssertQueryTableResponse(0, "300");
      dataSources.AssertQueryTableResponse(1, "87387");
      dataSources.AssertQueryTableResponse(2, "4567");

      //Verifying OR
      query = `SELECT * FROM arraytypes WHERE pay_by_quarter[1] = 300 OR pay_by_quarter[2] = 200 OR pay_by_quarter[3] = 4567 OR pay_by_quarter[4] = 10000;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "serialid",
        "name",
        "pay_by_quarter",
        "schedule",
      ]);
      dataSources.AssertQueryTableResponse(0, "1");
      dataSources.AssertQueryTableResponse(1, "Lily Bush");
      dataSources.AssertQueryTableResponse(4, "2");
      dataSources.AssertQueryTableResponse(5, "Josh Clarion");

      //Verifying &&
      query = `SELECT * FROM arraytypes WHERE pay_by_quarter && ARRAY[87387];`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "serialid",
        "name",
        "pay_by_quarter",
        "schedule",
      ]);
      dataSources.AssertQueryTableResponse(0, "3");
      dataSources.AssertQueryTableResponse(1, "Mary Clark");
      dataSources.AssertQueryTableResponse(2, "[9898,21726,87387,8372837]");
      dataSources.AssertQueryTableResponse(
        3,
        `[["Travel,Meet Sales"],["Take Action,Sky Rocket"]]`,
      );

      //Verifying ANY
      query = `SELECT * FROM arraytypes WHERE 9898 = ANY (pay_by_quarter);`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "serialid",
        "name",
        "pay_by_quarter",
        "schedule",
      ]);
      dataSources.AssertQueryTableResponse(0, "3");
      dataSources.AssertQueryTableResponse(1, "Mary Clark");

      //Verifying generate_script
      query = `SELECT * FROM
    (SELECT pay_by_quarter,
            generate_subscripts(pay_by_quarter, 1) AS position
       FROM arraytypes) AS foo
  WHERE pay_by_quarter[position] = 100;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["pay_by_quarter", "position"]);
      dataSources.AssertQueryTableResponse(0, "[100,200,300,400]");
      dataSources.AssertQueryTableResponse(1, "1");

      query = `SELECT * FROM
    (SELECT pay_by_quarter,
            generate_subscripts(pay_by_quarter, 1) AS position
       FROM arraytypes) AS foo
  WHERE pay_by_quarter[position] = 3232;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["pay_by_quarter", "position"]);
      dataSources.AssertQueryTableResponse(0, "[3232,3232,4567,12234]");
      dataSources.AssertQueryTableResponse(1, "1");
      dataSources.AssertQueryTableResponse(2, "[3232,3232,4567,12234]");
      dataSources.AssertQueryTableResponse(3, "2");

      //Verifying ALL
      query = `SELECT * FROM arraytypes WHERE 100 = ALL (pay_by_quarter);`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      agHelper
        .GetText(dataSources._noRecordFound)
        .then(($noRecMsg) =>
          expect($noRecMsg).to.eq("No data records to show"),
        );

      //Verifying unnest
      query = `SELECT name, unnest(schedule) FROM arraytypes;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["name", "unnest"]);
      dataSources.AssertQueryTableResponse(0, "Lily Bush");
      dataSources.AssertQueryTableResponse(1, "Arrival,Breakfast");
      dataSources.AssertQueryTableResponse(4, "Mary Clark");
      dataSources.AssertQueryTableResponse(5, "Travel,Meet Sales");
      dataSources.AssertQueryTableResponse(10, "Josh Clarion");
      dataSources.AssertQueryTableResponse(11, "Consulting,Training");

      //Verifying index access
      query = `SELECT schedule[1:2][1:1] FROM arraytypes WHERE name = 'Lily Bush';`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["schedule"]);
      dataSources.AssertQueryTableResponse(
        0,
        `[["Arrival,Breakfast"],["Meeting,Lunch"]]`,
      );

      //Verifying index access
      query = `SELECT schedule[1:2][2] FROM arraytypes WHERE name = 'Josh Clarion';`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["schedule"]);
      dataSources.AssertQueryTableResponse(
        0,
        `[["Breakfat,Presentation"],["Consulting,Training"]]`,
      );

      query = `SELECT schedule[:1][1:] FROM arraytypes WHERE name = 'Mary Clark';`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["schedule"]);
      dataSources.AssertQueryTableResponse(0, `[["Travel,Meet Sales"]]`);

      query = `SELECT schedule[2:2][:] FROM arraytypes WHERE name = 'Mary Clark';`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["schedule"]);
      dataSources.AssertQueryTableResponse(0, `[["Take Action,Sky Rocket"]]`);

      //Verifying array_dims
      query = `SELECT array_dims(schedule) FROM arraytypes WHERE name = 'Lily Bush';`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["array_dims"]);
      dataSources.AssertQueryTableResponse(0, "[1:2][1:1]");

      //Verifying array_length
      query = `SELECT array_length(schedule, 1) FROM arraytypes WHERE name = 'Mary Clark';`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["array_length"]);
      dataSources.AssertQueryTableResponse(0, "2");

      //Verifying array_upper, cardinality
      query = `SELECT array_upper(pay_by_quarter, 1), cardinality(schedule)  FROM arraytypes WHERE name = 'Josh Clarion';`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["array_upper", "cardinality"]);
      dataSources.AssertQueryTableResponse(0, "4");
      dataSources.AssertQueryTableResponse(1, "2");

      //Verifying ||
      query = `SELECT ARRAY[1,2] || ARRAY[3,4] as "Test ||", ARRAY[5,6] || ARRAY[[1,2],[3,4]] as "Test || of 2D Array", ARRAY[1, 2] || '{3, 4}' as "Test || with {}"`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "Test ||",
        "Test || of 2D Array",
        "Test || with {}",
      ]);
      dataSources.AssertQueryTableResponse(0, "[1,2,3,4]");
      dataSources.AssertQueryTableResponse(1, "[[5,6],[1,2],[3,4]]");
      dataSources.AssertQueryTableResponse(2, "[1,2,3,4]");

      //Verifying array_dims
      query = `SELECT array_dims(1 || '[0:1]={2,3}'::int[]) as "array_dims1", array_dims(ARRAY[1,2] || 3) as "array_dims2", array_dims(ARRAY[1,2] || ARRAY[3,4,5]) as "array_dims3", array_dims(ARRAY[[1,2],[3,4]] || ARRAY[[5,6],[7,8],[9,0]])  as "array_dims4";`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "array_dims1",
        "array_dims2",
        "array_dims3",
        "array_dims4",
      ]);
      dataSources.AssertQueryTableResponse(0, "[0:2]");
      dataSources.AssertQueryTableResponse(1, "[1:3]");
      dataSources.AssertQueryTableResponse(2, "[1:5]");
      dataSources.AssertQueryTableResponse(3, "[1:5][1:2]");

      //Verifying array_prepend, array_append
      query = `SELECT array_prepend(1, ARRAY[2,3]) as "array_prepend", array_append(ARRAY[1,2], 3) as "array_append";`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["array_prepend", "array_append"]);
      dataSources.AssertQueryTableResponse(0, "[1,2,3]");
      dataSources.AssertQueryTableResponse(1, "[1,2,3]");

      //Verifying array_cat
      query = `SELECT array_cat(ARRAY[1,2], ARRAY[3,4]) as "array_cat1", array_cat(ARRAY[[1,2],[3,4]], ARRAY[5,6]) as "array_cat2", array_cat(ARRAY[5,6], ARRAY[[1,2],[3,4]]) as "array_cat3"`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "array_cat1",
        "array_cat2",
        "array_cat3",
      ]);
      dataSources.AssertQueryTableResponse(0, "[1,2,3,4]");
      dataSources.AssertQueryTableResponse(1, "[[1,2],[3,4],[5,6]]");
      dataSources.AssertQueryTableResponse(2, "[[5,6],[1,2],[3,4]]");

      //Verifying || with NULL
      query = `SELECT ARRAY[1, 2] || NULL as "|| with NULL", array_append(ARRAY[1, 2], NULL) as "array_append";`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["|| with NULL", "array_append"]);
      dataSources.AssertQueryTableResponse(0, "[1,2]");
      dataSources.AssertQueryTableResponse(1, "[1,2,null]");

      //Verifying array_position, array_positions
      query = `SELECT array_position(ARRAY['sun','mon','tue','wed','thu','fri','sat'], 'sat'), array_positions(ARRAY[1, 4, 3, 1, 3, 4, 2, 1], 1);`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "array_position",
        "array_positions",
      ]);
      dataSources.AssertQueryTableResponse(0, "7");
      dataSources.AssertQueryTableResponse(1, "[1,4,8]");

      //Verifying input & output syntaxes
      query = `SELECT f1[1][-2][3] AS e1, f1[1][-1][5] AS e2 FROM (SELECT '[1:1][-2:-1] [3:5]={ {{1,2,3},{4,5,6} } }'::int[] AS f1) AS ss;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["e1", "e2"]);
      dataSources.AssertQueryTableResponse(0, "1");
      dataSources.AssertQueryTableResponse(1, "6");

      //Verifying array_remove
      query = `SELECT array_remove(ARRAY['sun','mon','tue','wed','thu','fri','sat'], 'wed') as "array_remove"`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(["array_remove"]);
      dataSources.AssertQueryTableResponse(
        0,
        `["sun","mon","tue","thu","fri","sat"]`,
      );

      //Verifying array_replace
      query = `select ARRAY[1,2,3,2,5] as "before_replace", array_replace(ARRAY[1,2,3,2,5], 2, 10) as two_becomes_ten;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "before_replace",
        "two_becomes_ten",
      ]);
      dataSources.AssertQueryTableResponse(0, `[1,2,3,2,5]`);
      dataSources.AssertQueryTableResponse(1, `[1,10,3,10,5]`);

      //Verifying operators
      query = `select ARRAY[1.1,2.1,3.1]::int[] = ARRAY[1,2,3]	as "=", ARRAY[1,2,3] <> ARRAY[1,2,4] as "<>", ARRAY[1,2,3] < ARRAY[1,2,4] as "<", ARRAY[1,4,3] > ARRAY[1,2,4]	 as ">", ARRAY[1,2,3] <= ARRAY[1,2,3]	 as "<=", ARRAY[1,4,3] >= ARRAY[1,4,3]	as ">=", ARRAY[1,4,3] @> ARRAY[3,1,3]	as "@>", ARRAY[2,2,7] <@ ARRAY[1,7,4,2,6]	as "<@", ARRAY[1,4,3] && ARRAY[2,1]	 as "&&"`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "=",
        "<>",
        "<",
        ">",
        "<=",
        ">=",
        "@>",
        "<@",
        "&&",
      ]);
      dataSources.AssertQueryTableResponse(0, "true");
      dataSources.AssertQueryTableResponse(8, "true");

      //Verifying array_to_string
      query = `SELECT array_to_string(ARRAY[1, 2, 3, NULL, 5], ',', '*')	as array_to_string, string_to_array('xx~^~yy~^~zz', '~^~', 'yy') as string_to_array;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders([
        "array_to_string",
        "string_to_array",
      ]);
      dataSources.AssertQueryTableResponse(0, "1,2,3,*,5");
      dataSources.AssertQueryTableResponse(1, `["xx",null,"zz"]`);

      //Verifying error
      query = `SELECT ARRAY[1, 2] || '7';`;
      dataSources.EnterQuery(query);
      agHelper.FocusElement(locators._codeMirrorTextArea);
      dataSources.RunQuery({ expectedStatus: false });
      agHelper
        .GetText(dataSources._queryError)
        .then(($errorText) =>
          expect($errorText).to.contain(
            `ERROR: malformed array literal: "7"\n  Detail: Array value must start with "{" or dimension information`,
          ),
        );

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("7. Deleting records - arraytypes", () => {
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

      //Deleting all records from table - arraytypes
      agHelper.GetNClick(locators._deleteIcon);
      agHelper.AssertElementVisibility(
        locators._buttonByText("Run InsertQuery"),
      );
      agHelper.Sleep(2000);
      table.WaitForTableEmpty();
    });

    it("8. Inserting another record (to check serial column) - arraytypes", () => {
      agHelper.ClickButton("Run InsertQuery");
      agHelper.AssertElementVisibility(locators._modal);

      agHelper.EnterInputText("Name", "Bob Sim");
      agHelper.EnterInputText("Pay_by_quarter", "121,3234,4454,21213");
      agHelper.EnterInputText("Schedule", "Travel,Chillax,Hire,Give rewards");

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

    it("9. Validate Drop of the Newly Created - arraytypes - Table from Postgres datasource", () => {
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("dropTable", EntityType.Query);
      dataSources.RunQuery();
      dataSources.AssertQueryTableResponse(0, "0");
      dataSources.AssertTableInVirtuosoList(dsName, "public.arraytypes", false);
    });

    after(
      "Verify Deletion of all created queries & Deletion of datasource",
      () => {
        //Verify Deletion of all created queries
        dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //Since all queries exists
        entityExplorer.DeleteAllQueriesForDB(dsName);
        //Ds Deletion
        deployMode.DeployApp();
        deployMode.NavigateBacktoEditor();
        dataSources.DeleteDatasourceFromWithinDS(dsName, 200);
        AppSidebar.navigate(AppSidebarButton.Editor);
      },
    );
  },
);
