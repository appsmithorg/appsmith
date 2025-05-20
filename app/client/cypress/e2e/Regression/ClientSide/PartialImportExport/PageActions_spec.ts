import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  entityItems,
  homePage,
  locators,
  partialImportExport,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

describe("Check Page Actions Menu", { tags: ["@tag.IDE"] }, function () {
  it("1. Verify Page Actions when a page is selected", function () {
    homePage.RenameApplication("PageActions");
    PageList.AddNewPage("New blank page");
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 500, 100);
    entityExplorer.RenameEntityFromExplorer(
      "Page2",
      "NewPage",
      true,
      EntityItems.Page,
    );

    PageList.ClonePage("NewPage");
    PageList.HidePage("NewPage Copy");
    PageList.ShowList();
    agHelper.AssertAttribute(
      locators._entityTestId("NewPage Copy"),
      "data-subtle",
      "true",
    );
    PageList.DeletePage("NewPage Copy");
    PageList.assertAbsence("NewPage Copy");

    EditorNavigation.NavigateToPage("NewPage", true);

    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "NewPage",
      action: "Set as home page",
      entityType: entityItems.Page,
    });
    PageList.ShowList();
    agHelper.GetElement(locators._entityTestId("NewPage")).within(() => {
      agHelper.AssertElementExist(locators._homeIcon);
    });

    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Page1",
      action: "Set as home page",
      entityType: entityItems.Page,
    });
    PageList.ShowList();
    agHelper.GetElement(locators._entityTestId("Page1")).within(() => {
      agHelper.AssertElementExist(locators._homeIcon);
    });

    EditorNavigation.NavigateToPage("NewPage", true);
    partialImportExport.OpenExportModal("NewPage");
    partialImportExport.PartiallyExportFile(
      4,
      partialImportExport.locators.export.modelContents.widgetsSection,
      ["Text1"],
    );

    //Import the exported App
    partialImportExport.OpenImportModal("NewPage");
    partialImportExport.ImportPartiallyExportedFile(
      "PageActions.json",
      "Widgets",
      ["Text1"],
      "downloads",
    );
  });

  it("2. Verify Page Actions when a page is not selected", function () {
    EditorNavigation.NavigateToPage("Page1", true);
    entityExplorer.RenameEntityFromExplorer(
      "NewPage",
      "Page2",
      true,
      EntityItems.Page,
    );

    PageList.ClonePage("Page2");
    EditorNavigation.NavigateToPage("Page1", true);
    PageList.HidePage("Page2 Copy");
    PageList.ShowList();
    agHelper.AssertAttribute(
      locators._entityTestId("Page2 Copy"),
      "data-subtle",
      "true",
    );
    PageList.DeletePage("Page2 Copy");
    PageList.assertAbsence("Page2 Copy");
  });

  it("3. Verify Page Actions when a home page is selected", function () {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 500, 100);
    PageList.ShowList();
    entityExplorer.RenameEntityFromExplorer(
      "Page1",
      "HomePage",
      true,
      EntityItems.Page,
    );

    PageList.ClonePage("HomePage");
    PageList.HidePage("HomePage Copy");
    PageList.ShowList();
    agHelper.AssertAttribute(
      locators._entityTestId("HomePage Copy"),
      "data-subtle",
      "true",
    );
    PageList.DeletePage("HomePage Copy");
    PageList.assertAbsence("HomePage Copy");

    EditorNavigation.NavigateToPage("HomePage", true);
    partialImportExport.OpenExportModal("HomePage");
    partialImportExport.PartiallyExportFile(
      4,
      partialImportExport.locators.export.modelContents.widgetsSection,
      ["Text1"],
    );

    //Import the exported App
    partialImportExport.OpenImportModal("HomePage");
    partialImportExport.ImportPartiallyExportedFile(
      "PageActions.json",
      "Widgets",
      ["Text1"],
      "downloads",
    );
  });
});
