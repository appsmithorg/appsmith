import {
  agHelper,
  apiPage,
  dataSources,
  deployMode,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";

let jsName: any;

describe(
  "JSObjects OnLoad Actions tests",
  { tags: ["@tag.PropertyPane", "@tag.JS"] },
  function () {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    it("1. Tc 60, 1912 - Verify JSObj calling API - OnPageLoad calls", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      agHelper.AddDsl(
        "JSApiOnLoadDsl",
        locators._widgetInCanvas("imagewidget"),
      );
      dataSources.CreateDataSource("Postgres");
      cy.fixture("datasources").then((datasourceFormData: any) => {
        AppSidebar.navigate(AppSidebarButton.Editor);
        apiPage.CreateAndFillApi(
          "http://host.docker.internal:5001",
          "AppsmithTed",
          30000,
        );
        apiPage.ToggleConfirmBeforeRunning(true);

        apiPage.CreateAndFillApi(
          datasourceFormData["randomTrumpApi"],
          "WhatTrumpThinks",
          30000,
        );
        apiPage.ToggleConfirmBeforeRunning(true);
      });
      jsEditor.CreateJSObject(
        `export default {
      callTrump: async () => {
        return WhatTrumpThinks.run()},
      callAppsmithTed: () => {
        return AppsmithTed.run()}
    }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
        },
      );

      cy.get("@jsObjName").then((jsObjName) => {
        jsName = jsObjName;
        EditorNavigation.SelectEntityByName(
          jsName as string,
          EntityType.JSObject,
        );
        jsEditor.EnableDisableAsyncFuncSettings("callAppsmithTed", false); //OnPageLoad made true once mapped with widget

        EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
        propPane.UpdatePropertyFieldValue(
          "Default value",
          "{{" + jsObjName + ".callAppsmithTed.data}}",
        );
        cy.get(locators._toastMsg)
          .children()
          .should("contain", "AppsmithTed")
          .and("contain", jsName as string)
          .and("contain", "will be executed automatically on page load");

        EditorNavigation.SelectEntityByName("Input2", EntityType.Widget);
        propPane.UpdatePropertyFieldValue(
          "Default value",
          "{{" + jsObjName + ".callTrump.data}}",
        );

        agHelper.AssertContains(
          (("[" + jsName) as string) +
            ".callTrump] will be executed automatically on page load",
          "be.visible",
          locators._toastMsg,
        );

        deployMode.DeployApp();

        agHelper.RefreshPage("getConsolidatedData");

        agHelper.Sleep(4000); //to let the api's call be finished & populate the text fields before validation!
        agHelper
          .GetText(locators._textAreainputWidgetv2InDeployed, "text", 1)
          .then(($quote: any) => cy.wrap($quote).should("not.be.empty"));

        agHelper
          .GetText(locators._textAreainputWidgetv2InDeployed)
          .then(($trump: any) => cy.wrap($trump).should("not.be.empty"));
      });
    });
  },
);
