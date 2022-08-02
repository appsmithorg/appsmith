import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let  dsName: any, query: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode;

describe("Array Datatype tests", function() {
  before(() => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("0. Importing App & setting theme", () => {
    cy.fixture("Datatypes/ArrayDTdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    ee.NavigateToSwitcher("widgets");
    propPane.ChangeColor(-31, "Primary");
    propPane.ChangeColor(-27, "Background");
  });

  it("1. Creating table query - arraytypes", () => {
    query = `CREATE TABLE arraytypes (serialId SERIAL not null primary key, name text, pay_by_quarter  integer[], schedule text[][]);`;
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("createTable");
    dataSources.EnterQuery(query);
    dataSources.RunQuery();

    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(
      ee._entityNameInExplorer("public.arraytypes"),
    );
  });

  it("2. Creating SELECT query - arraytypes + Bug 14493", () => {
    ee.ActionTemplateMenuByEntityName("public.arraytypes", "SELECT");
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
  });

  it("3. Creating all queries - arraytypes", () => {
    query = `INSERT INTO arraytypes ("name", "pay_by_quarter", "schedule")  VALUES ('{{Insertname.text}}', ARRAY{{Insertpaybyquarter.text.split(',').map(Number)}}, ARRAY[['{{Insertschedule.text.split(',').slice(0,2).toString()}}'],['{{Insertschedule.text.split(',').slice(2,4).toString()}}']]);`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("insertRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.ToggleUsePreparedStatement(false);

    query = `UPDATE public."arraytypes" SET "name" = '{{Updatename.text}}', "pay_by_quarter" = ARRAY{{Updatepaybyquarter.text.split(',').map(Number)}},
    "schedule" = ARRAY[['{{Updateschedule.text.split(',').slice(0,2).toString()}}'],['{{Updateschedule.text.split(',').slice(2,4).toString()}}']] WHERE serialid = {{Table1.selectedRow.serialid}};`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("updateRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.ToggleUsePreparedStatement(false);

    query = `DELETE FROM public."arraytypes" WHERE serialId = {{Table1.selectedRow.serialid}}`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteRecord");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."arraytypes"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("deleteAllRecords");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    query = `drop table public."arraytypes"`;
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("dropTable");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);

    ee.ExpandCollapseEntity("QUERIES/JS", false);
    ee.ExpandCollapseEntity(dsName, false);
  });

  it("4. Inserting record - arraytypes", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.EnterInputText("Name", "Lily Bush");
    agHelper.EnterInputText("Pay_by_quarter", "100,200,300,400");
    agHelper.EnterInputText("Schedule", "Arrival,Breakfast,Meeting,Lunch");

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

  it("5. Inserting another record - arraytypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.EnterInputText("Name", "Josh William");
    agHelper.EnterInputText("Pay_by_quarter", "8700,5454,9898,23257");
    agHelper.EnterInputText("Schedule", "Stand up,Update,Report,Executive");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("6. Inserting another record - arraytypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.EnterInputText("Name", "Mary Clark");
    agHelper.EnterInputText("Pay_by_quarter", "9898,21726,87387,8372837");
    agHelper.EnterInputText(
      "Schedule",
      "Travel,Meet Sales,Take Action,Sky Rocket",
    );

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("7. Updating record - arraytypes", () => {
    table.SelectTableRow(1);
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.EnterInputText("Name", "Josh Clarion", true);
    agHelper.EnterInputText("Pay_by_quarter", "3232,3232,4567,12234", true);
    agHelper.EnterInputText(
      "Schedule",
      "Breakfat,Presentation,Consulting,Training",
      true,
    );

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
    agHelper.RenameWithInPane("verifyArrayFunctions");

    query = `SELECT name FROM arraytypes WHERE pay_by_quarter[1] <> pay_by_quarter[2];`;
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["name"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("Lily Bush");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Mary Clark");
    });

    query = `SELECT pay_by_quarter[3] FROM arraytypes;`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["pay_by_quarter"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("300");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("87387");
    });
    dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("4567");
    });

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
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("1");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Lily Bush");
    });
    dataSources.ReadQueryTableResponse(4).then(($cellData) => {
      expect($cellData).to.eq("2");
    });
    dataSources.ReadQueryTableResponse(5).then(($cellData) => {
      expect($cellData).to.eq("Josh Clarion");
    });

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
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Mary Clark");
    });
    dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("[9898,21726,87387,8372837]");
    });
    dataSources.ReadQueryTableResponse(3).then(($cellData) => {
      expect($cellData).to.eq(
        `[["Travel,Meet Sales"],["Take Action,Sky Rocket"]]`,
      );
    });

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
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Mary Clark");
    });

    //Verifying generate_script
    query = `SELECT * FROM
    (SELECT pay_by_quarter,
            generate_subscripts(pay_by_quarter, 1) AS position
       FROM arraytypes) AS foo
  WHERE pay_by_quarter[position] = 100;`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["pay_by_quarter", "position"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[100,200,300,400]");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("1");
    });

    query = `SELECT * FROM
    (SELECT pay_by_quarter,
            generate_subscripts(pay_by_quarter, 1) AS position
       FROM arraytypes) AS foo
  WHERE pay_by_quarter[position] = 3232;`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["pay_by_quarter", "position"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[3232,3232,4567,12234]");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("1");
    });
    dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("[3232,3232,4567,12234]");
    });
    dataSources.ReadQueryTableResponse(3).then(($cellData) => {
      expect($cellData).to.eq("2");
    });

    //Verifying ALL
    query = `SELECT * FROM arraytypes WHERE 100 = ALL (pay_by_quarter);`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));

    //Verifying unnest
    query = `SELECT name, unnest(schedule) FROM arraytypes;`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["name", "unnest"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("Lily Bush");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Arrival,Breakfast");
    });
    dataSources.ReadQueryTableResponse(4).then(($cellData) => {
      expect($cellData).to.eq("Mary Clark");
    });
    dataSources.ReadQueryTableResponse(5).then(($cellData) => {
      expect($cellData).to.eq("Travel,Meet Sales");
    });
    dataSources.ReadQueryTableResponse(10).then(($cellData) => {
      expect($cellData).to.eq("Josh Clarion");
    });
    dataSources.ReadQueryTableResponse(11).then(($cellData) => {
      expect($cellData).to.eq("Consulting,Training");
    });

    //Verifying index access
    query = `SELECT schedule[1:2][1:1] FROM arraytypes WHERE name = 'Lily Bush';`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["schedule"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`[["Arrival,Breakfast"],["Meeting,Lunch"]]`);
    });

    //Verifying index access
    query = `SELECT schedule[1:2][2] FROM arraytypes WHERE name = 'Josh Clarion';`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["schedule"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(
        `[["Breakfat,Presentation"],["Consulting,Training"]]`,
      );
    });

    query = `SELECT schedule[:1][1:] FROM arraytypes WHERE name = 'Mary Clark';`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["schedule"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`[["Travel,Meet Sales"]]`);
    });

    query = `SELECT schedule[2:2][:] FROM arraytypes WHERE name = 'Mary Clark';`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["schedule"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`[["Take Action,Sky Rocket"]]`);
    });

    //Verifying array_dims
    query = `SELECT array_dims(schedule) FROM arraytypes WHERE name = 'Lily Bush';`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["array_dims"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[1:2][1:1]");
    });

    //Verifying array_length
    query = `SELECT array_length(schedule, 1) FROM arraytypes WHERE name = 'Mary Clark';`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["array_length"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`2`);
    });

    //Verifying array_upper, cardinality
    query = `SELECT array_upper(pay_by_quarter, 1), cardinality(schedule)  FROM arraytypes WHERE name = 'Josh Clarion';`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["array_upper", "cardinality"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("4");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("2");
    });

    //Verifying ||
    query = `SELECT ARRAY[1,2] || ARRAY[3,4] as "Test ||", ARRAY[5,6] || ARRAY[[1,2],[3,4]] as "Test || of 2D Array", ARRAY[1, 2] || '{3, 4}' as "Test || with {}"`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders([
      "Test ||",
      "Test || of 2D Array",
      "Test || with {}",
    ]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[1,2,3,4]");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[[5,6],[1,2],[3,4]]");
    });
    dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("[1,2,3,4]");
    });

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
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[0:2]");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[1:3]");
    });
    dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("[1:5]");
    });
    dataSources.ReadQueryTableResponse(3).then(($cellData) => {
      expect($cellData).to.eq("[1:5][1:2]");
    });

    //Verifying array_prepend, array_append
    query = `SELECT array_prepend(1, ARRAY[2,3]) as "array_prepend", array_append(ARRAY[1,2], 3) as "array_append";`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["array_prepend", "array_append"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[1,2,3]");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[1,2,3]");
    });

    //Verifying array_cat
    query = `SELECT array_cat(ARRAY[1,2], ARRAY[3,4]) as "array_cat1", array_cat(ARRAY[[1,2],[3,4]], ARRAY[5,6]) as "array_cat2", array_cat(ARRAY[5,6], ARRAY[[1,2],[3,4]]) as "array_cat3"`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders([
      "array_cat1",
      "array_cat2",
      "array_cat3",
    ]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[1,2,3,4]");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[[1,2],[3,4],[5,6]]");
    });
    dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("[[5,6],[1,2],[3,4]]");
    });

    //Verifying || with NULL
    query = `SELECT ARRAY[1, 2] || NULL as "|| with NULL", array_append(ARRAY[1, 2], NULL) as "array_append";`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["|| with NULL", "array_append"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("[1,2]");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[1,2,null]");
    });

    //Verifying array_position, array_positions
    query = `SELECT array_position(ARRAY['sun','mon','tue','wed','thu','fri','sat'], 'sat'), array_positions(ARRAY[1, 4, 3, 1, 3, 4, 2, 1], 1);`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders([
      "array_position",
      "array_positions",
    ]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("7");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("[1,4,8]");
    });

    //Verifying input & output syntaxes
    query = `SELECT f1[1][-2][3] AS e1, f1[1][-1][5] AS e2 FROM (SELECT '[1:1][-2:-1] [3:5]={ {{1,2,3},{4,5,6} } }'::int[] AS f1) AS ss;`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["e1", "e2"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("1");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("6");
    });

    //Verifying array_remove
    query = `SELECT array_remove(ARRAY['sun','mon','tue','wed','thu','fri','sat'], 'wed') as "array_remove"`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders(["array_remove"]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`["sun","mon","tue","thu","fri","sat"]`);
    });

    //Verifying array_replace
    query = `select ARRAY[1,2,3,2,5] as "before_replace", array_replace(ARRAY[1,2,3,2,5], 2, 10) as two_becomes_ten;`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders([
      "before_replace",
      "two_becomes_ten",
    ]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(`[1,2,3,2,5]`);
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq(`[1,10,3,10,5]`);
    });

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
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("true");
    });
    dataSources.ReadQueryTableResponse(8).then(($cellData) => {
      expect($cellData).to.eq("true");
    });

    //Verifying array_to_string
    query = `SELECT array_to_string(ARRAY[1, 2, 3, NULL, 5], ',', '*')	as array_to_string, string_to_array('xx~^~yy~^~zz', '~^~', 'yy') as string_to_array;`;
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders([
      "array_to_string",
      "string_to_array",
    ]);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("1,2,3,*,5");
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq(`["xx",null,"zz"]`);
    });

    //Verifying error
    query = `SELECT ARRAY[1, 2] || '7';`;
    dataSources.EnterQuery(query);
    agHelper.FocusElement(locator._codeMirrorTextArea);
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._queryError)
      .then(($errorText) =>
        expect($errorText).to.contain(
          `ERROR: malformed array literal: "7"\n  Detail: Array value must start with "{" or dimension information`,
        ),
      );

    agHelper.ActionContextMenuWithInPane("Delete");
    ee.ExpandCollapseEntity("QUERIES/JS", false);
  });

  it("9. Deleting records - arraytypes", () => {
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

  it("10. Deleting all records from table - arraytypes", () => {
    agHelper.GetNClick(locator._deleteIcon);
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("11. Inserting another record (to check serial column) - arraytypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.EnterInputText("Name", "Bob Sim");
    agHelper.EnterInputText("Pay_by_quarter", "121,3234,4454,21213");
    agHelper.EnterInputText("Schedule", "Travel,Chillax,Hire,Give rewards");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).not.to.eq("");
    });
  });

  it("12. Validate Drop of the Newly Created - arraytypes - Table from Postgres datasource", () => {
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
      ee._entityNameInExplorer("public.arraytypes"),
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
