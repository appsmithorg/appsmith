import {
  agHelper,
  dataSources,
  deployMode,
  entityExplorer,
  entityItems,
  homePage,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let datasourceName: any, jsName: any;

describe("JSObjects OnLoad Actions tests", function () {
  before(() => {
    homePage.CreateNewWorkspace("JSOnLoadTest", true);
  });

  it("1. Bug 27594 - Tc #58 Verify JSOnPageload with ConfirmBefore calling - while imported", () => {
    homePage.ImportApp("ImportApps/JSOnLoadImport.json", "JSOnLoadTest");
    cy.wait("@importNewApplication").then(() => {
      agHelper.Sleep();

      // This will fill in credentials and test the datasource
      dataSources.ReconnectSingleDSNAssert("MySQL-Ds", "MySQL");
    });
    AssertJSOnPageLoad("runSpaceCraftImages", true);
  });

  it("2. Tc #58 Verify JSOnPageload with ConfirmBefore calling - while forked", () => {
    homePage.NavigateToHome();
    homePage.ForkApplication("JSOnloadImportTest");
    AssertJSOnPageLoad("runSpaceCraftImages");
  });

  it("3. Tc #59 Verify JSOnPageload with ConfirmBefore calling - while imported - failing JSObj", () => {
    homePage.ImportApp("ImportApps/JSOnLoadFailureTest.json", "JSOnLoadTest");
    cy.wait("@importNewApplication").then(() => {
      homePage.AssertImportToast();
      AssertJSOnPageLoad(
        "runWorldCountries",
        false,
        "getWorldCountries is not defined",
      );
    });
  });

  it("4. Tc #59 Verify JSOnPageload with ConfirmBefore calling - while forked - failing JSObj", () => {
    homePage.NavigateToHome();
    homePage.ForkApplication("JSOnLoadFailureTest");
    AssertJSOnPageLoad(
      "runWorldCountries",
      false,
      "getWorldCountries is not defined",
    );
  });

  it("5. Delete the applications & workspace - Success/failing JSObj", () => {
    homePage.NavigateToHome();
    agHelper.WaitUntilAllToastsDisappear();
    homePage.DeleteApplication("JSOnloadImportTest");
    homePage.DeleteApplication("JSOnloadImportTest (1)");

    homePage.DeleteApplication("JSOnLoadFailureTest");
    homePage.DeleteApplication("JSOnLoadFailureTest (1)");
    //homePage.DeleteWorkspace("JSOnLoadTest");
  });

  it("6. Tc #1910 - Verify the Number of confirmation models of JS Object on page load", () => {
    homePage.CreateAppInWorkspace("JSOnLoadTest");
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 100);
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then((dsName) => {
      datasourceName = dsName;
      dataSources.CreateQueryAfterDSSaved(
        `SELECT * FROM public."astronauts" LIMIT 1;`,
        "getastronauts",
      );
      dataSources.CreateQueryFromOverlay(
        datasourceName,
        `SELECT * FROM public."category" LIMIT 1;`,
        "getcategory",
      );
      dataSources.CreateQueryFromOverlay(
        datasourceName,
        `SELECT * FROM public."city" LIMIT 1;`,
        "getcity",
      );
      dataSources.CreateQueryFromOverlay(
        datasourceName,
        `SELECT * FROM public."film" LIMIT 1;`,
        "getfilm",
      );
      dataSources.CreateQueryFromOverlay(
        datasourceName,
        `SELECT * FROM public."hogwartsstudents" LIMIT 1;`,
        "gethogwartsstudents",
      );
    });

    jsEditor.CreateJSObject(
      `export default {
        astros: () => {
          return getastronauts.run();	},
        city: () => {
          return getcity.run()
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    jsEditor.EnableDisableAsyncFuncSettings("astros", true, true);
    jsEditor.EnableDisableAsyncFuncSettings("city", true, true);

    jsEditor.CreateJSObject(
      `export default {
        cat: () => {
          return getcategory.run();	},
        hogwartsstudents: () => {
          return gethogwartsstudents.run();
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    jsEditor.EnableDisableAsyncFuncSettings("cat", true, true);
    jsEditor.EnableDisableAsyncFuncSettings("hogwartsstudents", true, true);

    jsEditor.CreateJSObject(
      `export default {
        film: async () => {
          return getfilm.run();
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    jsEditor.EnableDisableAsyncFuncSettings("film", true, true);

    deployMode.DeployApp();
    for (let dialog = 1; dialog <= 5; dialog++) {
      jsEditor.ConfirmationClick("Yes");
      agHelper.Sleep(500);
    }
    deployMode.NavigateBacktoEditor();
    for (let dialog = 1; dialog <= 5; dialog++) {
      jsEditor.ConfirmationClick("Yes");
      agHelper.Sleep(500);
    }
  });

  it("7. Tc #1909 - Verify the sequence of of JS Object on page load", () => {
    EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
    jsEditor.EnableDisableAsyncFuncSettings("astros", true, false);
    jsEditor.EnableDisableAsyncFuncSettings("city", true, false);
    EditorNavigation.SelectEntityByName("JSObject2", EntityType.JSObject);
    jsEditor.EnableDisableAsyncFuncSettings("cat", true, false);
    jsEditor.EnableDisableAsyncFuncSettings("hogwartsstudents", true, false);
    EditorNavigation.SelectEntityByName("JSObject3", EntityType.JSObject);
    jsEditor.EnableDisableAsyncFuncSettings("film", true, false);

    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    agHelper.RefreshPage();

    agHelper.ValidateToastMessage("ran successfully", 0, 5);
  });

  it("8. Tc 51, 52 Verify that JS editor function has a settings button available for functions marked async", () => {
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {	},
        myFun2: async () => {	},
        myFun3: async () => {	},
        myFun4: async () => {	},
        myFun5: async () => {	},
        myFun6: async () => {	},
        myFun7: () => {	},
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    jsEditor.VerifyAsyncFuncSettings("myFun2", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun3", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun4", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun5", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun6", false, false);

    VerifyFunctionDropdown(
      ["myFun1", "myFun7"],
      ["myFun2", "myFun3", "myFun4", "myFun5", "myFun6"],
    );

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      EditorNavigation.SelectEntityByName(
        jsName as string,
        EntityType.JSObject,
      );
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: jsName as string,
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
  });

  function AssertJSOnPageLoad(
    jsMethod: string,
    shouldCheckImport = false,
    faliureMsg = "",
  ) {
    agHelper.AssertElementVisibility(
      jsEditor._dialogBody("JSObject1." + jsMethod),
    );
    jsEditor.ConfirmationClick("No");
    agHelper.Sleep(1000);

    shouldCheckImport && homePage.AssertNCloseImport();

    deployMode.DeployApp();
    agHelper.AssertElementVisibility(
      jsEditor._dialogBody("JSObject1." + jsMethod),
    );
    jsEditor.ConfirmationClick("Yes");
    if (faliureMsg) agHelper.ValidateToastMessage(faliureMsg);
    else agHelper.Sleep(3000);
    deployMode.NavigateBacktoEditor();
    jsEditor.ConfirmationClick("No");
    agHelper.Sleep(2000);
  }

  function VerifyFunctionDropdown(
    syncFunctions: string[],
    asyncFunctions: string[],
  ) {
    cy.get(jsEditor._funcDropdown).click();
    cy.get(jsEditor._funcDropdownOptions).then(function ($ele) {
      expect($ele.eq(0).text()).to.be.oneOf(syncFunctions);
      expect($ele.eq(1).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(2).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(3).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(4).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(5).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(6).text()).to.be.oneOf(syncFunctions);
    });
    cy.get(jsEditor._funcDropdown).click();
  }
});
