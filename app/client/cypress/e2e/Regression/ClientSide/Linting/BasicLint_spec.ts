import * as _ from "../../../../support/Objects/ObjectsCore";

const successMessage = "Successful Trigger";
const errorMessage = "Unsuccessful Trigger";
let dsName: string;

const clickButtonAndAssertLintError = (
  shouldExist: boolean,
  shouldWait = false,
) => {
  _.agHelper.Sleep(2000);
  // Check for presence/ absence of lint error
  _.entityExplorer.SelectEntityByName("Button1", "Widgets");
  // Sometimes wait for page to switch
  shouldWait && _.agHelper.Sleep(2000);
  if (shouldExist) {
    _.agHelper.AssertElementExist(_.locators._lintErrorElement);
    _.agHelper.ClickButton("Submit");
    _.agHelper.AssertContains(errorMessage);
  } else {
    _.agHelper.AssertElementAbsence(_.locators._lintErrorElement);
    _.agHelper.ClickButton("Submit");
    _.agHelper.AssertContains(successMessage);
  }

  //Reload and Check for presence/ absence of lint error
  _.agHelper.RefreshPage();
  // _.agHelper.AssertElementVisible(_.locators._visibleTextDiv("Explorer"));
  // _.agHelper.Sleep(2500);
  _.entityExplorer.SelectEntityByName("Button1", "Widgets");
  shouldExist
    ? _.agHelper.AssertElementExist(_.locators._lintErrorElement)
    : _.agHelper.AssertElementAbsence(_.locators._lintErrorElement);
};

const createMySQLDatasourceQuery = () => {
  // Create Query
  _.dataSources.NavigateFromActiveDS(dsName, true);
  _.agHelper.GetNClick(_.dataSources._templateMenu);
  const tableCreateQuery = `SELECT * FROM spacecrafts LIMIT 10;`;
  _.dataSources.EnterQuery(tableCreateQuery);
};

