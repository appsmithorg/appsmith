import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources,
  ee = ObjectsRegistry.EntityExplorer,
  appSettings = ObjectsRegistry.AppSettings,
  jsEditor = ObjectsRegistry.JSEditor,
  apiPage = ObjectsRegistry.ApiPage;

let dsName: any;

describe("Validate basic Promises", () => {
  before(() => {
    cy.fixture("Datatypes/RefactorDTdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Create Mysql DS", function() {
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Creating mysqlDTs table", () => {
    jsEditor.CreateJSObject(
        `//TextWidget, InputWidget, QueryRefactor and RefactorAPI are used
        let text = TextWidget.text;
        let input = InputWidget.text;
        let query = QueryRefactor.data;
        let api = RefactorAPI.data;
        console.log("InputWidget.text + TextWidget.text + QueryRefactor.data + RefactorAPI.data");
        return 10;`
    );
    //IF NOT EXISTS can be used - which creates tabel if it does not exist and donot throw any error if table exists.
    //But if we add this option then next case could fail inn that case.
    let query = "SELECT * FROM users ORDER BY id LIMIT {{JSObject1.myFun1()}};";
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane("QueryRefactor");
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    apiPage.CreateAndFillApi("https://postman-echo.com/get", "RefactorAPI");
    apiPage.EnterHeader("key1", `{{\tJSObject1.myVar1}}`);
  });

  it("3. Refactor Widget, API, Query and JSObject", () => {
    cy.renameEntity("TextWidget", "TextWidgetRenamed");
    cy.wait(2000);
    cy.renameEntity("InputWidget", "RenamedInputWidget");
    ee.ExpandCollapseEntity("Queries/JS");
    cy.renameEntity("QueryRefactor", "QueryRefactorRenamed");
    cy.wait(2000);
    cy.renameEntity("RefactorAPI", "RenamedRefactorAPI");
    cy.wait(2000);
    cy.renameEntity("JSObject1", "JSObject1Renamed");
  })

  it("Delete Mysql", () => {
    ee.ActionContextMenuByEntityName(
      "QueryRefactor",
      "Delete",
      "Are you sure?",
    );
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
  });
});
