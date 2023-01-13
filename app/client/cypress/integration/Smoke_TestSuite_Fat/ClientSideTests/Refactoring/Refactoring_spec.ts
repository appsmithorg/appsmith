import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any;

const jsCode = `//TextWidget, InputWidget, QueryRefactor and RefactorAPI are used
  let text = TextWidget.text;
  let input = InputWidget.text;
  let query = QueryRefactor.data;
  let api = RefactorAPI.data;
  console.log("InputWidget.text + TextWidget.text + QueryRefactor.data + RefactorAPI.data");
  return 10;`;
const query =
  "SELECT * FROM paintings ORDER BY id LIMIT {{JSObject1.myFun1()}};";
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

describe("Validate JS Object Refactoring does not affect the comments & variables", () => {
  before(() => {
    cy.fixture("Datatypes/RefactorDTdsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Create Mysql DS", function() {
    _.dataSources.CreateDataSource("MySql", true, false);
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Selecting paintings table from MySQL DS", () => {
    //Initialize new JSObject with custom code
    _.jsEditor.CreateJSObject(jsCode);
    //Initialize new Query entity with custom query
    _.ee.CreateNewDsQuery(dsName);
    _.agHelper.RenameWithInPane(refactorInput.query.oldName);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.dataSources.EnterQuery(query);
    //Initialize new API entity with custom header
    _.apiPage.CreateAndFillApi(apiURL, refactorInput.api.oldName);
    _.apiPage.EnterHeader("key1", `{{\tJSObject1.myVar1}}`);
  });

  it("2. Refactor Widget, API, Query and JSObject", () => {
    //Rename all widgets and entities
    _.ee.SelectEntityByName(refactorInput.textWidget.oldName);
    _.agHelper.RenameWidget(
      refactorInput.textWidget.oldName,
      refactorInput.textWidget.newName,
    );
    _.ee.SelectEntityByName(refactorInput.inputWidget.oldName);
    _.agHelper.RenameWidget(
      refactorInput.inputWidget.oldName,
      refactorInput.inputWidget.newName,
    );
    _.ee.ExpandCollapseEntity("Queries/JS");
    _.ee.RenameEntityFromExplorer(
      refactorInput.query.oldName,
      refactorInput.query.newName,
    );
    _.ee.RenameEntityFromExplorer(
      refactorInput.api.oldName,
      refactorInput.api.newName,
    );
    _.ee.RenameEntityFromExplorer(
      refactorInput.jsObject.oldName,
      refactorInput.jsObject.newName,
    );
  });

  //Commenting due to failure in RTS start in fat container runs
  // it("3. Verify refactoring updates in JS object", () => {
  //   //Verify JSObject refactoring in API pane
  //   _.ee.SelectEntityByName(refactorInput.api.newName);
  //   _.agHelper.Sleep(1000);
  //   _.agHelper.GetNAssertContains(
  //     _.locators._editorVariable,
  //     refactorInput.jsObject.newName,
  //   );

  //   //Verify JSObject refactoring in Query pane
  //   _.ee.SelectEntityByName(refactorInput.query.newName);
  //   _.agHelper.Sleep(1000);
  //   _.agHelper.GetNAssertContains(
  //     _.locators._editorVariable,
  //     refactorInput.jsObject.newName,
  //   );

  //   //Verify TextWidget, InputWidget, QueryRefactor, RefactorAPI refactor
  //   //Verify Names in JS object string shouldn't be updated
  //   _.ee.SelectEntityByName(refactorInput.jsObject.newName);
  //   _.agHelper.GetNAssertContains(
  //     _.locators._consoleString,
  //     refactorInput.textWidget.newName,
  //     "not.exist",
  //   );
  //   _.agHelper.GetNAssertContains(
  //     _.locators._consoleString,
  //     refactorInput.inputWidget.newName,
  //     "not.exist",
  //   );
  //   _.agHelper.GetNAssertContains(
  //     _.locators._consoleString,
  //     refactorInput.query.newName,
  //     "not.exist",
  //   );
  //   _.agHelper.GetNAssertContains(
  //     _.locators._consoleString,
  //     refactorInput.api.newName,
  //     "not.exist",
  //   );

  //   //Names in comment shouldn't be updated
  //   _.agHelper.GetNAssertContains(
  //     _.locators._commentString,
  //     refactorInput.textWidget.newName,
  //     "not.exist",
  //   );
  //   _.agHelper.GetNAssertContains(
  //     _.locators._commentString,
  //     refactorInput.inputWidget.newName,
  //     "not.exist",
  //   );
  //   _.agHelper.GetNAssertContains(
  //     _.locators._commentString,
  //     refactorInput.query.newName,
  //     "not.exist",
  //   );
  //   _.agHelper.GetNAssertContains(
  //     _.locators._commentString,
  //     refactorInput.api.newName,
  //     "not.exist",
  //   );

  //   //Variables reffered should be updated in JS Object
  //   _.agHelper.GetNAssertContains(
  //     _.locators._editorVariable,
  //     refactorInput.textWidget.newName,
  //   );
  //   _.agHelper.GetNAssertContains(
  //     _.locators._editorVariable,
  //     refactorInput.inputWidget.newName,
  //   );
  //   _.agHelper.GetNAssertContains(
  //     _.locators._editorVariable,
  //     refactorInput.query.newName,
  //   );
  //   _.agHelper.GetNAssertContains(
  //     _.locators._editorVariable,
  //     refactorInput.api.newName,
  //   );
  // });

  after("Delete Mysql query, JSObject, API & Datasource", () => {
    _.ee.ActionContextMenuByEntityName(
      "QueryRefactorRenamed",
      "Delete",
      "Are you sure?",
    );
    _.ee.ActionContextMenuByEntityName(
      "JSObject1Renamed",
      "Delete",
      "Are you sure?", true
    );
    _.ee.ActionContextMenuByEntityName(
      "RefactorAPIRenamed",
      "Delete",
      "Are you sure?",
    );
    _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
  });
});
