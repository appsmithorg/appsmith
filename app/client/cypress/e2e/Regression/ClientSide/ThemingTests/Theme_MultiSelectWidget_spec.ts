import commonlocators from "../../../../locators/commonlocators.json";
import themelocator from "../../../../locators/ThemeLocators.json";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import * as _ from "../../../../support/Objects/ObjectsCore";

let theme = ObjectsRegistry.ThemeSettings,
  propPane = ObjectsRegistry.PropertyPane,
  ee = ObjectsRegistry.EntityExplorer,
  appSettings = ObjectsRegistry.AppSettings;

describe("Theme validation usecase for multi-select widget", function () {
  it("1. Drag and drop multi-select widget and navigate to Theme Settings", function () {
    ee.DragDropWidgetNVerify("multiselectwidgetv2", 300, 80);
    _.agHelper.GetNClick(themelocator.canvas, 0, true, 0);
    _.agHelper.Sleep();
    appSettings.OpenAppSettings();
    appSettings.GoToThemeSettings();
  });
  it("2. validate Border type selection", function () {
    theme.validateBorderTypeCount(3);
    theme.validateBorderPopoverText(0, "none");
    theme.validateBorderPopoverText(1, "M");
    theme.validateBorderPopoverText(2, "L");
    theme.toggleSection("Border");
  });
  it("3.validate Shadow type selection", function () {
    theme.validateShadowPopoverText(0, "none");
    theme.validateShadowPopoverText(1, "S");
    theme.validateShadowPopoverText(2, "M");
    theme.validateShadowPopoverText(3, "L");
    theme.toggleSection("Shadow");
  });
  
  it.skip("4.validate Change theme color", function () {
    theme.ChangeThemeColor("purple", "Primary");
    _.agHelper.AssertElementValue(themelocator.inputColor, "purple");
    _.agHelper.Sleep();
    theme.ChangeThemeColor("brown", "Background");
    _.agHelper.AssertElementValue(themelocator.inputColor, "brown");
    _.agHelper.Sleep();
    _.agHelper.ContainsNClick("Color");
    appSettings.ClosePane();
  });
  it("5.validate applied theme", function () {
    theme.clickOnChangeTheme();
    theme.clickOnAppliedTheme();
    cy.get(theme.locators._appliedThemecard)
      .first()
      .invoke("css", "background-color")
      .then(() => {
        cy.get(theme.locators._testWidgetMutliSelect)
          .last()
          .invoke("css", "background-color")
          .then((selectedBackgroudColor) => {
            expect("rgba(0, 0, 0, 0)").to.equal(selectedBackgroudColor);
          });
      });
    appSettings.ClosePane();
  });
});
