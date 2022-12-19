import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  apiPage = ObjectsRegistry.ApiPage;

let dsName: any;

const jsCode = `//TextWidget, InputWidget, QueryRefactor and RefactorAPI are used
  let text = TextWidget.text;
  let input = InputWidget.text;
  let query = QueryRefactor.data;
  let api = RefactorAPI.data;
  console.log("InputWidget.text + TextWidget.text + QueryRefactor.data + RefactorAPI.data");
  return 10;`;
const query = "SELECT * FROM users ORDER BY id LIMIT {{JSObject1.myFun1()}};";
const apiURL = "https://mock-api.appsmith.com/users";
const refactorInput = {
  api: { oldName: "RefactorAPI", newName: "RefactorAPIRenamed" },
  query: { oldName: "QueryRefactor", newName: "QueryRefactorRenamed" },
  jsObject: { oldName: "JSObject1", newName: "JSObject1Renamed" },
  inputWidget: {
    oldName: "InputWidget",
    newName: "InputWidgetRenamed",
  },
  textWidget: {
    oldName: "TextWidget",
    newName: "TextWidgetRenamed",
  },
};

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
    //Initialize new JSObject with custom code
    jsEditor.CreateJSObject(jsCode);
    //Initialize new Query entity with custom query
    ee.CreateNewDsQuery(dsName);
    agHelper.RenameWithInPane(refactorInput.query.oldName);
    agHelper.GetNClick(dataSources._templateMenu);
    dataSources.EnterQuery(query);
    //Initialize new API entity with custom header
    apiPage.CreateAndFillApi(apiURL, refactorInput.api.oldName);
    apiPage.EnterHeader("key1", `{{\tJSObject1.myVar1}}`);
  });

  it("3. Refactor Widget, API, Query and JSObject", () => {
    //Rename all widgets and entities
    ee.SelectEntityByName(refactorInput.textWidget.oldName);
    agHelper.RenameWidget(
      refactorInput.textWidget.oldName,
      refactorInput.textWidget.newName,
    );
    ee.SelectEntityByName(refactorInput.inputWidget.oldName);
    agHelper.RenameWidget(
      refactorInput.inputWidget.oldName,
      refactorInput.inputWidget.newName,
    );
    ee.ExpandCollapseEntity("Queries/JS");
    ee.RenameEntityFromExplorer(
      refactorInput.query.oldName,
      refactorInput.query.newName,
    );
    ee.RenameEntityFromExplorer(
      refactorInput.api.oldName,
      refactorInput.api.newName,
    );
    ee.RenameEntityFromExplorer(
      refactorInput.jsObject.oldName,
      refactorInput.jsObject.newName,
    );
  });

  it("4. Verify refactoring updates", () => {
    //Verify JSObject refactoring in API pane
    ee.getEntityItem(refactorInput.api.newName).click();
    agHelper.Sleep(1000);
    cy.get(".cm-variable").should("contain", refactorInput.jsObject.newName);

    //Verify JSObject refactoring in Query pane
    ee.getEntityItem(refactorInput.query.newName).click();
    agHelper.Sleep(1000);
    cy.get(".cm-variable").should("contain", refactorInput.jsObject.newName);

    //Verify TextWidget, InputWidget, QueryRefactor, RefactorAPI refactor
    //Names in string shouldn't be updated
    ee.getEntityItem(refactorInput.jsObject.newName).click();
    cy.get(".cm-string")
      .contains(refactorInput.textWidget.newName)
      .should("not.exist");
    cy.get(".cm-string")
      .contains(refactorInput.inputWidget.newName)
      .should("not.exist");
    cy.get(".cm-string")
      .contains(refactorInput.query.newName)
      .should("not.exist");
    cy.get(".cm-string")
      .contains(refactorInput.api.newName)
      .should("not.exist");

    //Names in comment shouldn't be updated
    cy.get(".cm-comment")
      .contains(refactorInput.textWidget.newName)
      .should("not.exist");
    cy.get(".cm-comment")
      .contains(refactorInput.inputWidget.newName)
      .should("not.exist");
    cy.get(".cm-comment")
      .contains(refactorInput.query.newName)
      .should("not.exist");
    cy.get(".cm-comment")
      .contains(refactorInput.api.newName)
      .should("not.exist");

    //Variables reffered should be updated
    cy.get(".cm-variable").should("contain", refactorInput.textWidget.newName);
    cy.get(".cm-variable").should("contain", refactorInput.inputWidget.newName);
    cy.get(".cm-variable").should("contain", refactorInput.query.newName);
    cy.get(".cm-variable").should("contain", refactorInput.api.newName);
  });

  it("Delete Mysql", () => {
    ee.ActionContextMenuByEntityName(
      "QueryRefactorRenamed",
      "Delete",
      "Are you sure?",
    );
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
  });
});
