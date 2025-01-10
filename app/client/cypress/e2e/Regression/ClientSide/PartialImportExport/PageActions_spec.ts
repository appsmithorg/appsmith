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

describe("Check Page Actions Menu", {}, function () {
  it("1. Verify Page Actions when a page is selected", function () {
    homePage.RenameApplication("PageActions");
    PageList.AddNewPage("New blank page");
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 500, 100);
    PageList.ShowList();
    agHelper.GetNClick(entityExplorer._contextMenu("Page2"), 0, true);
    agHelper.GetNClick(locators._contextMenuItem("Rename"));
    agHelper.TypeText(propPane._placeholderName, `NewPage{enter}`, {
      parseSpecialCharSeq: true,
    });

    PageList.ClonePage("NewPage");
    PageList.HidePage("NewPage Copy");
    PageList.ShowList();
    agHelper.AssertAttribute(
      locators._entityTestId("NewPage Copy"),
      "disabled",
      "disabled",
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
    PageList.ShowList();
    agHelper.GetNClick(entityExplorer._contextMenu("NewPage"), 0, true);
    agHelper.GetNClick(locators._contextMenuItem("Rename"));
    agHelper.TypeText(propPane._placeholderName, `Page2{enter}`, {
      parseSpecialCharSeq: true,
    });

    PageList.ClonePage("Page2");
    EditorNavigation.NavigateToPage("Page1", true);
    PageList.HidePage("Page2 Copy");
    PageList.ShowList();
    agHelper.AssertAttribute(
      locators._entityTestId("Page2 Copy"),
      "disabled",
      "disabled",
    );
    PageList.DeletePage("Page2 Copy");
    PageList.assertAbsence("Page2 Copy");
  });

  it("3. Verify Page Actions when a home page is selected", function () {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 500, 100);
    PageList.ShowList();
    agHelper.GetNClick(entityExplorer._contextMenu("Page1"), 0, true);
    agHelper.GetNClick(locators._contextMenuItem("Rename"));
    agHelper.TypeText(propPane._placeholderName, `HomePage{enter}`, {
      parseSpecialCharSeq: true,
    });

    PageList.ClonePage("HomePage");
    PageList.HidePage("HomePage Copy");
    PageList.ShowList();
    agHelper.AssertAttribute(
      locators._entityTestId("HomePage Copy"),
      "disabled",
      "disabled",
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
