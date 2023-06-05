import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Theme validation usecase for multi-select widget", function () {
  it("1. Drag and drop multi-select widget and navigate to Theme Settings", function () {
    _.entityExplorer.DragDropWidgetNVerify("multiselectwidgetv2", 300, 80);
    _.agHelper.GetNClick(_.theme.locators._canvas, 0, true, 0);
    _.agHelper.Sleep();
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToThemeSettings();
  });
  it("2. validate Border type selection", function () {
    _.theme.validateBorderTypeCount(3);
    _.theme.validateBorderPopoverText(0, "none");
    _.theme.validateBorderPopoverText(1, "M");
    _.theme.validateBorderPopoverText(2, "L");
    _.theme.toggleSection("Border");
  });
  it("3.validate Shadow type selection", function () {
    _.theme.validateShadowPopoverText(0, "none");
    _.theme.validateShadowPopoverText(1, "S");
    _.theme.validateShadowPopoverText(2, "M");
    _.theme.validateShadowPopoverText(3, "L");
    _.theme.toggleSection("Shadow");
  });

  it.skip("4.validate Change theme color", function () {
    _.theme.ChangeThemeColor("purple", "Primary");
    _.agHelper.AssertElementValue(_.theme.locators._inputColor, "purple");
    _.agHelper.Sleep();
    _.theme.ChangeThemeColor("brown", "Background");
    _.agHelper.AssertElementValue(_.theme.locators._inputColor, "brown");
    _.agHelper.Sleep();
    _.agHelper.ContainsNClick("Color");
    _.appSettings.ClosePane();
  });
  it("5.validate applied theme", function () {
    _.theme.clickOnChangeTheme();
    _.theme.clickOnAppliedTheme();
    cy.get(_.theme.locators._appliedThemecard)
      .first()
      .invoke("css", "background-color")
      .then(() => {
        cy.get(_.theme.locators._testWidgetMutliSelect)
          .last()
          .invoke("css", "background-color")
          .then((selectedBackgroudColor) => {
            expect("rgba(0, 0, 0, 0)").to.equal(selectedBackgroudColor);
          });
      });
    _.appSettings.ClosePane();
  });
});
