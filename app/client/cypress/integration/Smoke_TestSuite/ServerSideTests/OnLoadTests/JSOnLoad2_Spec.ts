import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let datasourceName: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  jsEditor = ObjectsRegistry.JSEditor,
  homePage = ObjectsRegistry.HomePage,
  deployMode = ObjectsRegistry.DeployMode;

describe("JSObjects OnLoad Actions tests", function() {
  before(() => {
    homePage.NavigateToHome();
    homePage.CreateNewWorkspace("JSOnLoadTest");
  });

  it("1. Tc #58 Verify JSOnPageload with ConfirmBefore calling - while imported", () => {
    homePage.ImportApp("ImportApps/JSOnLoadImport.json", "JSOnLoadTest");
    cy.wait("@importNewApplication").then(() => {
      agHelper.Sleep();
      dataSources.ReconnectDataSource("MySQL-Ds", "MySQL");
    });
    AssertJSOnPageLoad("runSpaceCraftImages", true);
  });

  it("2. Tc #58 Verify JSOnPageload with ConfirmBefore calling - while forked & duplicated", () => {
    homePage.NavigateToHome();
    homePage.ForkApplication("JSOnloadImportTest");
    AssertJSOnPageLoad("runSpaceCraftImages");

    homePage.NavigateToHome();
    homePage.DuplicateApplication("JSOnloadImportTest");
    AssertJSOnPageLoad("runSpaceCraftImages");
  });

  it("3. Tc #59 Verify JSOnPageload with ConfirmBefore calling - while imported - failing JSObj", () => {
    homePage.ImportApp("ImportApps/JSOnLoadFailureTest.json", "JSOnLoadTest");
    cy.wait("@importNewApplication").then(() => {
      homePage.AssertImportToast();
      AssertJSOnPageLoad(
        "runWorldCountries",
        false,
        "UncaughtPromiseRejection: getWorldCountries is not defined",
      );
    });
  });

  it("4. Tc #59 Verify JSOnPageload with ConfirmBefore calling - while forked & duplicated- failing JSObj", () => {
    homePage.NavigateToHome();
    homePage.ForkApplication("JSOnLoadFailureTest");
    AssertJSOnPageLoad(
      "runWorldCountries",
      false,
      "UncaughtPromiseRejection: getWorldCountries is not defined",
    );

    homePage.NavigateToHome();
    homePage.DuplicateApplication("JSOnLoadFailureTest");
    AssertJSOnPageLoad(
      "runWorldCountries",
      false,
      "UncaughtPromiseRejection: getWorldCountries is not defined",
    );
  });

  it("5. Delete the applications & workspace - Success/failing JSObj", () => {
    homePage.NavigateToHome();
    homePage.DeleteApplication("JSOnloadImportTest");
    homePage.DeleteApplication("JSOnloadImportTest (1)");
    homePage.DeleteApplication("JSOnloadImportTest Copy");
    homePage.DeleteApplication("JSOnLoadFailureTest");
    homePage.DeleteApplication("JSOnLoadFailureTest (1)");
    homePage.DeleteApplication("JSOnLoadFailureTest Copy");
    agHelper.WaitUntilToastDisappear("Deleting application...");
    //homePage.DeleteWorkspace("JSOnLoadTest");
  });

  it("6. Tc #1910 - Verify the Number of confirmation models of JS object on page load", () => {
    homePage.CreateAppInWorkspace("JSOnLoadTest");
    ee.DragDropWidgetNVerify("buttonwidget", 100, 100);
    ee.NavigateToSwitcher("explorer");
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then((dsName) => {
      datasourceName = dsName;
      dataSources.CreateNewQueryInDS(
        datasourceName,
        `SELECT * FROM public."astronauts" LIMIT 1;`,
        "getastronauts",
      );
      dataSources.CreateNewQueryInDS(
        datasourceName,
        `SELECT * FROM public."category" LIMIT 1;`,
        "getcategory",
      );
      dataSources.CreateNewQueryInDS(
        datasourceName,
        `SELECT * FROM public."city" LIMIT 1;`,
        "getcity",
      );
      dataSources.CreateNewQueryInDS(
        datasourceName,
        `SELECT * FROM public."film" LIMIT 1;`,
        "getfilm",
      );
      dataSources.CreateNewQueryInDS(
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
      agHelper.ClickButton("Yes");
      agHelper.Sleep(2000);
    }
    deployMode.NavigateBacktoEditor();
    for (let dialog = 1; dialog <= 5; dialog++) {
      agHelper.ClickButton("Yes");
      agHelper.Sleep(2000);
    }
  });

  // it("7. Tc #1645 + Bug 13197 Previously set async function made sync should not run on page", () => {
  // });

  function AssertJSOnPageLoad(
    jsMethod: string,
    shouldCheckImport = false,
    faliureMsg: string = "",
  ) {
    agHelper.AssertElementVisible(
      jsEditor._dialogBody("JSObject1." + jsMethod),
    );
    agHelper.ClickButton("No");
    agHelper.Sleep(1000);

    shouldCheckImport && homePage.AssertNCloseImport();

    deployMode.DeployApp();
    agHelper.AssertElementVisible(
      jsEditor._dialogBody("JSObject1." + jsMethod),
    );
    agHelper.ClickButton("Yes");
    if (faliureMsg) agHelper.ValidateToastMessage(faliureMsg);
    else agHelper.Sleep(3000);
    deployMode.NavigateBacktoEditor();
    agHelper.ClickButton("No");
    agHelper.Sleep(2000);
  }
});
