import {
  agHelper,
  entityExplorer,
  deployMode,
  appSettings,
  dataSources,
  table,
  locators,
  assertHelper,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

describe("DateTime Datatype tests", function () {
  let dsName: any, query: string;

  before("Create Postgress DS", () => {
    agHelper.AddDsl("Datatypes/DateTimeDTdsl");
    appSettings.OpenPaneAndChangeThemeColors(22, 32);
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Creating table - datetimetypes", () => {
    query = `CREATE TABLE datetimeTypes (serialId serial primary key, ts TIMESTAMP not null DEFAULT NOW(),
    tstz TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, dater date NOT NULL, timer time NOT NULL,
    timertz time with time zone not null default now(), intervaler interval not null);`;
    dataSources.NavigateFromActiveDS(dsName, true);
    dataSources.EnterQuery(query);
    agHelper.RenameWithInPane("createTable");
    agHelper.FocusElement(locators._codeMirrorTextArea);
    dataSources.RunQuery();
    entityExplorer.ExpandCollapseEntity("Datasources");
    entityExplorer.ExpandCollapseEntity(dsName);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: dsName,
      action: "Refresh",
    });
    agHelper.AssertElementVisible(
      entityExplorer._entityNameInExplorer("public.datetimetypes"),
    );
  });

  it("2. Creating SELECT query - datetimetypes + Bug 14493", () => {
    query = `SELECT *, TO_CHAR(datetimeT.dater , 'dd.mm.yyyy') as "dd.mm.yyyy",
    TO_CHAR (datetimeT.ts, 'MM/DD/YYYY HH12:MI:SS AM') as "MM/DD/YYYY",
    TO_CHAR (datetimeT.ts, 'YYYY')||' / ' || TO_CHAR (datetimeT.dater, 'YYY') as "YYYY/YYY",
    TO_CHAR (datetimeT.ts, 'MONTH') ||' / ' || TO_CHAR(datetimeT.dater, 'Month') as "MONTH/Month",
    TO_CHAR (datetimeT.dater, 'D') ||' / ' || TO_CHAR(datetimeT.dater, 'day') as "Day of the wentityExplorer.k/WentityExplorer.kday",
    TO_CHAR (datetimeT.dater, 'W') as "WentityExplorer.k of Month" FROM public."datetimetypes" as datetimeT;`;
    entityExplorer.ActionTemplateMenuByEntityName(
      "public.datetimetypes",
      "SELECT",
    );
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
    dataSources.EnterQuery(query);
    agHelper.RenameWithInPane("selectRecords");
  });

  it("3. Creating all queries - datetimetypes", () => {
    query = `INSERT INTO public."datetimetypes" (ts, tstz, dater, timer, intervaler)
    VALUES('{{Insertts.text}}', '{{Inserttstz.text}}', '{{Insertdater.text}}', '{{Inserttimer.text}}', '{{Insertintervaler.text}}');`;
    entityExplorer.ActionTemplateMenuByEntityName(
      "public.datetimetypes",
      "INSERT",
    );
    dataSources.EnterQuery(query);
    agHelper.RenameWithInPane("insertRecord");
    dataSources.ToggleUsePreparedStatement(false);

    query = `UPDATE public."datetimetypes" SET
    "ts" = '{{Updatets.text}}', "tstz" = '{{Updatetstz.text}}', "dater" = '{{Updatedater.text}}', "timer" = '{{Updatetimer.text}}',
    "intervaler" = '{{Updateintervaler.text}}' WHERE serialid = {{Table1.selectedRow.serialid}};`;
    entityExplorer.ActionTemplateMenuByEntityName(
      "public.datetimetypes",
      "UPDATE",
    );
    dataSources.EnterQuery(query);
    agHelper.RenameWithInPane("updateRecord");
    dataSources.ToggleUsePreparedStatement(false);

    query = `DELETE FROM public."datetimetypes"`;
    entityExplorer.ActionTemplateMenuByEntityName(
      "public.datetimetypes",
      "DELETE",
    );
    dataSources.EnterQuery(query);
    agHelper.RenameWithInPane("deleteAllRecords");

    query = `drop table public."datetimetypes"`;
    entityExplorer.ActionTemplateMenuByEntityName(
      "public.datetimetypes",
      "DELETE",
    );
    dataSources.EnterQuery(query);
    agHelper.RenameWithInPane("dropTable");

    query = `DELETE FROM public."datetimetypes"
    WHERE serialId = {{Table1.selectedRow.serialid}};`;
    entityExplorer.ActionTemplateMenuByEntityName(
      "public.datetimetypes",
      "DELETE",
    );
    dataSources.EnterQuery(query);
    agHelper.RenameWithInPane("deleteRecord");
  });

  it("4. Validating interval methods", () => {
    query = `SELECT
    justify_interval(interval '1 year - 1 hour'),
   justify_days(INTERVAL '30 days'),
   justify_hours(INTERVAL '24 hours'),
   EXTRACT (MINUTE  FROM  INTERVAL '5 hours 21 minutes');`;
    entityExplorer.ActionTemplateMenuByEntityName(
      "public.datetimetypes",
      "SELECT",
    );
    dataSources.EnterQuery(query);
    agHelper.RenameWithInPane("intervalRecords");
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
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Query,
    });
    entityExplorer.ExpandCollapseEntity("Queries/JS", false);
    entityExplorer.ExpandCollapseEntity(dsName, false);
  });

  it("5. Inserting record - datetimetypes", () => {
    entityExplorer.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locators._modal);

    agHelper.EnterInputText("Ts", "2016-06-22 19:10:25-07");
    agHelper.EnterInputText("Tstz", "2016-06-22 19:10:25-07");
    agHelper.EnterInputText("Dater", "January 19, 1989");
    agHelper.EnterInputText("Timer", "04:05 PM");
    agHelper.EnterInputText("Intervaler", "P6Y5M4DT3H2M1S");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locators._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, "v1", 200).then(($ts) => {
      table.ReadTableRowColumnData(0, 2, "v1", 200).then(($tstz) => {
        expect($ts).to.not.eq($tstz); //ts & tstz not equal since tstz is time zone applied
      });
    });
    table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("1989-01-19"); //date format!
    });
    table.ReadTableRowColumnData(0, 4, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("16:05:00"); //time format
    });
    table.ReadTableRowColumnData(0, 6, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("6 years 5 mons 4 days 3 hours 2 mins 1.0 secs"); //Interval format!
    });
    table.ReadTableRowColumnData(0, 7).then(($cellData) => {
      expect($cellData).to.eq("19.01.1989");
    });
    agHelper
      .GetText(table._showPageItemsCount)
      .then(($count) => expect($count).contain("1"));
  });

  it("6. Inserting another format of record - datetimetypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locators._modal);

    agHelper.EnterInputText("Ts", "2020-10-05 14:01:10-08");
    agHelper.EnterInputText("Tstz", "2020-10-05 14:01:10-08");
    agHelper.EnterInputText("Dater", "20451229");
    agHelper.EnterInputText("Timer", "04:05 AM");
    agHelper.EnterInputText("Intervaler", "3 4:05:06");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locators._spanButton("Run InsertQuery"));

    table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, "v1", 200).then(($ts) => {
      table.ReadTableRowColumnData(1, 2, "v1", 200).then(($tstz) => {
        expect($ts).to.not.eq($tstz); //ts & tstz not equal since tstz is time zone applied
      });
    });
    table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("2045-12-29");
    });
    table.ReadTableRowColumnData(1, 4, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("04:05:00");
    });
    table.ReadTableRowColumnData(1, 6, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("0 years 0 mons 3 days 4 hours 5 mins 6.0 secs");
    });
    table.ReadTableRowColumnData(1, 7, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("29.12.2045");
    });
    agHelper
      .GetText(table._showPageItemsCount)
      .then(($count) => expect($count).contain("2"));
  });

  it("7. Updating record (emtying some field) - datetimetypes", () => {
    table.SelectTableRow(1);
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locators._modal);

    agHelper.EnterInputText("Ts", "2019-07-01", true);
    agHelper.EnterInputText("Tstz", "2019-07-01 00:00:00+11", true);
    agHelper.EnterInputText("Dater", "17-Mar-2014", true);
    agHelper.EnterInputText("Timer", "04:05:06.789", true);
    agHelper.EnterInputText("Intervaler", "P0001-03-02T06:04:05", true);

    agHelper.ClickButton("Update");
    agHelper.AssertElementVisible(locators._spanButton("Run UpdateQuery"));
    table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is same
    });
    table.ReadTableRowColumnData(1, 1, "v1", 200).then(($ts) => {
      table.ReadTableRowColumnData(1, 2, "v1", 200).then(($tstz) => {
        expect($ts).to.not.eq($tstz);
      });
    });
    table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("2014-03-17");
    });
    table.ReadTableRowColumnData(1, 4, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("04:05:06.789");
    });
    table.ReadTableRowColumnData(1, 6, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("1 years 3 mons 2 days 6 hours 4 mins 5.0 secs");
    });
    table.ReadTableRowColumnData(1, 7, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("17.03.2014");
    });
    agHelper
      .GetText(table._showPageItemsCount)
      .then(($count) => expect($count).contain("2"));
  });

  it("8. Deleting records - datetimetypes", () => {
    agHelper.ClickButton("DeleteQuery", 1);
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    agHelper.Sleep(2500); //Allwowing time for delete to be success
    agHelper
      .GetText(table._showPageItemsCount)
      .then(($count) => expect($count).contain("1")); //asserting 2nd record is deleted
  });

  it("9. Inserting another record (+ve record - to check serial column) - datetimetypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locators._modal);

    agHelper.EnterInputText("Ts", "February 8 04:05:06 1999");
    agHelper.EnterInputText("Tstz", "February 10 04:05:06 1999 PST");
    agHelper.EnterInputText("Dater", "J2451187"); // 20451229
    agHelper.EnterInputText("Timer", "181416");
    agHelper.EnterInputText("Intervaler", "1-2");

    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locators._spanButton("Run InsertQuery"));

    table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, "v1", 200).then(($ts) => {
      table.ReadTableRowColumnData(1, 2, "v1", 200).then(($tstz) => {
        expect($ts).to.not.eq($tstz); //ts & tstz not equal since tstz is time zone applied
      });
    });
    table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("1999-01-08");
    });
    table.ReadTableRowColumnData(1, 4, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("18:14:16");
    });
    table.ReadTableRowColumnData(1, 6, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("1 years 2 mons 0 days 0 hours 0 mins 0.0 secs");
    });
    table.ReadTableRowColumnData(1, 7, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("08.01.1999");
    });
    agHelper
      .GetText(table._showPageItemsCount)
      .then(($count) => expect($count).contain("2"));
  });

  it("10. Deleting all records from table - datetimetypes", () => {
    agHelper.GetNClick(locators._deleteIcon);
    agHelper.AssertElementVisible(locators._spanButton("Run InsertQuery"));
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("11. Validate Drop of the Newly Created - datetimetypes - Table from Postgres datasource", () => {
    deployMode.NavigateBacktoEditor();
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.SelectEntityByName("dropTable");
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0"); //Success response for dropped table!
    });
    entityExplorer.ExpandCollapseEntity("Queries/JS", false);
    entityExplorer.ExpandCollapseEntity("Datasources");
    entityExplorer.ExpandCollapseEntity(dsName);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: dsName,
      action: "Refresh",
    });
    agHelper.AssertElementAbsence(
      entityExplorer._entityNameInExplorer("public.datetimetypes"),
    );
    entityExplorer.ExpandCollapseEntity(dsName, false);
    entityExplorer.ExpandCollapseEntity("Datasources", false);
  });

  it("12. Verify Deletion of the datasource after all created queries are deleted", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.DeleteAllQueriesForDB(dsName);
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200); //ProductLines, EmployentityExplorer.s pages are still using this ds
  });
});