describe("Linting", () => {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 300, 300);
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName as unknown as string;
    });
  });

  it("1. TC 1927 - Shows correct lint error when Api is deleted or created", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
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

    _.propPane.UpdatePropertyFieldValue(
      "Tooltip",
      "{{Api1.config.httpMethod}}",
    );
    clickButtonAndAssertLintError(true);

    // create Api1
    _.apiPage.CreateAndFillApi("https://jsonplaceholder.typicode.com/");

    clickButtonAndAssertLintError(false);

    // Delete Api and assert that lint error shows
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.ActionContextMenuByEntityName(
      "Api1",
      "Delete",
      "Are you sure?",
    );

    clickButtonAndAssertLintError(true);

    // Re-create Api1
    _.apiPage.CreateAndFillApi("https://jsonplaceholder.typicode.com/");

    clickButtonAndAssertLintError(false);
  });

  it("2. TC 1927 Cont'd - Doesn't show lint errors when Api is renamed", () => {
    _.entityExplorer.SelectEntityByName("Api1", "Queries/JS");
    _.agHelper.RenameWithInPane("Api2");

    clickButtonAndAssertLintError(false);

    _.entityExplorer.SelectEntityByName("Api2", "Queries/JS");
    _.agHelper.RenameWithInPane("Api1");

    clickButtonAndAssertLintError(false);
  });

  it("3. TC 1929 - Shows correct lint error when JSObject is deleted or created", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
      "onClick",
      `{{function(){
        try{
          JSObject1.myFun1()
        }catch(e){
          showAlert("${errorMessage}")
        }
      }()}}`,
    );
    _.propPane.UpdatePropertyFieldValue("Tooltip", `{{JSObject1.myVar1}}`);

    clickButtonAndAssertLintError(true);

    _.jsEditor.CreateJSObject(
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
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.ActionContextMenuByEntityName(
      "JSObject1",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    clickButtonAndAssertLintError(true);

    // Re-create JSObject, lint error should be gone
    _.jsEditor.CreateJSObject(
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
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    _.jsEditor.RenameJSObjFromPane("JSObject2");
    clickButtonAndAssertLintError(false, true);
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("JSObject2", "Queries/JS");
    _.jsEditor.RenameJSObjFromPane("JSObject1");
    clickButtonAndAssertLintError(false, true);
  });

  it("5. TC 1928 - Shows correct lint error with Query is created or Deleted", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
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
    _.propPane.UpdatePropertyFieldValue("Tooltip", `{{Query1.ENTITY_TYPE}}`);
    clickButtonAndAssertLintError(true);

    createMySQLDatasourceQuery();
    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);

    // Delete
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.ActionContextMenuByEntityName(
      "Query1",
      "Delete",
      "Are you sure?",
    );
    clickButtonAndAssertLintError(true);

    // Recreate Query
    createMySQLDatasourceQuery();
    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);
  });

  it("6. TC 1928 Cont'd - Shows correct lint error when Query is renamed", () => {
    _.entityExplorer.SelectEntityByName("Query1", "Queries/JS");
    _.agHelper.RenameWithInPane("Query2");

    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);

    _.entityExplorer.SelectEntityByName("Query2", "Queries/JS");
    _.agHelper.RenameWithInPane("Query1");

    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);
  });

  it("7. TC 1930 - Shows correct lint error with multiple entities in triggerfield", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext(
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
    _.propPane.UpdatePropertyFieldValue(
      "Tooltip",
      `{{Api1.config.httpMethod + JSObject1.myVar1 + Query1.ENTITY_TYPE}}`,
    );

    clickButtonAndAssertLintError(false);

    // Delete all
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.ActionContextMenuByEntityName(
      "JSObject1",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "Api1",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "Query1",
      "Delete",
      "Are you sure?",
    );
    clickButtonAndAssertLintError(true);

    // ReCreate all
    _.jsEditor.CreateJSObject(
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
    _.apiPage.CreateAndFillApi("https://jsonplaceholder.typicode.com/");

    createMySQLDatasourceQuery();
    _.agHelper.RefreshPage(); //Since this seems failing a bit
    clickButtonAndAssertLintError(false);
  });

  it("8. Doesn't show lint errors for supported web apis", () => {
    const JS_OBJECT_WITH_WEB_API = `export default {
      myFun1: () => {
          const byteArray = new Uint8Array(1);
      console.log(crypto.getRandomValues(byteArray));
      },
    }`;
    _.jsEditor.CreateJSObject(JS_OBJECT_WITH_WEB_API, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    // expect no lint error
    _.agHelper.AssertElementAbsence(_.locators._lintErrorElement);
  });

  it(
    "excludeForAirgap",
    "9. Shows lint errors for usage of library that are not installed yet",
    () => {
      const JS_OBJECT_WITH_LIB_API = `export default {
      myFun1: () => {
        return UUID.generate();
      },
    }`;
      _.jsEditor.CreateJSObject(JS_OBJECT_WITH_LIB_API, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      });

      _.agHelper.AssertElementExist(_.locators._lintErrorElement);
      _.entityExplorer.ExpandCollapseEntity("Libraries");
      // install the library
      _.installer.OpenInstaller();
      _.installer.installLibrary("uuidjs", "UUID");
      _.installer.CloseInstaller();

      _.agHelper.AssertElementAbsence(_.locators._lintErrorElement);

      _.installer.uninstallLibrary("uuidjs");

      _.agHelper.AssertElementExist(_.locators._lintErrorElement);
      _.agHelper.Sleep(2000);
      _.installer.OpenInstaller();
      _.installer.installLibrary("uuidjs", "UUID");
      _.installer.CloseInstaller();

      _.homePage.NavigateToHome();

      _.homePage.CreateNewApplication();

      _.jsEditor.CreateJSObject(JS_OBJECT_WITH_LIB_API, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      });

      _.agHelper.AssertElementExist(_.locators._lintErrorElement);
    },
  );
});
