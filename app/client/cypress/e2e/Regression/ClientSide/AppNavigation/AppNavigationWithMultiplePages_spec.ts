import {
  agHelper,
  appSettings,
  autoLayout,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

let currentUrl: string;

describe(
  "Page orientation and navigation related usecases ",
  { tags: ["@tag.IDE", "@tag.Sanity", "@tag.PropertyPane"] },
  function () {
    it("1. Change 'Orientation' to 'Side', sidebar should appear", () => {
      AppSidebar.navigate(AppSidebarButton.Settings);
      agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
      agHelper.GetNClick(
        appSettings.locators._navigationSettings._orientationOptions._side,
      );
      agHelper.AssertElementExist(appSettings.locators._sideNavbar);
      agHelper.GetNClick(locators._canvas);
    });

    it("2. Validate change with height width for fill widget - Input widget", function () {
      autoLayout.ConvertToAutoLayoutAndVerify(false);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 100, 200);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2);
      cy.url().then((url) => {
        currentUrl = url;
      });
      for (let i = 0; i < 25; i++) {
        PageList.AddNewPage();
      }
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
      propPane.NavigateToPage("Page1", "onClick");
      deployMode.DeployApp();
      agHelper.WaitUntilEleAppear(locators._buttonByText("Submit"));
      agHelper.GetNClickByContains("button", "Submit");
      agHelper.AssertElementVisibility(
        appSettings.locators._getActivePage("Page1"),
      );
      deployMode.NavigateBacktoEditor();
    });

    it("3. Navigate to widget url and validate", () => {
      agHelper.VisitNAssert(currentUrl);
      agHelper.WaitUntilEleAppear(
        locators._widgetInCanvas(draggableWidgets.INPUT_V2),
      );
      agHelper.AssertElementExist(
        locators._widgetInCanvas(draggableWidgets.INPUT_V2),
      );
      agHelper.AssertElementExist(
        locators._widgetInCanvas(draggableWidgets.INPUT_V2),
        1,
      );
      agHelper.AssertAttribute(
        locators._widgetInCanvas(draggableWidgets.INPUT_V2),
        "data-testid",
        "t--selected",
        1,
      );
    });
  },
);
