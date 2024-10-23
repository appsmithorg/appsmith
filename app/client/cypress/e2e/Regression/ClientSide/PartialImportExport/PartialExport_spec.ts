import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  homePage,
  partialImportExport,
} from "../../../../support/Objects/ObjectsCore";

const fixtureName = "PartialImportExportSampleApp.json";

describe(
  "Partial export functionality",
  { tags: ["@tag.ImportExport", "@tag.Git"] },
  () => {
    before(() => {
      agHelper.GenerateUUID();
      homePage.ImportApp(`PartialImportExport/${fixtureName}`);
    });

    beforeEach(() => {
      partialImportExport.OpenExportModal();
    });

    it("1. Should export all the selected JsObjects", () => {
      partialImportExport.ExportAndCompareDownloadedFile(
        "jsObjects",
        0,
        partialImportExport.locators.export.modelContents.jsObjectsSection,
        "JSExportedOnly.json",
        fixtureName,
      );
    });

    it("2. Should export all the selected datasources", () => {
      partialImportExport.ExportAndCompareDownloadedFile(
        "datasources",
        1,
        partialImportExport.locators.export.modelContents.datasourcesSection,
        "DatasourceExportedOnly.json",
        fixtureName,
      );
    });

    it("3. Should export all the selected queries", () => {
      partialImportExport.ExportAndCompareDownloadedFile(
        "queries",
        2,
        partialImportExport.locators.export.modelContents.queriesSection,
        "QueriesExportedOnly.json",
        fixtureName,
      );
    });

    it("4. Should export all the customjs libs", () => {
      partialImportExport.ExportAndCompareDownloadedFile(
        "customJSLibs",
        3,
        partialImportExport.locators.export.modelContents.customJSLibsSection,
        "CustomJsLibsExportedOnly.json",
        fixtureName,
      );
    });
  },
);
