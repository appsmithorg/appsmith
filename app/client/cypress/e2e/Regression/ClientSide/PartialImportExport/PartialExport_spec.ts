import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  homePage,
  agHelper,
  partialImportExport,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

let guid: any;
let workspaceName;
const fixtureName = "PartialImportExportSampleApp.json";

describe(
  "Partial export functionality",
  { tags: ["@tag.ImportExport"] },
  () => {
    before(() => {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        guid = uid;
        workspaceName = "workspaceName-" + guid;
        homePage.CreateNewWorkspace(workspaceName, true);
        homePage.ImportApp(`PartialImportExport/${fixtureName}`, workspaceName);
      });

      featureFlagIntercept({
        release_show_partial_import_export_enabled: true,
      });
    });

    beforeEach(() => {
      partialImportExport.OpenExportModal();
    });

    it("1. Should export all the selected JsObjects", () => {
      partialImportExport.ExportAndCompareDownloadedFile(
        0,
        partialImportExport.locators.export.modelContents.jsObjectsSection,
        "JSExportedOnly.json",
        fixtureName,
      );
    });

    it("2. Should export all the selected datasources", () => {
      partialImportExport.ExportAndCompareDownloadedFile(
        1,
        partialImportExport.locators.export.modelContents.datasourcesSection,
        "DatasourceExportedOnly.json",
        fixtureName,
      );
    });

    it("3. Should export all the selected queries", () => {
      partialImportExport.ExportAndCompareDownloadedFile(
        2,
        partialImportExport.locators.export.modelContents.queriesSection,
        "QueriesExportedOnly.json",
        fixtureName,
      );
    });

    it("4. Should export all the customjs libs", () => {
      partialImportExport.ExportAndCompareDownloadedFile(
        3,
        partialImportExport.locators.export.modelContents.customJSLibsSection,
        "CustomJsLibsExportedOnly.json",
        fixtureName,
      );
    });

    it("5. Should export all the widgets", () => {
      partialImportExport.ExportAndCompareDownloadedFile(
        4,
        partialImportExport.locators.export.modelContents.widgetsSection,
        "WidgetsExportedOnly.json",
        fixtureName,
      );
    });
  },
);
