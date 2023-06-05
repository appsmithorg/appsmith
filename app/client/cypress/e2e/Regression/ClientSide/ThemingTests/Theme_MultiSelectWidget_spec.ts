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
    _.theme.AssertBorderTypeCount(3);
    _.theme.AssertBorderPopoverText(0, "none", 1);
    _.theme.AssertBorderPopoverText(1, "M", 2);
    _.theme.AssertBorderPopoverText(2, "L", 3);
    _.theme.ToggleSection("Border");
  });
  it("3.validate Shadow type selection", function () {
    _.theme.AssertShadowPopoverText(0, "none", 1);
    _.theme.AssertShadowPopoverText(1, "S", 2);
    _.theme.AssertShadowPopoverText(2, "M", 3);
    _.theme.AssertShadowPopoverText(3, "L", 4);
    _.theme.ToggleSection("Shadow");
  });

  it.skip("4.validate Change theme color", function () {
    _.theme.ChangeThemeColor("purple", "Primary");
    _.agHelper.AssertText(_.theme.locators._inputColor, "val", "purple");
    _.agHelper.Sleep();
    _.theme.ChangeThemeColor("brown", "Background");
    _.agHelper.AssertText(_.theme.locators._inputColor, "val", "brown");
    _.agHelper.Sleep();
    _.agHelper.ContainsNClick("Color");
    _.appSettings.ClosePane();
  });
  it("5.validate applied theme", function () {
    _.agHelper.GetNClick(_.theme.locators._changeThemeBtn, 0, true);
    _.agHelper.ContainsNClick(_.theme.locators._appliedThemeSection);
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
