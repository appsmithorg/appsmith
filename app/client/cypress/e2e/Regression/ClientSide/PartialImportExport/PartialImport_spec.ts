import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  homePage,
  agHelper,
  entityExplorer,
  dataSources,
  partialImportExport,
} from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";
import {
  AppSidebar,
  AppSidebarButton,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Partial import functionality",
  { tags: ["@tag.ImportExport"] },
  () => {
    before(() => {
      featureFlagIntercept({
        release_show_partial_import_export_enabled: true,
      });
    });

    beforeEach(() => {
      AppSidebar.navigate(AppSidebarButton.Editor);

      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page1",
        action: "Import",
        entityType: EntityItems.Page,
      });

      agHelper.AssertElementVisibility(
        partialImportExport.locators.import.importModal,
      );
    });

    it("1. Should import all the selected JsObjects", () => {
      partialImportExport.ImportPartiallyExportedFile(
        "JSExportedOnly.json",
        "Queries/JS",
        ["JSObject1"],
      );
    });

    it("2. Should import all the selected queries", () => {
      partialImportExport.ImportPartiallyExportedFile(
        "QueriesExportedOnly.json",
        "Queries/JS",
        ["DeleteQuery", "InsertQuery", "SelectQuery", "UpdateQuery"],
      );
    });

    it("3. Should import all the widgets", () => {
      partialImportExport.ImportPartiallyExportedFile(
        "WidgetsExportedOnly.json",
        "Widgets",
        [
          "Alert_text",
          "Text16",
          "add_btn",
          "refresh_btn",
          "Text12",
          "Button1",
          "Delete_Button",
          "insert_form",
          "data_table",
        ],
      );
    });

    it("4. Should import all the selected datasources", () => {
      partialImportExport.ImportPartiallyExportedFile(
        "DatasourceExportedOnly.json",
        "Data",
        ["Users"],
      );
    });

    it("5. Should import all the selected custom js libs", () => {
      partialImportExport.ImportPartiallyExportedFile(
        "CustomJsLibsExportedOnly.json",
        "Libraries",
        ["jsonwebtoken"],
      );
    });
  },
);
