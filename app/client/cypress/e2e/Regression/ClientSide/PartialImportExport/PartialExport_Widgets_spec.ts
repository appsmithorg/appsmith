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
  { tags: ["@tag.ImportExport", "@tag.Git"] },
  () => {
    before(() => {
      homePage.ImportApp(`PartialImportExport/${fixtureName}`);
      assertHelper.AssertNetworkStatus("@importNewApplication");
      partialImportExport.OpenExportModal();
    });

    it("1. Test to export a partial app, import it, and verify all the widgets and their properties", () => {
      //Export widgets selected
      partialImportExport.PartiallyExportFile(
        4,
        partialImportExport.locators.export.modelContents.widgetsSection,
        ["data_table", "Text16", "refresh_btn", "add_btn"],
      );

      //Add a new page
      PageList.AddNewPage();

      //Import the exported App
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialImportExportSampleApp.json",
        "Widgets",
        ["data_table", "Text16", "refresh_btn", "add_btn"],
        "downloads",
      );

      //Properties for each widget exported
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
