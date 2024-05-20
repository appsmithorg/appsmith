import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  homePage,
  partialImportExport,
  assertHelper,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";
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

    it("1. Import Downloaded file and Verify all the widgets and its properties", () => {
      partialImportExport.PartiallyExportFile(
        4,
        partialImportExport.locators.export.modelContents.widgetsSection,
        ["data_table", "Text16", "refresh_btn", "add_btn"],
      );

      PageList.AddNewPage();
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialImportExportSampleApp.json",
        "Widgets",
        ["data_table", "Text16", "refresh_btn", "add_btn"],
        "downloads",
      );

      agHelper.selectAndValidateWidgetNameAndProperty({
        widgetName: "data_table",
        propFieldName: "Table data",
        valueToValidate: "{{SelectQuery.data}}",
      });

      agHelper.selectAndValidateWidgetNameAndProperty({
        widgetName: "Text16",
        propFieldName: "Text",
        valueToValidate: "public_users Data + {{JSObject1.addNumbers(3,7)}}",
      });

      agHelper.selectAndValidateWidgetNameAndProperty({
        widgetName: "refresh_btn",
        propFieldName: "onClick",
        valueToValidate: "{{SelectQuery.run()}}",
        toggleEle: "onClick",
      });

      agHelper.selectAndValidateWidgetNameAndProperty({
        widgetName: "add_btn",
        propFieldName: "onClick",
        valueToValidate: "{{showModal(Insert_Modal.name)}}",
        toggleEle: "onClick",
      });
    });
  },
);
