import {
  agHelper,
  entityExplorer,
  homePage,
  partialImportExport,
  entityItems,
  locators,
  gitSync,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";
import { PageLeftPane } from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

const fixtureName = "ImportExport.json";

describe(
  "Partial import and export functionality",
  { tags: ["@tag.ImportExport", "@tag.Git"] },
  () => {
    before(() => {
      agHelper.GenerateUUID();
      partialImportExport.OpenImportModal();
      homePage.ImportApp(`PartialImportExport/${fixtureName}`, "", true);
      homePage.RenameApplication("ImportExport");
      entityExplorer.RenameEntityFromExplorer(
        "Page1",
        "Home",
        false,
        entityItems.Page,
      );
    });

    it("1. Should export all the selected elements and import it to new Page", () => {
      partialImportExport.OpenExportModal();

      // Export Widgets
      partialImportExport.PartiallyExportFile(
        4,
        partialImportExport.locators.export.modelContents.widgetsSection,
        ["Table1", "Button1"],
      );

      // Export Queries
      partialImportExport.OpenExportModal();
      partialImportExport.PartiallyExportFile(
        2,
        partialImportExport.locators.export.modelContents.queriesSection,
        ["Api1"],
      );

      PageList.AddNewPage("New blank page");
      partialImportExport.OpenImportModal();

      // Import Widgets
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialWidgetExport.json",
        "Widgets",
        ["Table1", "Button1"],
      );

      // Import Queries
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialQueryExport.json",
        "Queries",
        ["Api1"],
      );

      agHelper.selectAndValidateWidgetNameAndProperty({
        widgetName: "Table1",
        propFieldName: "Table data",
        valueToValidate: "{{Api1.data}}",
      });

      PageLeftPane.switchSegment("Queries");
      agHelper.GetNClick(locators._entityItem);
      apiPage.RunAPI();
      PageLeftPane.switchSegment("UI");
      agHelper.AssertElementExist(locators._rowData);
    });

    it("2. Should be able to import again in the same Page", () => {
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialWidgetExport.json",
        "Widgets",
        ["Table1", "Button1"],
      );

      agHelper.selectAndValidateWidgetNameAndProperty({
        widgetName: "Table1",
        propFieldName: "Table data",
        valueToValidate: "{{Api1.data}}",
      });

      agHelper.AssertElementLength(
        `${locators._widgetInDeployed("tablewidgetv2")}`,
        2,
      );
      agHelper.AssertElementLength(
        `${locators._widgetInDeployed("buttonwidget")}`,
        2,
      );
    });

    it("3. Should import the Page into new application", () => {
      homePage.NavigateToHome();
      homePage.CreateNewApplication();

      // Import Widgets
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialWidgetExport.json",
        "Widgets",
        ["Table1", "Button1"],
      );

      // Import Queries
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialQueryExport.json",
        "Queries",
        ["Api1"],
      );

      agHelper.selectAndValidateWidgetNameAndProperty({
        widgetName: "Table1",
        propFieldName: "Table data",
        valueToValidate: "{{Api1.data}}",
      });

      PageLeftPane.switchSegment("Queries");
      agHelper.GetNClick(locators._entityItem);
      apiPage.RunAPI();
      PageLeftPane.switchSegment("UI");
      agHelper.AssertElementExist(locators._rowData);
    });

    it("4. Should import the Page into new workspace", () => {
      homePage.CreateNewWorkspace("", true);

      homePage.CreateNewApplication();

      // Import Widgets
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialWidgetExport.json",
        "Widgets",
        ["Table1", "Button1"],
      );

      // Import Queries
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialQueryExport.json",
        "Queries",
        ["Api1"],
      );

      agHelper.selectAndValidateWidgetNameAndProperty({
        widgetName: "Table1",
        propFieldName: "Table data",
        valueToValidate: "{{Api1.data}}",
      });

      PageLeftPane.switchSegment("Queries");
      agHelper.GetNClick(locators._entityItem);
      apiPage.RunAPI();
      PageLeftPane.switchSegment("UI");
      agHelper.AssertElementExist(locators._rowData);
    });

    it("5. Import to Git branch", () => {
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      gitSync.CreateNConnectToGit();
      gitSync.CreateGitBranch("New_Branch");
      gitSync.CreateGitBranch();

      partialImportExport.OpenImportModal();

      // Import Widgets
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialWidgetExport.json",
        "Widgets",
        ["Table1", "Button1"],
      );

      // Import Queries
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialQueryExport.json",
        "Queries",
        ["Api1"],
      );

      agHelper.selectAndValidateWidgetNameAndProperty({
        widgetName: "Table1",
        propFieldName: "Table data",
        valueToValidate: "{{Api1.data}}",
      });

      gitSync.CommitAndPush();
      gitSync.SwitchGitBranch("New_Branch");

      // Import Widgets
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialWidgetExport.json",
        "Widgets",
        ["Table1", "Button1"],
      );

      // Import Queries
      partialImportExport.OpenImportModal();
      partialImportExport.ImportPartiallyExportedFile(
        "PartialQueryExport.json",
        "Queries",
        ["Api1"],
      );

      agHelper.selectAndValidateWidgetNameAndProperty({
        widgetName: "Table1",
        propFieldName: "Table data",
        valueToValidate: "{{Api1.data}}",
      });
    });
  },
);
