import {
  agHelper,
  appSettings,
  dataSources,
  debuggerHelper,
  deployMode,
  entityExplorer,
  entityItems,
  jsEditor,
  locators,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

let dsName: any, query: string;

describe(
  "Bug #14299 - The data from the query does not show up on the widget",
  {
    tags: ["@tag.Widget", "@tag.Datasource", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    before("Create Postgress DS & set theme", () => {
      agHelper.AddDsl("Bugs/14299dsl");
      appSettings.OpenPaneAndChangeThemeColors(13, 22);
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
    });

    it("1. Creating query & JSObject", () => {
      query = `SELECT id, name, date_of_birth, date_of_death, nationality FROM public."astronauts" LIMIT 20;`;
      dataSources.CreateQueryAfterDSSaved(query, "getAstronauts");
      jsEditor.CreateJSObject(
        `export default {
      runAstros: () => {
        return getAstronauts.run();
      }
    }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
          prettify: false,
        },
      );

      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Table data",
        `{{JSObject1.runAstros.data}}`,
      );

      EditorNavigation.SelectEntityByName("DatePicker1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Default Date",
        `{{moment(Table1.selectedRow.date_of_death)}}`,
      );

      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Text",
        `Date: {{moment(Table1.selectedRow.date_of_death).toString()}}`,
      );
    });

    it("2. Deploy & Verify table is populated even when moment returns Null", () => {
      deployMode.DeployApp();
      table.WaitUntilTableLoad();
      table.AssertSelectedRow(0);
      agHelper
        .GetText(locators._datePickerValue, "val")
        .then(($date) => expect($date).to.eq(""));
      agHelper
        .GetText(locators._textWidgetInDeployed)
        .then(($date) => expect($date).to.eq("Date: Invalid date"));

      table.SelectTableRow(2); //Asserting here table is available for selection
      table.ReadTableRowColumnData(2, 0, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("213");
      });
      agHelper
        .GetText(locators._datePickerValue, "val")
        .then(($date) => expect($date).to.not.eq(""));
      agHelper
        .GetText(locators._textWidgetInDeployed)
        .then(($date) => expect($date).to.not.eq("Date: Invalid date"));

      table.SelectTableRow(4); //Asserting here table is available for selection
      table.ReadTableRowColumnData(4, 0, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("713");
      });
      agHelper
        .GetText(locators._datePickerValue, "val")
        .then(($date) => expect($date).to.eq(""));
      agHelper
        .GetText(locators._textWidgetInDeployed)
        .then(($date) => expect($date).to.eq("Date: Invalid date"));

      table.NavigateToNextPage(false, "v1");
      table.WaitUntilTableLoad();
      table.SelectTableRow(1); //Asserting here table is available for selection
      table.ReadTableRowColumnData(1, 0, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("286");
      });
      agHelper
        .GetText(locators._datePickerValue, "val")
        .then(($date) => expect($date).to.eq(""));
      agHelper
        .GetText(locators._textWidgetInDeployed)
        .then(($date) => expect($date).to.eq("Date: Invalid date"));
    });

    after(
      "Verify Deletion of the datasource after all created queries are deleted",
      () => {
        deployMode.NavigateBacktoEditor();

        //verify runAstros triggered on PageLaoad of Edit page!
        debuggerHelper.OpenDebugger();
        debuggerHelper.ClickLogsTab();
        debuggerHelper.DebuggerLogsFilter("JSObject1.runAstros");
        debuggerHelper.DoesConsoleLogExist(
          "Function executed",
          true,
          "JSObject1.runAstros",
        );
        debuggerHelper.CloseBottomBar();

        PageLeftPane.switchSegment(PagePaneSegment.JS);
        entityExplorer.ActionContextMenuByEntityName({
          entityNameinLeftSidebar: "JSObject1",
          action: "Delete",
          entityType: entityItems.JSObject,
        });
        entityExplorer.DeleteAllQueriesForDB(dsName);
        agHelper.WaitUntilAllToastsDisappear();
        deployMode.DeployApp(locators._widgetInDeployed("tablewidget"), false);
        deployMode.NavigateBacktoEditor();
        dataSources.DeleteDatasourceFromWithinDS(dsName, 200);
      },
    );
  },
);
