import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any, query: string;

describe("Array Datatype tests", function () {
  before("Create DS, Add DS & setting theme", () => {
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
    cy.fixture("Datatypes/ArrayDTdsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
    _.entityExplorer.NavigateToSwitcher("widgets");
    _.appSettings.OpenPaneAndChangeThemeColors(-31, -27);
  });

  it("1. Creating table query - arraytypes + Bug 14493", () => {
    query = `CREATE TABLE arraytypes (serialId SERIAL not null primary key, name text, pay_by_quarter  integer[], schedule text[][]);`;
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.agHelper.RenameWithInPane("createTable");
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();

    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementVisible(
      _.entityExplorer._entityNameInExplorer("public.arraytypes"),
    );

    //Creating SELECT query - arraytypes + Bug 14493
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.arraytypes",
      "SELECT",
    );
    _.agHelper.RenameWithInPane("selectRecords");
    _.dataSources.RunQuery();
    _.agHelper
      .GetText(_.dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));

    //Creating other queries
    query = `INSERT INTO arraytypes ("name", "pay_by_quarter", "schedule")  VALUES ('{{Insertname.text}}', ARRAY{{Insertpaybyquarter.text.split(',').map(Number)}}, ARRAY[['{{Insertschedule.text.split(',').slice(0,2).toString()}}'],['{{Insertschedule.text.split(',').slice(2,4).toString()}}']]);`;

    _.dataSources.CreateQueryFromOverlay(dsName, query, "insertRecord"); //Creating query from EE overlay
    _.dataSources.ToggleUsePreparedStatement(false);

    query = `UPDATE public."arraytypes" SET "name" = '{{Updatename.text}}', "pay_by_quarter" = ARRAY{{Updatepaybyquarter.text.split(',').map(Number)}},
      "schedule" = ARRAY[['{{Updateschedule.text.split(',').slice(0,2).toString()}}'],['{{Updateschedule.text.split(',').slice(2,4).toString()}}']] WHERE serialid = {{Table1.selectedRow.serialid}};`;

    _.dataSources.CreateQueryFromOverlay(dsName, query, "updateRecord"); //Creating query from EE overlay
    _.dataSources.ToggleUsePreparedStatement(false);

    query = `DELETE FROM public."arraytypes" WHERE serialId = {{Table1.selectedRow.serialid}}`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "deleteRecord"); //Creating query from EE overlay

    query = `DELETE FROM public."arraytypes"`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "deleteAllRecords"); //Creating query from EE overlay

    query = `DROP table public."arraytypes"`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "dropTable"); //Creating query from EE overlay

    _.entityExplorer.ExpandCollapseEntity("Queries/JS", false);
    _.entityExplorer.ExpandCollapseEntity(dsName, false);
  });

  it("2. Inserting record - arraytypes", () => {
    _.entityExplorer.SelectEntityByName("Page1");
    _.deployMode.DeployApp();
    _.table.WaitForTableEmpty(); //asserting _.table is empty before inserting!
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);

    _.agHelper.EnterInputText("Name", "Lily Bush");
    _.agHelper.EnterInputText("Pay_by_quarter", "100,200,300,400");
    _.agHelper.EnterInputText("Schedule", "Arrival,Breakfast,Meeting,Lunch");

    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementAbsence(_.locators._toastMsg); //Assert that Insert did not fail
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("3. Inserting another record - arraytypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);

    _.agHelper.EnterInputText("Name", "Josh William");
    _.agHelper.EnterInputText("Pay_by_quarter", "8700,5454,9898,23257");
    _.agHelper.EnterInputText("Schedule", "Stand up,Update,Report,Executive");

    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("4. Inserting another record - arraytypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);

    _.agHelper.EnterInputText("Name", "Mary Clark");
    _.agHelper.EnterInputText("Pay_by_quarter", "9898,21726,87387,8372837");
    _.agHelper.EnterInputText(
      "Schedule",
      "Travel,Meet Sales,Take Action,Sky Rocket",
    );

    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("5. Updating record - arraytypes", () => {
    _.table.SelectTableRow(1);
    _.agHelper.ClickButton("Run UpdateQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);

    _.agHelper.EnterInputText("Name", "Josh Clarion", true);
    _.agHelper.EnterInputText("Pay_by_quarter", "3232,3232,4567,12234", true);
    _.agHelper.EnterInputText(
      "Schedule",
      "Breakfat,Presentation,Consulting,Training",
      true,
    );

    _.agHelper.ClickButton("Update");
    _.agHelper.AssertElementAbsence(_.locators._toastMsg); //Assert that Update did not fail
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run UpdateQuery"));
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
    _.table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //Since recently updated column to pushed to last!
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("6. Validating JSON functions", () => {
    _.deployMode.NavigateBacktoEditor();
    _.table.WaitUntilTableLoad();
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.agHelper.RenameWithInPane("verifyArrayFunctions");

    query = `SELECT name FROM arraytypes WHERE pay_by_quarter[1] <> pay_by_quarter[2];`;
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["name"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("Lily Bush");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Mary Clark");
    });

    query = `SELECT pay_by_quarter[3] FROM arraytypes;`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["pay_by_quarter"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("300");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("87387");
    });
    _.dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("4567");
    });

    //Verifying OR
    query = `SELECT * FROM arraytypes WHERE pay_by_quarter[1] = 300 OR pay_by_quarter[2] = 200 OR pay_by_quarter[3] = 4567 OR pay_by_quarter[4] = 10000;`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "serialid",
      "name",
      "pay_by_quarter",
      "schedule",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("1");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Lily Bush");
    });
    _.dataSources.ReadQueryTableResponse(4).then(($cellData) => {
      expect($cellData).to.eq("2");
    });
    _.dataSources.ReadQueryTableResponse(5).then(($cellData) => {
      expect($cellData).to.eq("Josh Clarion");
    });

    //Verifying &&
    query = `SELECT * FROM arraytypes WHERE pay_by_quarter && ARRAY[87387];`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "serialid",
      "name",
      "pay_by_quarter",
      "schedule",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Mary Clark");
    });
    _.dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("[9898,21726,87387,8372837]");
    });
    _.dataSources.ReadQueryTableResponse(3).then(($cellData) => {
      expect($cellData).to.eq(
        `[["Travel,Meet Sales"],["Take Action,Sky Rocket"]]`,
      );
    });

    //Verifying ANY
    query = `SELECT * FROM arraytypes WHERE 9898 = ANY (pay_by_quarter);`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "serialid",
      "name",
      "pay_by_quarter",
      "schedule",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Mary Clark");
    });

    //Verifying generate_script
    query = `SELECT * FROM
    (SELECT pay_by_quarter,
            generate_subscripts(pay_by_quarter, 1) AS position
       FROM arraytypes) AS foo
  WHERE pay_by_quarter[position] = 100;`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["pay_by_quarter", "position"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[100,200,300,400]");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("1");
    });

    query = `SELECT * FROM
    (SELECT pay_by_quarter,
            generate_subscripts(pay_by_quarter, 1) AS position
       FROM arraytypes) AS foo
  WHERE pay_by_quarter[position] = 3232;`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["pay_by_quarter", "position"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[3232,3232,4567,12234]");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("1");
    });
    _.dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("[3232,3232,4567,12234]");
    });
    _.dataSources.ReadQueryTableResponse(3).then(($cellData) => {
      expect($cellData).to.eq("2");
    });

    //Verifying ALL
    query = `SELECT * FROM arraytypes WHERE 100 = ALL (pay_by_quarter);`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.agHelper
      .GetText(_.dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));

    //Verifying unnest
    query = `SELECT name, unnest(schedule) FROM arraytypes;`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["name", "unnest"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("Lily Bush");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Arrival,Breakfast");
    });
    _.dataSources.ReadQueryTableResponse(4).then(($cellData) => {
      expect($cellData).to.eq("Mary Clark");
    });
    _.dataSources.ReadQueryTableResponse(5).then(($cellData) => {
      expect($cellData).to.eq("Travel,Meet Sales");
    });
    _.dataSources.ReadQueryTableResponse(10).then(($cellData) => {
      expect($cellData).to.eq("Josh Clarion");
    });
    _.dataSources.ReadQueryTableResponse(11).then(($cellData) => {
      expect($cellData).to.eq("Consulting,Training");
    });

    //Verifying index access
    query = `SELECT schedule[1:2][1:1] FROM arraytypes WHERE name = 'Lily Bush';`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["schedule"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`[["Arrival,Breakfast"],["Meeting,Lunch"]]`);
    });

    //Verifying index access
    query = `SELECT schedule[1:2][2] FROM arraytypes WHERE name = 'Josh Clarion';`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["schedule"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(
        `[["Breakfat,Presentation"],["Consulting,Training"]]`,
      );
    });

    query = `SELECT schedule[:1][1:] FROM arraytypes WHERE name = 'Mary Clark';`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["schedule"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`[["Travel,Meet Sales"]]`);
    });

    query = `SELECT schedule[2:2][:] FROM arraytypes WHERE name = 'Mary Clark';`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["schedule"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`[["Take Action,Sky Rocket"]]`);
    });

    //Verifying array_dims
    query = `SELECT array_dims(schedule) FROM arraytypes WHERE name = 'Lily Bush';`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["array_dims"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[1:2][1:1]");
    });

    //Verifying array_length
    query = `SELECT array_length(schedule, 1) FROM arraytypes WHERE name = 'Mary Clark';`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["array_length"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`2`);
    });

    //Verifying array_upper, cardinality
    query = `SELECT array_upper(pay_by_quarter, 1), cardinality(schedule)  FROM arraytypes WHERE name = 'Josh Clarion';`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["array_upper", "cardinality"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("4");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("2");
    });

    //Verifying ||
    query = `SELECT ARRAY[1,2] || ARRAY[3,4] as "Test ||", ARRAY[5,6] || ARRAY[[1,2],[3,4]] as "Test || of 2D Array", ARRAY[1, 2] || '{3, 4}' as "Test || with {}"`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "Test ||",
      "Test || of 2D Array",
      "Test || with {}",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[1,2,3,4]");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[[5,6],[1,2],[3,4]]");
    });
    _.dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("[1,2,3,4]");
    });

    //Verifying array_dims
    query = `SELECT array_dims(1 || '[0:1]={2,3}'::int[]) as "array_dims1", array_dims(ARRAY[1,2] || 3) as "array_dims2", array_dims(ARRAY[1,2] || ARRAY[3,4,5]) as "array_dims3", array_dims(ARRAY[[1,2],[3,4]] || ARRAY[[5,6],[7,8],[9,0]])  as "array_dims4";`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "array_dims1",
      "array_dims2",
      "array_dims3",
      "array_dims4",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[0:2]");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[1:3]");
    });
    _.dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("[1:5]");
    });
    _.dataSources.ReadQueryTableResponse(3).then(($cellData) => {
      expect($cellData).to.eq("[1:5][1:2]");
    });

    //Verifying array_prepend, array_append
    query = `SELECT array_prepend(1, ARRAY[2,3]) as "array_prepend", array_append(ARRAY[1,2], 3) as "array_append";`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["array_prepend", "array_append"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[1,2,3]");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[1,2,3]");
    });

    //Verifying array_cat
    query = `SELECT array_cat(ARRAY[1,2], ARRAY[3,4]) as "array_cat1", array_cat(ARRAY[[1,2],[3,4]], ARRAY[5,6]) as "array_cat2", array_cat(ARRAY[5,6], ARRAY[[1,2],[3,4]]) as "array_cat3"`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "array_cat1",
      "array_cat2",
      "array_cat3",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[1,2,3,4]");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[[1,2],[3,4],[5,6]]");
    });
    _.dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("[[5,6],[1,2],[3,4]]");
    });

    //Verifying || with NULL
    query = `SELECT ARRAY[1, 2] || NULL as "|| with NULL", array_append(ARRAY[1, 2], NULL) as "array_append";`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["|| with NULL", "array_append"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[1,2]");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[1,2,null]");
    });

    //Verifying array_position, array_positions
    query = `SELECT array_position(ARRAY['sun','mon','tue','wed','thu','fri','sat'], 'sat'), array_positions(ARRAY[1, 4, 3, 1, 3, 4, 2, 1], 1);`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "array_position",
      "array_positions",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("7");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[1,4,8]");
    });

    //Verifying input & output syntaxes
    query = `SELECT f1[1][-2][3] AS e1, f1[1][-1][5] AS e2 FROM (SELECT '[1:1][-2:-1] [3:5]={ {{1,2,3},{4,5,6} } }'::int[] AS f1) AS ss;`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["e1", "e2"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("1");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("6");
    });

    //Verifying array_remove
    query = `SELECT array_remove(ARRAY['sun','mon','tue','wed','thu','fri','sat'], 'wed') as "array_remove"`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["array_remove"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`["sun","mon","tue","thu","fri","sat"]`);
    });

    //Verifying array_replace
    query = `select ARRAY[1,2,3,2,5] as "before_replace", array_replace(ARRAY[1,2,3,2,5], 2, 10) as two_becomes_ten;`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "before_replace",
      "two_becomes_ten",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`[1,2,3,2,5]`);
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq(`[1,10,3,10,5]`);
    });

    //Verifying operators
    query = `select ARRAY[1.1,2.1,3.1]::int[] = ARRAY[1,2,3]	as "=", ARRAY[1,2,3] <> ARRAY[1,2,4] as "<>", ARRAY[1,2,3] < ARRAY[1,2,4] as "<", ARRAY[1,4,3] > ARRAY[1,2,4]	 as ">", ARRAY[1,2,3] <= ARRAY[1,2,3]	 as "<=", ARRAY[1,4,3] >= ARRAY[1,4,3]	as ">=", ARRAY[1,4,3] @> ARRAY[3,1,3]	as "@>", ARRAY[2,2,7] <@ ARRAY[1,7,4,2,6]	as "<@", ARRAY[1,4,3] && ARRAY[2,1]	 as "&&"`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
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
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("true");
    });
    _.dataSources.ReadQueryTableResponse(8).then(($cellData) => {
      expect($cellData).to.eq("true");
    });

    //Verifying array_to_string
    query = `SELECT array_to_string(ARRAY[1, 2, 3, NULL, 5], ',', '*')	as array_to_string, string_to_array('xx~^~yy~^~zz', '~^~', 'yy') as string_to_array;`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "array_to_string",
      "string_to_array",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("1,2,3,*,5");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq(`["xx",null,"zz"]`);
    });

    //Verifying error
    query = `SELECT ARRAY[1, 2] || '7';`;
    _.dataSources.EnterQuery(query);
    _.agHelper.FocusElement(_.locators._codeMirrorTextArea);
    _.dataSources.RunQuery();
    _.agHelper
      .GetText(_.dataSources._queryError)
      .then(($errorText) =>
        expect($errorText).to.contain(
          `ERROR: malformed array literal: "7"\n  Detail: Array value must start with "{" or dimension information`,
        ),
      );

    _.agHelper.ActionContextMenuWithInPane("Delete");
    _.entityExplorer.ExpandCollapseEntity("Queries/JS", false);
  });

  it("7. Deleting records - arraytypes", () => {
    _.entityExplorer.SelectEntityByName("Page1");
    _.deployMode.DeployApp();
    _.table.WaitUntilTableLoad();
    _.table.SelectTableRow(1);
    _.agHelper.ClickButton("DeleteQuery", 1);
    _.agHelper.ValidateNetworkStatus("@postExecute", 200);
    _.agHelper.ValidateNetworkStatus("@postExecute", 200);
    _.agHelper.Sleep(2500); //Allwowing time for delete to be success
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).not.to.eq("3"); //asserting 2nd record is deleted
    });
    _.table.ReadTableRowColumnData(1, 0, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("2");
    });

    //Deleting all records from _.table - arraytypes
    _.agHelper.GetNClick(_.locators._deleteIcon);
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.agHelper.Sleep(2000);
    _.table.WaitForTableEmpty();
  });

  it("8. Inserting another record (to check serial column) - arraytypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);

    _.agHelper.EnterInputText("Name", "Bob Sim");
    _.agHelper.EnterInputText("Pay_by_quarter", "121,3234,4454,21213");
    _.agHelper.EnterInputText("Schedule", "Travel,Chillax,Hire,Give rewards");

    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("9. Validate Drop of the Newly Created - arraytypes - Table from Postgres datasource", () => {
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
      _.entityExplorer._entityNameInExplorer("public.arraytypes"),
    );
    _.entityExplorer.ExpandCollapseEntity(dsName, false);
    _.entityExplorer.ExpandCollapseEntity("Datasources", false);
  });

  after(
    "Verify Deletion of all created queries & Deletion of datasource",
    () => {
      //Verify Deletion of all created queries
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

      //Ds Deletion
      _.deployMode.DeployApp();
      _.deployMode.NavigateBacktoEditor();
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
    },
  );
});
