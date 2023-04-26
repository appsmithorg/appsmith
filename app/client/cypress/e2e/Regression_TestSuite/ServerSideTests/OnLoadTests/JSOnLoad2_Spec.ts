import * as _ from "../../../../support/Objects/ObjectsCore";

let datasourceName: any, jsName: any;

describe("JSObjects OnLoad Actions tests", function () {
  before(() => {
    _.homePage.NavigateToHome();
    _.homePage.CreateNewWorkspace("JSOnLoadTest");
  });

  it("1. Tc #58 Verify JSOnPageload with ConfirmBefore calling - while imported", () => {
    _.homePage.ImportApp("ImportApps/JSOnLoadImport.json", "JSOnLoadTest");
    cy.wait("@importNewApplication").then(() => {
      _.agHelper.Sleep();
      _.dataSources.ReconnectDataSource("MySQL-Ds", "MySQL");
    });
    AssertJSOnPageLoad("runSpaceCraftImages", true);
  });

  it("2. Tc #58 Verify JSOnPageload with ConfirmBefore calling - while forked & duplicated", () => {
    _.homePage.NavigateToHome();
    _.homePage.ForkApplication("JSOnloadImportTest");
    AssertJSOnPageLoad("runSpaceCraftImages");

    _.homePage.NavigateToHome();
    _.homePage.DuplicateApplication("JSOnloadImportTest");
    AssertJSOnPageLoad("runSpaceCraftImages");
  });

  it("3. Tc #59 Verify JSOnPageload with ConfirmBefore calling - while imported - failing JSObj", () => {
    _.homePage.ImportApp("ImportApps/JSOnLoadFailureTest.json", "JSOnLoadTest");
    cy.wait("@importNewApplication").then(() => {
      _.homePage.AssertImportToast();
      AssertJSOnPageLoad(
        "runWorldCountries",
        false,
        "ReferenceError: getWorldCountries is not defined",
      );
    });
  });

  it("4. Tc #59 Verify JSOnPageload with ConfirmBefore calling - while forked & duplicated- failing JSObj", () => {
    _.homePage.NavigateToHome();
    _.homePage.ForkApplication("JSOnLoadFailureTest");
    AssertJSOnPageLoad(
      "runWorldCountries",
      false,
      "ReferenceError: getWorldCountries is not defined",
    );

    _.homePage.NavigateToHome();
    _.homePage.DuplicateApplication("JSOnLoadFailureTest");
    AssertJSOnPageLoad(
      "runWorldCountries",
      false,
      "ReferenceError: getWorldCountries is not defined",
    );
  });

  it("5. Delete the applications & workspace - Success/failing JSObj", () => {
    _.homePage.NavigateToHome();
    _.homePage.DeleteApplication("JSOnloadImportTest");
    _.homePage.DeleteApplication("JSOnloadImportTest (1)");
    _.homePage.DeleteApplication("JSOnloadImportTest Copy");
    _.homePage.DeleteApplication("JSOnLoadFailureTest");
    _.homePage.DeleteApplication("JSOnLoadFailureTest (1)");
    _.homePage.DeleteApplication("JSOnLoadFailureTest Copy");
    _.agHelper.AssertContains("Deleting application...");
    //_.homePage.DeleteWorkspace("JSOnLoadTest");
  });

  it("6. Tc #1910 - Verify the Number of confirmation models of JS object on page load", () => {
    _.homePage.CreateAppInWorkspace("JSOnLoadTest");
    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 100);
    _.entityExplorer.NavigateToSwitcher("explorer");
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then((dsName) => {
      datasourceName = dsName;
      _.dataSources.CreateQueryAfterDSSaved(
        `SELECT * FROM public."astronauts" LIMIT 1;`,
        "getastronauts",
      );
      _.dataSources.CreateQueryFromOverlay(
        datasourceName,
        `SELECT * FROM public."category" LIMIT 1;`,
        "getcategory",
      );
      _.dataSources.CreateQueryFromOverlay(
        datasourceName,
        `SELECT * FROM public."city" LIMIT 1;`,
        "getcity",
      );
      _.dataSources.CreateQueryFromOverlay(
        datasourceName,
        `SELECT * FROM public."film" LIMIT 1;`,
        "getfilm",
      );
      _.dataSources.CreateQueryFromOverlay(
        datasourceName,
        `SELECT * FROM public."hogwartsstudents" LIMIT 1;`,
        "gethogwartsstudents",
      );
    });

    _.jsEditor.CreateJSObject(
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

    _.jsEditor.EnableDisableAsyncFuncSettings("astros", true, true);
    _.jsEditor.EnableDisableAsyncFuncSettings("city", true, true);

    _.jsEditor.CreateJSObject(
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

    _.jsEditor.EnableDisableAsyncFuncSettings("cat", true, true);
    _.jsEditor.EnableDisableAsyncFuncSettings("hogwartsstudents", true, true);

    _.jsEditor.CreateJSObject(
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
    _.jsEditor.EnableDisableAsyncFuncSettings("film", true, true);

    _.deployMode.DeployApp();
    for (let dialog = 1; dialog <= 5; dialog++) {
      _.agHelper.ClickButton("Yes");
      _.agHelper.Sleep(2000);
    }
    _.deployMode.NavigateBacktoEditor();
    for (let dialog = 1; dialog <= 5; dialog++) {
      _.agHelper.ClickButton("Yes");
      _.agHelper.Sleep(2000);
    }
  });

  it("7. Tc #1909 - Verify the sequence of of JS object on page load", () => {
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("JSObject1");
    _.jsEditor.EnableDisableAsyncFuncSettings("astros", true, false);
    _.jsEditor.EnableDisableAsyncFuncSettings("city", true, false);
    _.entityExplorer.SelectEntityByName("JSObject2");
    _.jsEditor.EnableDisableAsyncFuncSettings("cat", true, false);
    _.jsEditor.EnableDisableAsyncFuncSettings("hogwartsstudents", true, false);
    _.entityExplorer.SelectEntityByName("JSObject3");
    _.jsEditor.EnableDisableAsyncFuncSettings("film", true, false);

    _.entityExplorer.SelectEntityByName("Page1");
    _.agHelper.RefreshPage();

    _.agHelper.ValidateToastMessage("ran successfully", 0, 5);
  });

  it("8. Tc 51, 52 Verify that JS editor function has a settings button available for functions marked async", () => {
    _.jsEditor.CreateJSObject(
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

    _.jsEditor.VerifyAsyncFuncSettings("myFun2", false, false);
    _.jsEditor.VerifyAsyncFuncSettings("myFun3", false, false);
    _.jsEditor.VerifyAsyncFuncSettings("myFun4", false, false);
    _.jsEditor.VerifyAsyncFuncSettings("myFun5", false, false);
    _.jsEditor.VerifyAsyncFuncSettings("myFun6", false, false);

    VerifyFunctionDropdown(
      ["myFun1", "myFun7"],
      [
        "myFun2Async",
        "myFun3Async",
        "myFun4Async",
        "myFun5Async",
        "myFun6Async",
      ],
    );

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      _.entityExplorer.ActionContextMenuByEntityName(
        jsName as string,
        "Delete",
        "Are you sure?",
        true,
      );
    });
  });

  function AssertJSOnPageLoad(
    jsMethod: string,
    shouldCheckImport = false,
    faliureMsg = "",
  ) {
    _.agHelper.AssertElementVisible(
      _.jsEditor._dialogBody("JSObject1." + jsMethod),
    );
    _.agHelper.ClickButton("No");
    _.agHelper.Sleep(1000);

    shouldCheckImport && _.homePage.AssertNCloseImport();

    _.deployMode.DeployApp();
    _.agHelper.AssertElementVisible(
      _.jsEditor._dialogBody("JSObject1." + jsMethod),
    );
    _.agHelper.ClickButton("Yes");
    if (faliureMsg) _.agHelper.ValidateToastMessage(faliureMsg);
    else _.agHelper.Sleep(3000);
    _.deployMode.NavigateBacktoEditor();
    _.agHelper.ClickButton("No");
    _.agHelper.Sleep(2000);
  }

  function VerifyFunctionDropdown(
    syncFunctions: string[],
    asyncFunctions: string[],
  ) {
    cy.get(_.jsEditor._funcDropdown).click();
    cy.get(_.jsEditor._funcDropdownOptions).then(function ($ele) {
      expect($ele.eq(0).text()).to.be.oneOf(syncFunctions);
      expect($ele.eq(1).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(2).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(3).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(4).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(5).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(6).text()).to.be.oneOf(syncFunctions);
    });
    cy.get(_.jsEditor._funcDropdown).click();
  }
});
