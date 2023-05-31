import appNavigationLocators from "../../../../locators/AppNavigation.json";
import * as _ from "../../../../support/Objects/ObjectsCore";
let currentUrl: string | null = null;

describe("Page orientation and navigation related usecases ", function () {
  it("1. Change 'Orientation' to 'Side', sidebar should appear", () => {
    _.agHelper.GetNClick(_.appSettings.locators._appSettings);
    _.agHelper.GetNClick(_.appSettings.locators._navigationSettingsTab);
    _.agHelper.GetNClick(
      _.appSettings.locators._navigationSettings._orientationOptions._side,
    );
    _.agHelper.GetNClickByContains(
      _.appSettings.locators._navigationMenuItem,
      "Page1",
    );
  });
  it("2. Validate change with height width for fill widget - Input widget", function () {
    _.autoLayout.ConvertToAutoLayout();
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.INPUT_V2,
      100,
      200,
    );
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.INPUT_V2, 10, 20);
    _.agHelper.Sleep();
    cy.url().then((url) => {
      currentUrl = url;
    });
    for (let i = 0; i < 25; i++) {
      _.entityExplorer.AddNewPage();
    }
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 10, 20);
    //_.propPane.navigateToPage("Page1", "onClick");
    _.propPane.NavigateToPage("Page1","onClick");
    //cy.navigateOnClick("Page1", "onClick");
    _.deployMode.DeployApp();
    _.agHelper.Sleep();
    _.agHelper.GetNClickByContains("button", "Submit");
    _.agHelper
      .GetElement(_.appSettings.locators._navigationMenuItem)
      .contains("Page1")
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .should("have.class", "is-active");
    _.deployMode.NavigateBacktoEditor();
  });
  it("3. Navigate to widget url and validate", () => {
    if (currentUrl !== null) {
      _.agHelper.visitURL(currentUrl);
      _.agHelper.Sleep();
      _.agHelper.AssertElementExist(
        _.locators._widgetInCanvas("inputwidgetv2"),
      );
      _.agHelper.AssertElementExist(
        _.locators._widgetInCanvas("inputwidgetv2"),
        1,
      );
      _.agHelper.AssertAttribute(
        _.locators._widgetInCanvas("inputwidgetv2"),
        "data-testid",
        "t--selected",
      );
    } else {
      cy.log("URL is NULL check previous test");
    }
  });
});
