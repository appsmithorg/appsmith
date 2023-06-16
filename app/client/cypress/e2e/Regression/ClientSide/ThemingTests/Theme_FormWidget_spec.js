import {
  agHelper,
  appSettings,
  theme,
} from "../../../../support/Objects/ObjectsCore";

const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const themelocator = require("../../../../locators/ThemeLocators.json");
let themeFont;

describe("Theme validation usecases", function () {
  it("1. Drag and drop form widget and validate Default font and list of font validation", function () {
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
    agHelper.AssertElementLength(theme.locators._border, 3);
    theme.AssertBorderPopoverText(0, "none", 1);
    theme.AssertBorderPopoverText(1, "M", 2);
    theme.AssertBorderPopoverText(2, "L", 3);
    agHelper.GetNClick(themelocator.border, 2, true);
    cy.wait("@updateTheme").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(2000);
    cy.contains("Border").click({ force: true });

    //Shadow validation
    //cy.contains("Shadow").click({ force: true });
    theme.AssertShadowPopoverText(0, "none", 1);
    theme.AssertShadowPopoverText(1, "S", 2);
    theme.AssertShadowPopoverText(2, "M", 3);
    theme.AssertShadowPopoverText(3, "L", 4);
    cy.xpath(theme.locators._boxShadow("L")).click({ force: true });
    cy.wait("@updateTheme").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(2000);
    cy.contains("Shadow").click({ force: true });

    //Font
    cy.xpath(
      "//p[text()='App font']/following-sibling::section//div//input",
    ).then(($elem) => {
      cy.get($elem).click({ force: true });
      cy.wait(250);
      cy.fixture("fontData").then(function (testdata) {
        this.testdata = testdata;
      });

      cy.get(themelocator.fontsSelected)
        //.eq(10)
        .should("contain.text", "Nunito Sans");

      cy.get(".rc-virtual-list .rc-select-item-option")
        .find(".leading-normal")
        .eq(2)
        .then(($childElem) => {
          cy.get($childElem).click({ force: true });
          cy.get(".t--draggable-buttonwidget button :contains('Sub')").should(
            "have.css",
            "font-family",
            `Poppins, sans-serif`,
          );
          //themeFont = `${$childElem.children().last().text()}, sans-serif`;
          themeFont = `Poppins, sans-serif`;
          agHelper.ContainsNClick("Font");
          agHelper.Sleep();
          theme.ChooseColorType("Primary");
          agHelper.AssertText(theme.locators._inputColor, "val", "#553DE9");
          agHelper.Sleep();
          theme.ChooseColorType("Background");
          agHelper.AssertText(theme.locators._inputColor, "val", "#F8FAFC");
          agHelper.Sleep();
          theme.ChangeThemeColor(3, "Background");
          agHelper.AssertText(theme.locators._inputColor, "val", "#d4d4d8");
          theme.ChangeThemeColor(3, "Primary");
          agHelper.AssertText(theme.locators._inputColor, "val", "#d4d4d8");
          agHelper.ContainsNClick("Color");
          appSettings.ClosePane();
          //Publish the App and validate Font across the app
          _.deployMode.DeployApp();
          cy.get(".bp3-button:contains('Sub')").should(
            "have.css",
            "font-family",
            themeFont,
          );
          cy.get(".bp3-button:contains('Reset')").should(
            "have.css",
            "font-family",
            themeFont,
          );
        });
    });
    _.deployMode.NavigateBacktoEditor();
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
    cy.get(themelocator.currentTheme).click({ force: true });
    cy.get(".t--theme-card main > main")
      .first()
      .invoke("css", "background-color")
      .then((CurrentBackgroudColor) => {
        cy.get(".bp3-button:contains('Sub')")
          .last()
          .invoke("css", "background-color")
          .then((selectedBackgroudColor) => {
            expect(CurrentBackgroudColor).to.equal(selectedBackgroudColor);
            themeBackgroudColor = CurrentBackgroudColor;
            _.appSettings.ClosePane();
          });
      });
  });

  it("3. Validate Theme change across application", function () {
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
    // select a theme
    cy.get(commonlocators.themeCard).last().click({ force: true });

    // check for alert
    cy.get(`${commonlocators.themeCard}`)
      .last()
      .siblings("div")
      .first()
      .invoke("text")
      .then((text) => {
        cy.get(commonlocators.toastmsg).contains(`Theme ${text} applied`);
      });
    cy.get(`${commonlocators.themeCard} > main`)
      .last()
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        cy.get(commonlocators.canvas).should(
          "have.css",
          "background-color",
          backgroudColor,
        );
      });
    cy.get(themelocator.currentTheme).click({ force: true });
    cy.get(".t--theme-card > main")
      .first()
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        cy.get(commonlocators.canvas).should(
          "have.css",
          "background-color",
          backgroudColor,
        );
      });
    cy.get(".t--theme-card main > main")
      .first()
      .invoke("css", "background-color")
      .then((CurrentBackgroudColor) => {
        cy.get(".t--theme-card main > main")
          .last()
          .invoke("css", "background-color")
          .then((selectedBackgroudColor) => {
            expect(CurrentBackgroudColor).to.equal(selectedBackgroudColor);
            themeBackgroudColor = CurrentBackgroudColor;
            _.appSettings.ClosePane();
          });
      });
    cy.get(formWidgetsPage.formD).click();
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.moveToStyleTab();
    cy.get(widgetsPage.backgroundcolorPickerNew).first().click({ force: true });
    cy.get("[style='background-color: rgb(126, 34, 206);']").first().click();
    cy.wait(2000);
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", "rgb(126, 34, 206)");

    //Publish the App and validate Theme across the app
    _.deployMode.DeployApp();
    //Bug Form backgroud colour reset in Publish mode
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", "rgb(126, 34, 206)");
  });
});
