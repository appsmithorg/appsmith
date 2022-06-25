import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, dsName: any, query: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode;

describe("Postgres - Datatype DateTime tests", function() {
  before(() => {
    cy.fixture("DateTimeDTdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    propPane.ChangeColor(22, "Primary");
    propPane.ChangeColor(32, "Background");
  });

  it("1. Create Postgress DS", function() {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      guid = uid;
      agHelper.RenameWithInPane("Postgres " + guid, false);
      dataSources.FillPostgresDSForm();
      dataSources.TestSaveDatasource();
      cy.wrap("Postgres " + guid).as("dsName");
    });
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Creating table - datetimetypes", () => {
    query = `CREATE TABLE datetimeTypes (serialId serial primary key, ts TIMESTAMP not null DEFAULT NOW(),
    tstz TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, dater date NOT NULL, timer time NOT NULL,
    timertz time with time zone not null default now(), intervaler interval not null);`;
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("createTable");
    agHelper.EnterValue(query);
    cy.get(".CodeMirror textarea").focus();
    dataSources.RunQuery();
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(
      ee._entityNameInExplorer("public.datetimetypes"),
    );
  });

  it("3. Creating SELECT query - datetimetypes + Bug 14493", () => {
    query = `SELECT *, TO_CHAR(datetimeT.dater , 'dd.mm.yyyy') as "dd.mm.yyyy",
    TO_CHAR (datetimeT.ts, 'MM/DD/YYYY HH12:MI:SS AM') as "MM/DD/YYYY",
    TO_CHAR (datetimeT.ts, 'YYYY')||' / ' || TO_CHAR (datetimeT.dater, 'YYY') as "YYYY/YYY",
    TO_CHAR (datetimeT.ts, 'MONTH') ||' / ' || TO_CHAR(datetimeT.dater, 'Month') as "MONTH/Month",
    TO_CHAR (datetimeT.dater, 'D') ||' / ' || TO_CHAR(datetimeT.dater, 'day') as "Day of the week/Weekday",
    TO_CHAR (datetimeT.dater, 'W') as "Week of Month" FROM public."datetimetypes" as datetimeT;`;
    ee.ActionTemplateMenuByEntityName("public.datetimetypes", "SELECT");
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
    agHelper.EnterValue(query);
  });

  it("4. Creating INSERT query - datetimetypes", () => {
    query = `INSERT INTO public."datetimetypes" (ts, tstz, dater, timer, intervaler)
    VALUES('{{Insertts.text}}', '{{Inserttstz.text}}', '{{Insertdater.text}}', '{{Inserttimer.text}}', '{{Insertintervaler.text}}');`;
    ee.ActionTemplateMenuByEntityName("public.datetimetypes", "INSERT");
    agHelper.RenameWithInPane("insertRecord");
    agHelper.EnterValue(query);
    dataSources.ToggleUsePreparedStatement(false);
  });

  it("5. Creating UPDATE query - datetimetypes", () => {
    query = `UPDATE public."datetimetypes" SET
    "ts" = '{{Updatets.text}}', "tstz" = '{{Updatetstz.text}}', "dater" = '{{Updatedater.text}}', "timer" = '{{Updatetimer.text}}',
    "intervaler" = '{{Updateintervaler.text}}' WHERE serialid = {{Table1.selectedRow.serialid}};`;
    ee.ActionTemplateMenuByEntityName("public.datetimetypes", "UPDATE");
    agHelper.RenameWithInPane("updateRecord");
    agHelper.EnterValue(query);
    dataSources.ToggleUsePreparedStatement(false);
  });

  it("6. Creating DELETE query with condition - datetimetypes", () => {
    query = `DELETE FROM public."datetimetypes"
    WHERE serialId = {{Table1.selectedRow.serialid}};`;
    ee.ActionTemplateMenuByEntityName("public.datetimetypes", "DELETE");
    agHelper.RenameWithInPane("deleteRecord");
    agHelper.EnterValue(query);
  });

  it("7. Creating DELETE query for complete table empty - datetimetypes", () => {
    query = `DELETE FROM public."datetimetypes"`;
    ee.ActionTemplateMenuByEntityName("public.datetimetypes", "DELETE");
    agHelper.RenameWithInPane("deleteAllRecords");
    agHelper.EnterValue(query);
  });

  it("8. Creating DROP table query - datetimetypes", () => {
    query = `drop table public."datetimetypes"`;
    ee.ActionTemplateMenuByEntityName("public.datetimetypes", "DELETE");
    agHelper.RenameWithInPane("dropTable");
    agHelper.EnterValue(query);
  });

  it("9. Validating interval methods", () => {
    query = `SELECT
    justify_interval(interval '1 year - 1 hour'),
   justify_days(INTERVAL '30 days'),
   justify_hours(INTERVAL '24 hours'),
   EXTRACT (MINUTE  FROM  INTERVAL '5 hours 21 minutes');`;
    ee.ActionTemplateMenuByEntityName("public.datetimetypes", "SELECT");
    agHelper.RenameWithInPane("intervalRecords");
    agHelper.EnterValue(query);
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq(
        "0 years 11 mons 29 days 23 hours 0 mins 0.0 secs",
      );
    });
    dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("0 years 1 mons 0 days 0 hours 0 mins 0.0 secs");
    });
    dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("0 years 0 mons 1 days 0 hours 0 mins 0.0 secs");
    });
    dataSources.ReadQueryTableResponse(3).then(($cellData) => {
      expect($cellData).to.eq("21");
    });
    agHelper.ActionContextMenuWithInPane("Delete");
    ee.ExpandCollapseEntity("QUERIES/JS", false);
    ee.ExpandCollapseEntity(dsName, false);
  });

  it("10. Inserting record - datetimetypes", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.EnterInputText("Ts", "2016-06-22 19:10:25-07");
    agHelper.EnterInputText("Tstz", "2016-06-22 19:10:25-07");
    agHelper.EnterInputText("Dater", "January 19, 1989");
    agHelper.EnterInputText("Timer", "04:05 PM");
    agHelper.EnterInputText("Intervaler", "P6Y5M4DT3H2M1S");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($ts) => {
      table.ReadTableRowColumnData(0, 2, 200).then(($tstz) => {
        expect($ts).to.not.eq($tstz); //ts & tstz not equal since tstz is time zone applied
      });
    });
    table.ReadTableRowColumnData(0, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("1989-01-19"); //date format!
    });
    table.ReadTableRowColumnData(0, 4, 200).then(($cellData) => {
      expect($cellData).to.eq("16:05:00"); //time format
    });
    table.ReadTableRowColumnData(0, 6, 200).then(($cellData) => {
      expect($cellData).to.eq("6 years 5 mons 4 days 3 hours 2 mins 1.0 secs"); //Interval format!
    });
    table.ReadTableRowColumnData(0, 7, 200).then(($cellData) => {
      expect($cellData).to.eq("19.01.1989");
    });
    agHelper
      .GetText(table._showPageItemsCount)
      .then(($count) => expect($count).contain("1"));
  });

  it("11. Inserting another format of record - datetimetypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.EnterInputText("Ts", "2020-10-05 14:01:10-08");
    agHelper.EnterInputText("Tstz", "2020-10-05 14:01:10-08");
    agHelper.EnterInputText("Dater", "20451229");
    agHelper.EnterInputText("Timer", "04:05 AM");
    agHelper.EnterInputText("Intervaler", "3 4:05:06");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));

    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, 200).then(($ts) => {
      table.ReadTableRowColumnData(1, 2, 200).then(($tstz) => {
        expect($ts).to.not.eq($tstz); //ts & tstz not equal since tstz is time zone applied
      });
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("2045-12-29");
    });
    table.ReadTableRowColumnData(1, 4, 200).then(($cellData) => {
      expect($cellData).to.eq("04:05:00");
    });
    table.ReadTableRowColumnData(1, 6, 200).then(($cellData) => {
      expect($cellData).to.eq("0 years 0 mons 3 days 4 hours 5 mins 6.0 secs");
    });
    table.ReadTableRowColumnData(1, 7, 200).then(($cellData) => {
      expect($cellData).to.eq("29.12.2045");
    });
    agHelper
      .GetText(table._showPageItemsCount)
      .then(($count) => expect($count).contain("2"));
  });

  it("12. Updating record (emtying some field) - datetimetypes", () => {
    table.SelectTableRow(1);
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.EnterInputText("Ts", "2019-07-01", true);
    agHelper.EnterInputText("Tstz", "2019-07-01 00:00:00+11", true);
    agHelper.EnterInputText("Dater", "17-Mar-2014", true);
    agHelper.EnterInputText("Timer", "04:05:06.789", true);
    agHelper.EnterInputText("Intervaler", "P0001-03-02T06:04:05", true);

    agHelper.ClickButton("Update");
    agHelper.AssertElementVisible(locator._spanButton("Run UpdateQuery"));
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is same
    });
    table.ReadTableRowColumnData(1, 1, 200).then(($ts) => {
      table.ReadTableRowColumnData(1, 2, 200).then(($tstz) => {
        expect($ts).to.not.eq($tstz);
      });
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("2014-03-17");
    });
    table.ReadTableRowColumnData(1, 4, 200).then(($cellData) => {
      expect($cellData).to.eq("04:05:06.789");
    });
    table.ReadTableRowColumnData(1, 6, 200).then(($cellData) => {
      expect($cellData).to.eq("1 years 3 mons 2 days 6 hours 4 mins 5.0 secs");
    });
    table.ReadTableRowColumnData(1, 7, 200).then(($cellData) => {
      expect($cellData).to.eq("17.03.2014");
    });
    agHelper
      .GetText(table._showPageItemsCount)
      .then(($count) => expect($count).contain("2"));
  });

  it("13. Deleting records - datetimetypes", () => {
    agHelper.ClickButton("DeleteQuery", 1);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(2500); //Allwowing time for delete to be success
    agHelper
      .GetText(table._showPageItemsCount)
      .then(($count) => expect($count).contain("1")); //asserting 2nd record is deleted
  });

  it("14. Inserting another record (+ve record - to check serial column) - datetimetypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);

    agHelper.EnterInputText("Ts", "February 8 04:05:06 1999");
    agHelper.EnterInputText("Tstz", "February 10 04:05:06 1999 PST");
    agHelper.EnterInputText("Dater", "J2451187"); // 20451229
    agHelper.EnterInputText("Timer", "181416");
    agHelper.EnterInputText("Intervaler", "1-2");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));

    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, 200).then(($ts) => {
      table.ReadTableRowColumnData(1, 2, 200).then(($tstz) => {
        expect($ts).to.not.eq($tstz); //ts & tstz not equal since tstz is time zone applied
      });
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("1999-01-08");
    });
    table.ReadTableRowColumnData(1, 4, 200).then(($cellData) => {
      expect($cellData).to.eq("18:14:16");
    });
    table.ReadTableRowColumnData(1, 6, 200).then(($cellData) => {
      expect($cellData).to.eq("1 years 2 mons 0 days 0 hours 0 mins 0.0 secs");
    });
    table.ReadTableRowColumnData(1, 7, 200).then(($cellData) => {
      expect($cellData).to.eq("08.01.1999");
    });
    agHelper
      .GetText(table._showPageItemsCount)
      .then(($count) => expect($count).contain("2"));
  });

  it("15. Deleting all records from table - datetimetypes", () => {
    agHelper.GetNClick(locator._deleteIcon);
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("16. Validate Drop of the Newly Created - datetimetypes - Table from Postgres datasource", () => {
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
      ee._entityNameInExplorer("public.datetimetypes"),
    );
    ee.ExpandCollapseEntity(dsName, false);
    ee.ExpandCollapseEntity("DATASOURCES", false);
  });

  it("17. Verify Deletion of the datasource after all created queries are Deleted", () => {
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
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("QUERIES/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200); //ProductLines, Employees pages are still using this ds
  });
});
