import {
  agHelper,
  apiPage,
  dataSources,
  entityExplorer,
  homePage,
  installer,
  jsEditor,
  locators,
  propPane,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
import datasourceFormData from "../../../../fixtures/datasources.json";

const successMessage = "Successful Trigger";
const errorMessage = "Unsuccessful Trigger";
let dsName: string;

const clickButtonAndAssertLintError = (
  shouldExist: boolean,
  shouldWait = false,
) => {
  agHelper.Sleep(2000);
  // Check for presence/ absence of lint error
  entityExplorer.SelectEntityByName("Button1", "Widgets");
  // Sometimes wait for page to switch
  shouldWait && agHelper.Sleep(2000);
  if (shouldExist) {
    agHelper.AssertElementExist(locators._lintErrorElement);
    agHelper.ClickButton("Submit");
    agHelper.AssertContains(errorMessage);
  } else {
    agHelper.AssertElementAbsence(locators._lintErrorElement);
    agHelper.ClickButton("Submit");
    agHelper.AssertContains(successMessage);
  }

  //Reload and Check for presence/ absence of lint error
  agHelper.RefreshPage();
  // agHelper.AssertElementVisible(locators._visibleTextDiv("Explorer"));
  // agHelper.Sleep(2500);
  entityExplorer.SelectEntityByName("Button1", "Widgets");
  shouldExist
    ? agHelper.AssertElementExist(locators._lintErrorElement)
    : agHelper.AssertElementAbsence(locators._lintErrorElement);
};

const createMySQLDatasourceQuery = () => {
  // Create Query
  dataSources.NavigateFromActiveDS(dsName, true);
  const tableCreateQuery = `SELECT * FROM spacecrafts LIMIT 10;`;
  dataSources.EnterQuery(tableCreateQuery);
};

describe("Linting", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 300, 300);
    entityExplorer.NavigateToSwitcher("Explorer");
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName as unknown as string;
    });
  });

  it("1. TC 1927 - Shows correct lint error when Api is deleted or created", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
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

    propPane.UpdatePropertyFieldValue("Tooltip", "{{Api1.config.httpMethod}}");
    clickButtonAndAssertLintError(true);

    // create Api1
    apiPage.CreateAndFillApi(datasourceFormData.mockApiUrl);

    clickButtonAndAssertLintError(false);

    // Delete Api and assert that lint error shows
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api1",
      action: "Delete",
      entityType: entityItems.Api,
    });
    clickButtonAndAssertLintError(true);

    // Re-create Api1
    apiPage.CreateAndFillApi(datasourceFormData.mockApiUrl);

    clickButtonAndAssertLintError(false);
  });

  it("2. TC 1927 Cont'd - Doesn't show lint errors when Api is renamed", () => {
    entityExplorer.SelectEntityByName("Api1", "Queries/JS");
    agHelper.RenameWithInPane("Api2");

    clickButtonAndAssertLintError(false);

    entityExplorer.SelectEntityByName("Api2", "Queries/JS");
    agHelper.RenameWithInPane("Api1");

    clickButtonAndAssertLintError(false);
  });

  it("3. TC 1929 - Shows correct lint error when JSObject is deleted or created", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
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
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    entityExplorer.SelectEntityByName("Button1", "Widgets");
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
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    jsEditor.RenameJSObjFromPane("JSObject2");
    clickButtonAndAssertLintError(false, true);
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.SelectEntityByName("JSObject2", "Queries/JS");
    jsEditor.RenameJSObjFromPane("JSObject1");
    clickButtonAndAssertLintError(false, true);
  });

  it("5. TC 1928 - Shows correct lint error with Query is created or Deleted", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
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
    propPane.UpdatePropertyFieldValue("Tooltip", `{{Query1.ENTITY_TYPE}}`);
    clickButtonAndAssertLintError(true);

    createMySQLDatasourceQuery();
    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);

    // Delete
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Query1",
      action: "Delete",
      entityType: entityItems.Query,
    });
    clickButtonAndAssertLintError(true);

    // Recreate Query
    createMySQLDatasourceQuery();
    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);
  });

  it("6. TC 1928 Cont'd - Shows correct lint error when Query is renamed", () => {
    entityExplorer.SelectEntityByName("Query1", "Queries/JS");
    agHelper.RenameWithInPane("Query2");

    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);

    entityExplorer.SelectEntityByName("Query2", "Queries/JS");
    agHelper.RenameWithInPane("Query1");

    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);
  });

  it("7. TC 1930 - Shows correct lint error with multiple entities in triggerfield", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext(
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
      `{{Api1.config.httpMethod + JSObject1.myVar1 + Query1.ENTITY_TYPE}}`,
    );

    clickButtonAndAssertLintError(false);

    // Delete all
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api1",
      action: "Delete",
      entityType: entityItems.Api,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Query1",
      action: "Delete",
      entityType: entityItems.Query,
    });
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
    apiPage.CreateAndFillApi(datasourceFormData.mockApiUrl);

    createMySQLDatasourceQuery();
    agHelper.RefreshPage(); //Since this seems failing a bit
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
    agHelper.AssertElementAbsence(locators._lintErrorElement);
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
      jsEditor.CreateJSObject(JS_OBJECT_WITH_LIB_API, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      });

      agHelper.AssertElementExist(locators._lintErrorElement);
      entityExplorer.ExpandCollapseEntity("Libraries");
      // install the library
      installer.OpenInstaller();
      installer.installLibrary("uuidjs", "UUID");
      installer.CloseInstaller();

      agHelper.AssertElementAbsence(locators._lintErrorElement);

      installer.uninstallLibrary("uuidjs");

      agHelper.AssertElementExist(locators._lintErrorElement);
      agHelper.Sleep(2000);
      installer.OpenInstaller();
      installer.installLibrary("uuidjs", "UUID");
      installer.CloseInstaller();

      homePage.NavigateToHome();

      homePage.CreateNewApplication();

      jsEditor.CreateJSObject(JS_OBJECT_WITH_LIB_API, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      });

      agHelper.AssertElementExist(locators._lintErrorElement);
    },
  );
  it("10. Should not clear unrelated lint errors", () => {
    const JS_OBJECT_WITH_MULTPLE_ERRORS = `export default {
      myFun1: () => {
        return error1;
      },
      myFun2: ()=>{
       return error2
      }
    }`;
    const JS_OBJECT_WITH_MYFUN2_EDITED = `export default {
      myFun1: () => {
        return error1;
      },
      myFun2: ()=>{
       return "error cleared"
      }
    }`;

    jsEditor.CreateJSObject(JS_OBJECT_WITH_MULTPLE_ERRORS, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });
    agHelper.AssertElementExist(locators._lintErrorElement);

    jsEditor.EditJSObj(JS_OBJECT_WITH_MYFUN2_EDITED, false);

    agHelper.AssertElementExist(locators._lintErrorElement);
  });
  it("11. Shows correct lint error when js object has duplicate keys", () => {
    const JS_OBJECT_WITH_DUPLICATE_KEYS = `export default {
        myVar1: [],
        myVar2: {},
        myFun1 () {
            //	write code here
            //	this.myVar1 = [1,2,3]
        
        },
        async myFun1 () {
            //	use async-await or promises
            //	await storeValue('varName', 'hello world') 
        }
    }`;

    jsEditor.CreateJSObject(JS_OBJECT_WITH_DUPLICATE_KEYS, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    agHelper
      .AssertElementExist(locators._lintErrorElement)
      .should("have.length", 1);
  });
});
