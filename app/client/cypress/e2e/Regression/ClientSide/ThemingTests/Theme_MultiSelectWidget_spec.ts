import {
  entityExplorer,
  agHelper,
  appSettings,
  theme,
} from "../../../../support/Objects/ObjectsCore";

describe("Theme validation usecase for multi-select widget", function () {
  it("1. Drag and drop multi-select widget and navigate to Theme Settings", function () {
    entityExplorer.DragDropWidgetNVerify("multiselectwidgetv2", 300, 80);
    agHelper.GetNClick(theme.locators._canvas, 0, true, 0);
    agHelper.Sleep();
    appSettings.OpenAppSettings();
    appSettings.GoToThemeSettings();
  });
  it("2. validate Border type selection", function () {
    agHelper.AssertElementLength(theme.locators._border, 3);
    theme.AssertBorderPopoverText(0, "none", 1);
    theme.AssertBorderPopoverText(1, "M", 2);
    theme.AssertBorderPopoverText(2, "L", 3);
    theme.ToggleSection("Border");
  });
  it("3.validate Shadow type selection", function () {
    theme.AssertShadowPopoverText(0, "none", 1);
    theme.AssertShadowPopoverText(1, "S", 2);
    theme.AssertShadowPopoverText(2, "M", 3);
    theme.AssertShadowPopoverText(3, "L", 4);
    theme.ToggleSection("Shadow");
  });

  it.skip("4.validate Change theme color", function () {
    theme.ChangeThemeColor("purple", "Primary");
    agHelper.AssertText(theme.locators._inputColor, "val", "purple");
    agHelper.Sleep();
    theme.ChangeThemeColor("brown", "Background");
    agHelper.AssertText(theme.locators._inputColor, "val", "brown");
    agHelper.Sleep();
    agHelper.ContainsNClick("Color");
    appSettings.ClosePane();
  });
  it("5.validate applied theme", function () {
    agHelper.GetNClick(theme.locators._changeThemeBtn, 0, true);
    agHelper.GetNClick(theme.locators._appliedThemeSection);
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
