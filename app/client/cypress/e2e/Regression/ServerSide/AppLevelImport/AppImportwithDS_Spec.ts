import {
  agHelper,
  appSettings,
  homePage,
  dataSources,
  jsEditor,
  deployMode,
  locators,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "App level import with Datasource",
  { tags: ["@tag.ImportExport", "@tag.Git"] },
  () => {
    //this tests coveres Applevel import for MySql, Gsheet is covered in Gsheet folder
    it("1. Bug #26024 - Import an app at App Level with Datasource - MySql", () => {
      appSettings.OpenAppSettings();
      appSettings.GoToImport();
      agHelper.ClickButton("Import");
      homePage.ImportApp(
        "ImportApps/JSOnLoadImport.json",
        "JSOnLoadTest",
        true,
      );
      cy.wait("@importNewApplication").then(() => {
        agHelper.Sleep();
        dataSources.ReconnectSingleDSNAssert("MySQL-Ds", "MySQL");
      });
      jsEditor.ConfirmationClick("Yes");
      agHelper.ClickButton("Got it");
      deployMode.DeployApp();
      jsEditor.ConfirmationClick("Yes");
      agHelper.AssertElementLength(
        locators._widgetInDeployed(draggableWidgets.IMAGE),
        10,
      );
    });
  },
);
