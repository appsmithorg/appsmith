import * as _ from "../../../../support/Objects/ObjectsCore";

const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const themelocator = require("../../../../locators/ThemeLocators.json");
let themeBackgroudColor;

describe("Theme validation for default data", function () {
  it("1. Drag and drop form widget and validate Default color/font/shadow/border and list of font validation", function () {
    cy.log("Login Successful");
    cy.reload(); // To remove the rename tooltip
    cy.get(explorer.addWidget).click();
    cy.get(commonlocators.entityExplorersearch).should("be.visible");
    cy.get(commonlocators.entityExplorersearch).clear().type("form");
    cy.dragAndDropToCanvas("formwidget", { x: 300, y: 80 });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(3000);
    cy.get(themelocator.canvas).click({ force: true });
    cy.wait(2000);

    _.appSettings.OpenAppSettings();
    _.appSettings.GoToThemeSettings();
    //Border validation
    //cy.contains("Border").click({ force: true });
    _.theme.AssertBorderTypeCount(3);
    _.theme.AssertBorderPopoverText(0, "none", 1);
    _.theme.AssertBorderPopoverText(1, "M", 2);
    _.theme.AssertBorderPopoverText(2, "L", 3);
    cy.contains("Border").click({ force: true });

    //Shadow validation
    //cy.contains("Shadow").click({ force: true });
    cy.wait(2000);
    _.theme.AssertShadowPopoverText(0, "none", 1);
    _.theme.AssertShadowPopoverText(1, "S", 2);
    _.theme.AssertShadowPopoverText(2, "M", 3);
    _.theme.AssertShadowPopoverText(3, "L", 4);
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
    _.theme.ChooseColorType("Primary");
    _.agHelper.AssertElementValue(themelocator.inputColor, "#553DE9");
    _.agHelper.Sleep();
    _.theme.ChooseColorType("Background");
    _.agHelper.AssertElementValue(themelocator.inputColor, "#F8FAFC");
    _.agHelper.Sleep();
    _.appSettings.ClosePane();
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
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToThemeSettings();
    //Change the Theme
    cy.get(commonlocators.changeThemeBtn).click({ force: true });
    cy.get(".cursor-pointer:contains('Applied Theme')").click({ force: true });
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
