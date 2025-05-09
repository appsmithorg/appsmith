import {
  agHelper,
  dataSources,
  debuggerHelper,
  deployMode,
  homePage,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "JSObjects OnLoad Actions tests",
  {
    tags: [
      "@tag.PropertyPane",
      "@tag.JS",
      "@tag.ImportExport",
      "@tag.Binding",
      "@tag.Git",
    ],
  },
  function () {
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

    it("6. Tc #1910 - Verify that JSObject functions set to run on pageLoad are executed on page refresh", () => {
      homePage.CreateAppInWorkspace("JSOnLoadTest");
      jsEditor.CreateJSObject(
        `export default {
        astros: () => {
          return "test"	},
        city: () => {
          return "test2"
        }
      }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
        },
      );

      jsEditor.EnableDisableAsyncFuncSettings("astros", "On page load");

      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      agHelper.RefreshPage();

      debuggerHelper.OpenDebugger();
      debuggerHelper.ClickLogsTab();
      debuggerHelper.DebuggerLogsFilter("JSObject1.astros");
      debuggerHelper.DoesConsoleLogExist("Function executed");
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
  },
);
