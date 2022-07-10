import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  apiPage = ObjectsRegistry.ApiPage,
  agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources;

const clickButtonAndAssertLintError = (
  shouldExist: boolean,
  shouldWait = false,
) => {
  // Check for presence/ absence of lint error
  ee.SelectEntityByName("Button1", "WIDGETS");
  // Sometimes wait for page to switch
  shouldWait && agHelper.Sleep(2000);
  shouldExist
    ? agHelper.AssertElementExist(locator._lintErrorElement)
    : agHelper.AssertElementAbsence(locator._lintErrorElement);

  //Reload and Check for presence/ absence of lint error
  agHelper.RefreshPage();
  ee.SelectEntityByName("Button1", "WIDGETS");
  shouldExist
    ? agHelper.AssertElementExist(locator._lintErrorElement)
    : agHelper.AssertElementAbsence(locator._lintErrorElement);
};

describe("Linting", () => {
  before(() => {
    ee.DragDropWidgetNVerify("buttonwidget", 300, 300);
    ee.NavigateToSwitcher("explorer");
  });

  it("Shows correct lint error when Api is deleted or created", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{Api1.run(() => showAlert('success','success'), () => showAlert('error','error'))}}`,
      true,
      true,
    );
    jsEditor.EnterJSContext("Label", `{{Api1.name}}`, true, false);
    clickButtonAndAssertLintError(true);

    // create Api1
    apiPage.CreateAndFillApi(
      "https://jsonplaceholder.typicode.com/",
      "Api1",
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
      "Api1",
      "GET",
    );

    clickButtonAndAssertLintError(false);
  });
  it("Doesn't show lint errors when Api is renamed", () => {
    ee.SelectEntityByName("Api1", "QUERIES/JS");
    agHelper.RenameWithInPane("Api2");

    clickButtonAndAssertLintError(false);

    ee.SelectEntityByName("Api2", "QUERIES/JS");
    agHelper.RenameWithInPane("Api1");

    clickButtonAndAssertLintError(false);
  });
  it("Shows correct lint error when JSObject is deleted or created", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext("onClick", `{{JSObject1.myFun1()}}`, true, false);
    jsEditor.EnterJSContext("Label", `{{JSObject1.myVar1}}`, true, false);
    clickButtonAndAssertLintError(true);

    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {
            //write code here
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
        myVar1: [],
        myVar2: {},
        myFun1: () => {
            //write code here
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
  it("Doesn't show lint error when JSObject is renamed", () => {
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("JSObject1", "QUERIES/JS");
    jsEditor.RenameJSObjFromPane("JSObject2");
    clickButtonAndAssertLintError(false, true);
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("JSObject2", "QUERIES/JS");
    jsEditor.RenameJSObjFromPane("JSObject1");
    clickButtonAndAssertLintError(false, true);
  });

  it("Shows correct lint error with multiple entities in triggerfield", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{Api1.run(); JSObject1.myFun1(); JSObject1.myFun2()}}`,
      true,
      false,
    );
    jsEditor.EnterJSContext(
      "Label",
      `{{Api1.name + JSObject1.myVar1}}`,
      true,
      false,
    );

    clickButtonAndAssertLintError(false);
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Api1", "Delete", "Are you sure?");

    clickButtonAndAssertLintError(true);

    jsEditor.CreateJSObject(
      `export default {
          myVar1: [],
          myVar2: {},
          myFun1: () => {
              //write code here
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
    clickButtonAndAssertLintError(false);
  });

  it("Shows correct lint error with Datasource and Query", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext("onClick", `{{Query1.run()}}`, true, false);
    jsEditor.EnterJSContext("Label", `{{Query1.name}}`, true, false);
    clickButtonAndAssertLintError(true);
    let guid = "";

    // Create mySql datasource
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("MySQL");
      guid = (uid as unknown) as string;
      agHelper.RenameWithInPane("MySQL " + guid, false);
      dataSources.SaveDatasource();

      // Create Query
      dataSources.NavigateFromActiveDS("MySQL " + guid, true);
      agHelper.GetNClick(dataSources._templateMenu);
      agHelper.RenameWithInPane("Query1");

      // Assert Absence of lint error
      clickButtonAndAssertLintError(false);

      ee.SelectEntityByName("Query1", "QUERIES/JS");
      agHelper.RenameWithInPane("Query2");

      // Assert Absence of lint error
      clickButtonAndAssertLintError(false);

      ee.SelectEntityByName("Query2", "QUERIES/JS");
      agHelper.RenameWithInPane("Query1");

      // Assert Absence of lint error
      clickButtonAndAssertLintError(false);
    });

    clickButtonAndAssertLintError(false);

    // Delete
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
    clickButtonAndAssertLintError(true);
  });
});
