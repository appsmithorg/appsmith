import {
  agHelper,
  appSettings,
  dataSources,
  jsEditor,
  propPane,
  deployMode,
  entityExplorer,
  table,
  locators,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

let dsName: any, query: string;

describe("Bug #14299 - The data from the query does not show up on the widget", function () {
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
    dataSources.NavigateFromActiveDS(dsName, true);
    dataSources.EnterQuery(query);
    agHelper.RenameWithInPane("getAstronauts");
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
      },
    );

    entityExplorer.SelectEntityByName("Table1");
    propPane.UpdatePropertyFieldValue(
      "Table data",
      `{{JSObject1.runAstros.data}}`,
    );

    entityExplorer.SelectEntityByName("DatePicker1");
    propPane.UpdatePropertyFieldValue(
      "Default Date",
      `{{moment(Table1.selectedRow.date_of_death)}}`,
    );

    entityExplorer.SelectEntityByName("Text1");
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
      agHelper.AssertContains("ran successfully"); //runAstros triggered on PageLaoad of Edit page!
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "JSObject1",
        action: "Delete",
        entityType: entityItems.JSObject,
      });
      entityExplorer.DeleteAllQueriesForDB(dsName);
      agHelper.WaitUntilAllToastsDisappear();
      deployMode.DeployApp(locators._widgetInDeployed("tablewidget"), false);
      deployMode.NavigateBacktoEditor();
      entityExplorer.ExpandCollapseEntity("Datasources");
      dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
    },
  );
});
