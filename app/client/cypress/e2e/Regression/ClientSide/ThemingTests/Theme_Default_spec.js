import {
  draggableWidgets,
  entityExplorer,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";

const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const themelocator = require("../../../../locators/ThemeLocators.json");
let themeBackgroudColor;

describe.skip("Theme validation for default data", function () {
  it("1. Drag and drop form widget and validate Default color/font/shadow/border and list of font validation", function () {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.FORM, 300, 80);
    agHelper.GetNClick(locators._canvas);
    appSettings.OpenAppSettings();
    appSettings.GoToThemeSettings();
    //Border validation
    agHelper.AssertElementLength(theme.locators._border, 3);
    theme.AssertBorderPopoverText(0, "none", 1);
    theme.AssertBorderPopoverText(1, "M", 2);
    theme.AssertBorderPopoverText(2, "L", 3);
    cy.contains("Border").click({ force: true });

    //Shadow validation
    //cy.contains("Shadow").click({ force: true });
    cy.wait(2000);
    theme.AssertShadowPopoverText(0, "none", 1);
    theme.AssertShadowPopoverText(1, "S", 2);
    theme.AssertShadowPopoverText(2, "M", 3);
    theme.AssertShadowPopoverText(3, "L", 4);
    cy.contains("Shadow").click({ force: true });

    //Font
    //cy.contains("Font").click({ force: true });
    // cy.get("span[name='expand-more']").then(($elem) => {
    //   cy.get($elem).click({ force: true });
    //   cy.wait(250);

    cy.get(themelocator.fontsSelected)
      //.eq(10)
      .should("have.text", "Nunito Sans");
    //});
    cy.contains("Font").click({ force: true });

    //Color
    //cy.contains("Color").click({ force: true });
    cy.wait(2000);
    theme.ChooseColorType("Primary");
    agHelper.AssertText(theme.locators._inputColor, "val", "#553DE9");
    agHelper.Sleep();
    theme.ChooseColorType("Background");
    agHelper.AssertText(theme.locators._inputColor, "val", "#F8FAFC");
    agHelper.Sleep();
    appSettings.ClosePane();
  });

  it("2. Validate Default Theme change across application", function () {
    cy.get(formWidgetsPage.formD).click();
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.moveToStyleTab();
    cy.get(widgetsPage.backgroundcolorPickerNew).first().click({ force: true });
    cy.get("[style='background-color: rgb(21, 128, 61);']").last().click();
    cy.wait(2000);
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", "rgb(21, 128, 61)");
    cy.get("#canvas-selection-0").click({ force: true });
    appSettings.OpenAppSettings();
    appSettings.GoToThemeSettings();
    //Change the Theme
    cy.get(commonlocators.changeThemeBtn).click({ force: true });
    cy.get(".cursor-pointer:contains('Applied theme')").click({ force: true });
    cy.get(".t--theme-card main > main")
      .first()
      .invoke("css", "background-color")
      .then((CurrentBackgroudColor) => {
        cy.get(".bp3-button:contains('Submit')")
          .last()
          .invoke("css", "background-color")
          .then((selectedBackgroudColor) => {
            expect(CurrentBackgroudColor).to.equal(selectedBackgroudColor);
            themeBackgroudColor = CurrentBackgroudColor;
          });
      });
  });
});
