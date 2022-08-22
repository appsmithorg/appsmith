import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  apiPage = ObjectsRegistry.ApiPage,
  agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane;

const successMessage = "Successful Trigger";
const errorMessage = "Unsuccessful Trigger";
let dsName: string;

const clickButtonAndAssertLintError = (
  shouldExist: boolean,
  shouldWait = false,
) => {
  agHelper.Sleep(2000);
  // Check for presence/ absence of lint error
  ee.SelectEntityByName("Button1", "WIDGETS");
  // Sometimes wait for page to switch
  shouldWait && agHelper.Sleep(2000);
  if (shouldExist) {
    agHelper.AssertElementExist(locator._lintErrorElement);
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage(errorMessage);
  } else {
    agHelper.AssertElementAbsence(locator._lintErrorElement);
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage(successMessage);
  }

  //Reload and Check for presence/ absence of lint error
  agHelper.RefreshPage();
  ee.SelectEntityByName("Button1", "WIDGETS");
  shouldExist
    ? agHelper.AssertElementExist(locator._lintErrorElement)
    : agHelper.AssertElementAbsence(locator._lintErrorElement);
};

const createMySQLDatasourceQuery = () => {
  // Create Query
  dataSources.NavigateFromActiveDS(dsName, true);
  agHelper.GetNClick(dataSources._templateMenu);
  const tableCreateQuery = `SELECT * FROM spacecrafts LIMIT 10;`;
  dataSources.EnterQuery(tableCreateQuery);
};

describe("Linting", () => {
  before(() => {
    ee.DragDropWidgetNVerify("buttonwidget", 300, 300);
    ee.NavigateToSwitcher("explorer");
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = ($dsName as unknown) as string;
    });
  });

  it("1. TC 1927 - Shows correct lint error when Api is deleted or created", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{function(){
        try{
          Api1.run()
          showAlert("${successMessage}")
        }catch(e){
          showAlert("${errorMessage}")
        }
      }()}}`,
    );

    propPane.UpdatePropertyFieldValue("Tooltip", "{{Api1.name}}");
    clickButtonAndAssertLintError(true);

    // create Api1
    apiPage.CreateAndFillApi(
      "https://jsonplaceholder.typicode.com/",
      "",
      "GET",
    );

    clickButtonAndAssertLintError(false);

    // Delete Api and assert that lint error shows
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("Api1", "Delete", "Are you sure?");

    clickButtonAndAssertLintError(true);

    // Re-create Api1
    apiPage.CreateAndFillApi(
      "https://jsonplaceholder.typicode.com/",
      "",
      "GET",
    );

    clickButtonAndAssertLintError(false);
  });

  it("2. TC 1927 Cont'd - Doesn't show lint errors when Api is renamed", () => {
    ee.SelectEntityByName("Api1", "QUERIES/JS");
    agHelper.RenameWithInPane("Api2");

    clickButtonAndAssertLintError(false);

    ee.SelectEntityByName("Api2", "QUERIES/JS");
    agHelper.RenameWithInPane("Api1");

    clickButtonAndAssertLintError(false);
  });

  it("3. TC 1929 - Shows correct lint error when JSObject is deleted or created", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{function(){
        try{
          JSObject1.myFun1()
        }catch(e){
          showAlert("${errorMessage}")
        }
      }()}}`,
    );
    propPane.UpdatePropertyFieldValue("Tooltip", `{{JSObject1.myVar1}}`);

    clickButtonAndAssertLintError(true);

    jsEditor.CreateJSObject(
      `export default {
        myVar1: "name",
        myVar2: "test",
        myFun1: () => {
          showAlert("${successMessage}")
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    clickButtonAndAssertLintError(false);
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");
    ee.SelectEntityByName("Button1", "WIDGETS");

    clickButtonAndAssertLintError(true);

    // Re-create JSObject, lint error should be gone
    jsEditor.CreateJSObject(
      `export default {
        myVar1: "name",
        myVar2: "test",
        myFun1: () => {
          showAlert("${successMessage}")
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    clickButtonAndAssertLintError(false);
  });

  it("4. TC 1929 Cont'd -Doesn't show lint error when JSObject is renamed", () => {
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("JSObject1", "QUERIES/JS");
    jsEditor.RenameJSObjFromPane("JSObject2");
    clickButtonAndAssertLintError(false, true);
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("JSObject2", "QUERIES/JS");
    jsEditor.RenameJSObjFromPane("JSObject1");
    clickButtonAndAssertLintError(false, true);
  });

  it("5. TC 1928 - Shows correct lint error with Query is created or Deleted", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{function(){
      try{
        Query1.run()
        showAlert("${successMessage}")
      }catch(e){
        showAlert("${errorMessage}")
      }
    }()}}`,
    );
    propPane.UpdatePropertyFieldValue("Tooltip", `{{Query1.name}}`);
    clickButtonAndAssertLintError(true);

    createMySQLDatasourceQuery();
    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);

    // Delete
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
    clickButtonAndAssertLintError(true);

    // Recreate Query
    createMySQLDatasourceQuery();
    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);
  });

  it("6. TC 1928 Cont'd - Shows correct lint error when Query is renamed", () => {
    ee.SelectEntityByName("Query1", "QUERIES/JS");
    agHelper.RenameWithInPane("Query2");

    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);

    ee.SelectEntityByName("Query2", "QUERIES/JS");
    agHelper.RenameWithInPane("Query1");

    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);
  });

  it("7. TC 1930 - Shows correct lint error with multiple entities in triggerfield", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{function(){
        try{
          Api1.run(); JSObject1.myFun1(); JSObject1.myFun2(); Query1.run()
          showAlert("${successMessage}")
        }catch(e){
          showAlert("${errorMessage}")
        }
      }()}}`,
    );
    propPane.UpdatePropertyFieldValue(
      "Tooltip",
      `{{Api1.name + JSObject1.myVar1 + Query1.name}}`,
    );

    clickButtonAndAssertLintError(false);

    // Delete all
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Api1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
    clickButtonAndAssertLintError(true);

    // ReCreate all
    jsEditor.CreateJSObject(
      `export default {
          myVar1: "name",
          myVar2: "test",
          myFun1: () => {
            showAlert("${successMessage}")
          },
          myFun2: async () => {
              //use async-await or promises
          }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    apiPage.CreateAndFillApi(
      "https://jsonplaceholder.typicode.com/",
      "Api1",
      "GET",
    );

    createMySQLDatasourceQuery();

    clickButtonAndAssertLintError(false);
  });
  it("8. Doesn't show lint errors for supported web apis", () => {
    const JS_OBJECT_WITH_WEB_API = `export default {
      myFun1: () => {
          const byteArray = new Uint8Array(1);
      console.log(crypto.getRandomValues(byteArray));
      },
    }`;
    jsEditor.CreateJSObject(JS_OBJECT_WITH_WEB_API, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    // expect no lint error
    agHelper.AssertElementAbsence(locator._lintErrorElement);
  });
});
