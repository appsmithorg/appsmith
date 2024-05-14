import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  homePage,
  partialImportExport,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

const fixtureName = "PartialImportExportSampleApp.json";

describe(
  "Partial export functionality",
  { tags: ["@tag.ImportExport"] },
  () => {
    before(() => {
      homePage.ImportApp(`PartialImportExport/${fixtureName}`);
      assertHelper.AssertNetworkStatus("@importNewApplication");
      featureFlagIntercept({
        release_show_partial_import_export_enabled: true,
      });
      partialImportExport.OpenExportModal();
    });

    it("1. Should export all the widgets", () => {
      partialImportExport.ExportAndCompareDownloadedFile(
        "widgets",
        4,
        partialImportExport.locators.export.modelContents.widgetsSection,
        "WidgetsExportedOnly.json",
        fixtureName,
      );
    });
  },
);
