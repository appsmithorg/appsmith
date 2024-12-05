import {
  agHelper,
  apiPage,
  dataManager,
  dataSources,
  entityExplorer,
  entityItems,
  homePage,
  installer,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const successMessage = "Successful Trigger";
const errorMessage = "Unsuccessful Trigger";
let dsName: string;

const clickButtonAndAssertLintError = (
  shouldExist: boolean,
  shouldWait = false,
) => {
  agHelper.Sleep(2000);
  // Check for presence/ absence of lint error
  EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
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
  // agHelper.AssertElementVisibility(locators._visibleTextDiv("Explorer"));
  // agHelper.Sleep(2500);
  EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
  shouldExist
    ? agHelper.AssertElementExist(locators._lintErrorElement)
    : agHelper.AssertElementAbsence(locators._lintErrorElement);
};

const createMySQLDatasourceQuery = () => {
  // Create Query
  dataSources.CreateQueryForDS(dsName, `SELECT * FROM spacecrafts LIMIT 10;`);
};

describe("Linting", { tags: ["@tag.JS", "@tag.Binding"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 300, 300);
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName as unknown as string;
    });
    AppSidebar.navigate(AppSidebarButton.Editor);
  });

  it("1. TC 1927 - Show correct lint errors", () => {
    // For browser APIs it should give linting error
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext("onClick", `{{window}}`);
    agHelper.AssertElementExist(locators._lintErrorElement);

    // Shows correct lint error when Api is deleted or created
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
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );

    clickButtonAndAssertLintError(false);

    // Delete Api and assert that lint error shows
    PageLeftPane.switchSegment(PagePaneSegment.Queries);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api1",
      action: "Delete",
      entityType: entityItems.Api,
    });
    clickButtonAndAssertLintError(true);

    // Re-create Api1
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );

    clickButtonAndAssertLintError(false);
  });

  it("2. TC 1927 Cont'd - Doesn't show lint errors when Api is renamed", () => {
    EditorNavigation.SelectEntityByName("Api1", EntityType.Api);
    agHelper.RenameQuery("Api2");

    clickButtonAndAssertLintError(false);

    EditorNavigation.SelectEntityByName("Api2", EntityType.Api);
    agHelper.RenameQuery("Api1");

    clickButtonAndAssertLintError(false);
  });

  it("3. TC 1929 - Shows correct lint error when JSObject is deleted or created", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
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
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
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
    EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
    jsEditor.RenameJSObjFromPane("JSObject2");
    clickButtonAndAssertLintError(false, true);
    EditorNavigation.SelectEntityByName("JSObject2", EntityType.JSObject);
    jsEditor.RenameJSObjFromPane("JSObject1");
    clickButtonAndAssertLintError(false, true);
  });

  it("5. TC 1928 - Shows correct lint error with Query is created or Deleted", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
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
    PageLeftPane.switchSegment(PagePaneSegment.Queries);
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
    EditorNavigation.SelectEntityByName("Query1", EntityType.Query);
    agHelper.RenameQuery("Query2");

    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);

    EditorNavigation.SelectEntityByName("Query2", EntityType.Query);
    agHelper.RenameQuery("Query1");

    // Assert Absence of lint error
    clickButtonAndAssertLintError(false);
  });

  it("7. TC 1930 - Shows correct lint error with multiple entities in triggerfield", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
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
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    PageLeftPane.switchSegment(PagePaneSegment.Queries);
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
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );

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
    "9. Shows lint errors for usage of library that are not installed yet",
    { tags: ["@tag.excludeForAirgap"] },
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
      AppSidebar.navigate(AppSidebarButton.Libraries);
      // install the library
      installer.OpenInstaller();
      installer.InstallLibrary("uuidjs", "UUID");
      installer.CloseInstaller();
      EditorNavigation.SelectEntityByName("JSObject3", EntityType.JSObject);

      agHelper.AssertElementAbsence(locators._lintErrorElement);
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.uninstallLibrary("uuidjs");
      EditorNavigation.SelectEntityByName("JSObject3", EntityType.JSObject);
      agHelper.AssertElementExist(locators._lintErrorElement);
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.OpenInstaller();
      installer.InstallLibrary("uuidjs", "UUID");
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
