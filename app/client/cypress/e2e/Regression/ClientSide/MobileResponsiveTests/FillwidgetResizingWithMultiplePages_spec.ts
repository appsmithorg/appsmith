import commonlocators from "../../../../locators/commonlocators.json";
import appNavigationLocators from "../../../../locators/AppNavigation.json";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import * as _ from "../../../../support/Objects/ObjectsCore";
const deployMode = ObjectsRegistry.DeployMode;
let currentUrl: string | null = null;

describe("Validating Mobile Views for Fill Widget", function () {
  it("1. Change 'Orientation' to 'Side', sidebar should appear", () => {
    _.agHelper.GetNClick(appNavigationLocators.appSettingsButton);
    _.agHelper.GetNClick(appNavigationLocators.navigationSettingsTab);
    _.agHelper.GetNClick(
      appNavigationLocators.navigationSettings.orientationOptions.side,
    );
    _.agHelper.GetNClickByContains(
      appNavigationLocators.navigationMenuItem,
      "Page1",
    );
  });
  it("2. Validate change with height width for fill widget - Input widget", function () {
    _.agHelper.GetNClick(commonlocators.autoConvert);
    _.agHelper.GetNClick(commonlocators.convert);
    _.agHelper.GetNClick(commonlocators.refreshApp);
    _.entityExplorer.DragDropWidgetNVerify("inputwidgetv2", 100, 200);
    _.entityExplorer.DragDropWidgetNVerify("inputwidgetv2", 10, 20);
    _.agHelper.Sleep();
    cy.url().then((url) => {
      currentUrl = url;
    });
    for (let i = 0; i < 25; i++) {
      _.entityExplorer.AddNewPage();
    }
    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 10, 20);
    _.propPane.navigateToPage("Page1", "onClick");
    //cy.navigateOnClick("Page1", "onClick");
    deployMode.DeployApp();
    _.agHelper.Sleep();
    _.agHelper.GetNClickByContains("button", "Submit");
    cy.get(appNavigationLocators.navigationMenuItem)
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
