/// <reference types="cypress-tags" />

import {
  agHelper,
  homePage,
  dataSources,
  entityExplorer,
  entityItems,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Query pane navigation",
  { tags: ["@tag.Datasource", " @tag.excludeForAirgap"] },
  () => {
    let ds1Name: string;
    let ds2Name: string;

    before("Add dsl and create datasource from the", () => {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        homePage.CreateNewWorkspace("Workspace" + uid, true);
        homePage.CreateAppInWorkspace("Workspace" + uid, "App" + uid);
      });
      dataSources.CreateDataSource("S3", true, false);
      cy.get("@dsName").then(($dsName) => {
        ds1Name = $dsName as unknown as string;
      });
      dataSources.CreateDataSource("Firestore", true, false);
      cy.get("@dsName").then(($dsName) => {
        ds2Name = $dsName as unknown as string;
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("1. Switching between S3 query and firestore query from the debugger", () => {
      entityExplorer.CreateNewDsQuery(ds1Name);
      agHelper.EnterValue("{{test}}", {
        propFieldName:
          ".t--actionConfiguration\\.formData\\.list\\.sortBy\\.data\\[0\\]\\.column",
        directInput: true,
        inputFieldName: "",
      });
      agHelper.UpdateCodeInput(
        ".t--actionConfiguration\\.formData\\.bucket\\.data",
        "test",
      );
      debuggerHelper.AssertErrorCount(1);

      cy.get("@dsName").then(($dsName) => {
        ds2Name = $dsName as unknown as string;
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
      entityExplorer.CreateNewDsQuery(ds2Name);
      agHelper.UpdateCodeInput(
        ".t--actionConfiguration\\.formData\\.limitDocuments\\.data",
        "{{test}}",
      );
      agHelper.UpdateCodeInput(
        ".t--actionConfiguration\\.formData\\.path\\.data",
        "test",
      );
      debuggerHelper.AssertErrorCount(2);

      debuggerHelper.OpenDebugger();
      agHelper.AssertElementVisibility(
        ".t--actionConfiguration\\.formData\\.limitDocuments\\.data",
      );

      debuggerHelper.ClicklogEntityLink(true);
      agHelper.AssertElementVisibility(
        ".t--actionConfiguration\\.formData\\.list\\.sortBy\\.data\\[0\\]\\.column",
      );

      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Query1",
        entityType: entityItems.Query,
      });
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Query2",
        entityType: entityItems.Query,
      });

      dataSources.DeleteDatasourceFromWithinDS(ds1Name);
      dataSources.DeleteDatasourceFromWithinDS(ds2Name);
    });
  },
);
