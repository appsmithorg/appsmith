import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any, query: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode,
  jsEditor = ObjectsRegistry.JSEditor;

describe("[Bug]: The data from the query does not show up on the widget #14299", function() {
  before(() => {
    cy.fixture("/Bugs/14299dsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    propPane.ChangeColor(13, "Primary");
    propPane.ChangeColor(22, "Background");
  });

  it("1. Create Postgress DS", function() {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Creating query & JSObject", () => {
    query = `SELECT id, name, date_of_birth, date_of_death, nationality FROM public."astronauts" LIMIT 20;`;
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("getAstronauts");
    dataSources.EnterQuery(query);
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

    ee.SelectEntityByName("Table1");
    propPane.UpdatePropertyFieldValue("Table Data", `{{JSObject1.runAstros.data}}`);

    ee.SelectEntityByName("DatePicker1");
    propPane.UpdatePropertyFieldValue(
      "Default Date",
      `{{moment(Table1.selectedRow.date_of_death)}}`,
    );

    ee.SelectEntityByName("Text1");
    propPane.UpdatePropertyFieldValue(
      "Text",
      `Date: {{moment(Table1.selectedRow.date_of_death).toString()}}`,
    );
  });

  it("3. Deploy & Verify table is populated even when moment returns Null", () => {
    deployMode.DeployApp();
    table.WaitUntilTableLoad();
    table.AssertSelectedRow(0);
    agHelper
      .GetText(locator._datePickerValue, "val")
      .then(($date) => expect($date).to.eq(""));
    agHelper
      .GetText(locator._textWidgetInDeployed)
      .then(($date) => expect($date).to.eq("Date: Invalid date"));

    table.SelectTableRow(2); //Asserting here table is available for selection
    table.ReadTableRowColumnData(2, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("213");
    });
    agHelper
      .GetText(locator._datePickerValue, "val")
      .then(($date) => expect($date).to.not.eq(""));
    agHelper
      .GetText(locator._textWidgetInDeployed)
      .then(($date) => expect($date).to.not.eq("Date: Invalid date"));

    table.SelectTableRow(4); //Asserting here table is available for selection
    table.ReadTableRowColumnData(4, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("713");
    });
    agHelper
      .GetText(locator._datePickerValue, "val")
      .then(($date) => expect($date).to.eq(""));
    agHelper
      .GetText(locator._textWidgetInDeployed)
      .then(($date) => expect($date).to.eq("Date: Invalid date"));

    table.NavigateToNextPage(false);
    table.WaitUntilTableLoad();
    table.SelectTableRow(1);//Asserting here table is available for selection
    table.ReadTableRowColumnData(1, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("286");
    });
    agHelper
      .GetText(locator._datePickerValue, "val")
      .then(($date) => expect($date).to.eq(""));
    agHelper
      .GetText(locator._textWidgetInDeployed)
      .then(($date) => expect($date).to.eq("Date: Invalid date"));
  });

  it("4. Verify Deletion of the datasource after all created queries are Deleted", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.WaitUntilToastDisappear("ran successfully"); //runAstros triggered on PageLaoad of Edit page!
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("getAstronauts", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName(
      "JSObject1",
      "Delete",
      "Are you sure?", true
    );
    deployMode.DeployApp(locator._widgetInDeployed("tablewidget"), false);
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("DATASOURCES");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200); //ProductLines, Employees pages are still using this ds
  });
});
