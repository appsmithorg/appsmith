import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  deployMode,
  appSettings,
  theme,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const themelocator = require("../../../../locators/ThemeLocators.json");

let themeBackgroudColor;
let themeFont;

describe(
  "Theme validation usecases",
  { tags: ["@tag.Theme", "@tag.Git"] },
  function () {
    it("1. Drag and drop form widget and validate Default font and list of font validation", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.FORM);
      agHelper.GetNClick(locators._canvas);
      appSettings.OpenAppSettings();
      appSettings.GoToThemeSettings();
      //Border validation
      //cy.contains("Border").click({ force: true });
      cy.get(themelocator.border).should("have.length", "3");
      cy.borderMouseover(0, "none");
      cy.borderMouseover(1, "M");
      cy.borderMouseover(2, "L");
      cy.get(themelocator.border).eq(2).click({ force: true });
      cy.wait("@updateTheme").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.wait(2000);
      cy.contains("Border").click({ force: true });

      //Shadow validation
      //cy.contains("Shadow").click({ force: true });
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

            cy.contains("Font").click({ force: true });

            //Color
            //cy.contains("Color").click({ force: true });
            cy.wait(2000);
            cy.colorMouseover(0, "Primary color");
            cy.validateColor("Primary", "#553DE9");
            cy.colorMouseover(1, "Background color");
            cy.validateColor("Background", "#F8FAFC");

            cy.get(themelocator.inputColor).click({ force: true });
            cy.chooseColor(0, themelocator.greenColor);

            cy.get(themelocator.inputColor).should("have.value", "#15803d");
            cy.get(themelocator.inputColor).clear({ force: true });
            cy.wait(2000);
            theme.ChangeThemeColor(16, "Background");
            cy.get(themelocator.inputColor).should("have.value", "#86efac"); //Red
            cy.wait(2000);

            cy.get(themelocator.inputColor).eq(0).click({ force: true });
            cy.get(themelocator.inputColor).click({ force: true });
            cy.get('[data-testid="color-picker"]')
              .first()
              .click({ force: true });
            cy.get("[style='background-color: rgb(21, 128, 61);']")
              .last()
              .click();
            cy.wait(2000);
            cy.get(themelocator.inputColor).should("have.value", "#15803d");
            cy.get(themelocator.inputColor).clear({ force: true });
            cy.wait(2000);
            theme.ChangeThemeColor(9, "Primary");
            cy.get(themelocator.inputColor).should("have.value", "#7f1d1d"); //Black
            cy.wait(2000);
            cy.contains("Color").click({ force: true });
            appSettings.ClosePane();

            //Publish the App and validate Font across the app
            deployMode.DeployApp();
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
      deployMode.NavigateBacktoEditor();
    });

    it("2. Validate Default Theme change across application", function () {
      propPane.RenameWidget("Form1", "FormTest");
      propPane.MoveToTab("Style");
      cy.get(widgetsPage.backgroundcolorPickerNew)
        .first()
        .click({ force: true });
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
              appSettings.ClosePane();
            });
        });
    });

    it("3. Validate Theme change across application", function () {
      EditorNavigation.SelectEntityByName("FormTest", EntityType.Widget);
      propPane.MoveToTab("Style");
      cy.get(widgetsPage.backgroundcolorPickerNew)
        .first()
        .click({ force: true });
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
              appSettings.ClosePane();
            });
        });
      EditorNavigation.SelectEntityByName("FormTest", EntityType.Widget);
      propPane.MoveToTab("Style");
      cy.get(widgetsPage.backgroundcolorPickerNew)
        .first()
        .click({ force: true });
      cy.get("[style='background-color: rgb(126, 34, 206);']").first().click();
      cy.wait(2000);
      cy.get(formWidgetsPage.formD)
        .should("have.css", "background-color")
        .and("eq", "rgb(126, 34, 206)");

      //Publish the App and validate Theme across the app
      deployMode.DeployApp();
      //Bug Form backgroud colour reset in Publish mode
      cy.get(formWidgetsPage.formD)
        .should("have.css", "background-color")
        .and("eq", "rgb(126, 34, 206)");
    });
  },
);
