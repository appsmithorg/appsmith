import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  homePage,
  agHelper,
  templates,
  entityExplorer,
  dataSources,
  gitSync,
} from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";
import {
  AppSidebar,
  AppSidebarButton,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

import PartialImportExportLocatores from "./PartialImportExportLocators";

const repoName = "PartialImportExportGitApp_Name";

describe(
  "Partial import functionality",
  { tags: ["@tag.ImportExport"] },
  () => {
    before(() => {
      featureFlagIntercept({
        release_show_partial_import_export_enabled: true,
      });
      gitSync.CreateNConnectToGit(repoName);
      agHelper.Sleep(2000);
    });

    beforeEach(() => {
      AppSidebar.navigate(AppSidebarButton.Editor);

      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page1",
        action: "Import",
        entityType: EntityItems.Page,
      });

      agHelper.AssertElementVisibility(
        PartialImportExportLocatores.import.importModal,
      );
    });

    it("1. Should import all the selected JsObjects", () => {
      importPartiallyExportedFile("JSExportedOnly.json", "Queries/JS", [
        "JSObject1",
      ]);
    });

    it("2. Should import all the selected queries", () => {
      importPartiallyExportedFile("QueriesExportedOnly.json", "Queries/JS", [
        "DeleteQuery",
        "InsertQuery",
        "SelectQuery",
        "UpdateQuery",
      ]);
    });

    it("3. Should import all the widgets", () => {
      importPartiallyExportedFile("WidgetsExportedOnly.json", "Widgets", [
        "Alert_text",
        "Text16",
        "add_btn",
        "refresh_btn",
        "Text12",
        "Button1",
        "Delete_Button",
        "insert_form",
        "data_table",
      ]);
    });

    it("4. Should import all the selected datasources", () => {
      importPartiallyExportedFile("DatasourceExportedOnly.json", "Data", [
        "Users",
      ]);
    });

    it("5. Should import all the selected custom js libs", () => {
      importPartiallyExportedFile(
        "CustomJsLibsExportedOnly.json",
        "Libraries",
        ["jsonwebtoken"],
      );
    });
  },
);

function importPartiallyExportedFile(
  fileName: string,
  sectionTitle: string,
  elementsToCheck: string[],
) {
  cy.xpath(homePage._uploadFile).selectFile(
    `cypress/fixtures/PartialImportExport/${fileName}`,
    {
      force: true,
    },
  );
  agHelper.Sleep(3500);

  agHelper.CheckForErrorToast("Internal server error while processing request");
  agHelper.WaitUntilToastDisappear("Partial Application imported successfully");

  switch (sectionTitle) {
    case "Data":
      AppSidebar.navigate(AppSidebarButton.Data);
      elementsToCheck.forEach((dsName) => {
        agHelper.GetNAssertContains(dataSources._datasourceCard, dsName);
      });
      break;
    case "Libraries":
      AppSidebar.navigate(AppSidebarButton.Libraries);
      elementsToCheck.forEach((customJsLib) => {
        cy.contains(customJsLib);
      });
      break;
    default:
      PageLeftPane.expandCollapseItem(sectionTitle);
      elementsToCheck.forEach((element) => {
        PageLeftPane.assertPresence(element);
      });
  }
}
