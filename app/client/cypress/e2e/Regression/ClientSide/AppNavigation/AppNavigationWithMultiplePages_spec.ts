import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  deployMode,
  appSettings,
  autoLayout,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";
let currentUrl: string;

describe("Page orientation and navigation related usecases ", function () {
  it("1. Change 'Orientation' to 'Side', sidebar should appear", () => {
    agHelper.GetNClick(appSettings.locators._appSettings);
    agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
    agHelper.GetNClick(
      appSettings.locators._navigationSettings._orientationOptions._side,
    );
    agHelper.GetNClickByContains(
      appSettings.locators._navigationMenuItem,
      "Page1",
    );
    agHelper.Sleep(3000); //wait a bit before proceeding, for CI!
    agHelper.AssertNetworkStatus("@getWorkspace");
  });

  it("2. Validate change with height width for fill widget - Input widget", function () {
    autoLayout.ConvertToAutoLayoutAndVerify(false);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 100, 200);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2);
    agHelper.Sleep();
    cy.url().then((url) => {
      currentUrl = url;
    });
    for (let i = 0; i < 25; i++) {
      entityExplorer.AddNewPage();
    }
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    //propPane.navigateToPage("Page1", "onClick");
    propPane.NavigateToPage("Page1", "onClick");
    //cy.navigateOnClick("Page1", "onClick");
    deployMode.DeployApp();
    agHelper.Sleep();
    agHelper.GetNClickByContains("button", "Submit");
    agHelper
      .GetElement(appSettings.locators._navigationMenuItem)
      .contains("Page1")
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .should("have.class", "is-active");
    deployMode.NavigateBacktoEditor();
  });

  it("3. Navigate to widget url and validate", () => {
    agHelper.VisitNAssert(currentUrl);
    agHelper.Sleep();
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
});
