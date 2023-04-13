import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any, query: string;

describe("Bug #14299 - The data from the query does not show up on the widget", function () {
  before("Create Postgress DS & set theme", () => {
    cy.fixture("/Bugs/14299dsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
    _.appSettings.OpenPaneAndChangeThemeColors(13, 22);
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Creating query & JSObject", () => {
    query = `SELECT id, name, date_of_birth, date_of_death, nationality FROM public."astronauts" LIMIT 20;`;
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.agHelper.RenameWithInPane("getAstronauts");
    _.dataSources.EnterQuery(query);
    _.jsEditor.CreateJSObject(
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

    _.entityExplorer.SelectEntityByName("Table1");
    _.propPane.UpdatePropertyFieldValue(
      "Table Data",
      `{{JSObject1.runAstros.data}}`,
    );

    _.entityExplorer.SelectEntityByName("DatePicker1");
    _.propPane.UpdatePropertyFieldValue(
      "Default Date",
      `{{moment(Table1.selectedRow.date_of_death)}}`,
    );

    _.entityExplorer.SelectEntityByName("Text1");
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      `Date: {{moment(Table1.selectedRow.date_of_death).toString()}}`,
    );
  });

  it("2. Deploy & Verify _.table is populated even when moment returns Null", () => {
    _.deployMode.DeployApp();
    _.table.WaitUntilTableLoad();
    _.table.AssertSelectedRow(0);
    _.agHelper
      .GetText(_.locators._datePickerValue, "val")
      .then(($date) => expect($date).to.eq(""));
    _.agHelper
      .GetText(_.locators._textWidgetInDeployed)
      .then(($date) => expect($date).to.eq("Date: Invalid date"));

    _.table.SelectTableRow(2); //Asserting here _.table is available for selection
    _.table.ReadTableRowColumnData(2, 0, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("213");
    });
    _.agHelper
      .GetText(_.locators._datePickerValue, "val")
      .then(($date) => expect($date).to.not.eq(""));
    _.agHelper
      .GetText(_.locators._textWidgetInDeployed)
      .then(($date) => expect($date).to.not.eq("Date: Invalid date"));

    _.table.SelectTableRow(4); //Asserting here _.table is available for selection
    _.table.ReadTableRowColumnData(4, 0, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("713");
    });
    _.agHelper
      .GetText(_.locators._datePickerValue, "val")
      .then(($date) => expect($date).to.eq(""));
    _.agHelper
      .GetText(_.locators._textWidgetInDeployed)
      .then(($date) => expect($date).to.eq("Date: Invalid date"));

    _.table.NavigateToNextPage(false, "v1");
    _.table.WaitUntilTableLoad();
    _.table.SelectTableRow(1); //Asserting here _.table is available for selection
    _.table.ReadTableRowColumnData(1, 0, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("286");
    });
    _.agHelper
      .GetText(_.locators._datePickerValue, "val")
      .then(($date) => expect($date).to.eq(""));
    _.agHelper
      .GetText(_.locators._textWidgetInDeployed)
      .then(($date) => expect($date).to.eq("Date: Invalid date"));
  });

  after(
    "Verify Deletion of the datasource after all created queries are Deleted",
    () => {
      _.deployMode.NavigateBacktoEditor();
      _.agHelper.AssertContains("ran successfully"); //runAstros triggered on PageLaoad of Edit page!
      _.entityExplorer.ExpandCollapseEntity("Queries/JS");
      _.entityExplorer.ActionContextMenuByEntityName(
        "getAstronauts",
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        "JSObject1",
        "Delete",
        "Are you sure?",
        true,
      );
      _.deployMode.DeployApp(
        _.locators._widgetInDeployed("tablewidget"),
        false,
      );
      _.deployMode.NavigateBacktoEditor();
      _.entityExplorer.ExpandCollapseEntity("Datasources");
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 200); //ProductLines, Employees pages are still using this ds
    },
  );
});
