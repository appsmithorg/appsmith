const commonlocators = require("../../../../locators/commonlocators.json");
const themelocator = require("../../../../locators/ThemeLocators.json");

import {
  agHelper,
  locators,
  entityExplorer,
  deployMode,
  appSettings,
  theme,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

let themeFont;
let themeColor;

describe(
  "Theme validation usecase for multi-select widget",
  { tags: ["@tag.Theme"] },
  function () {
    let themesSection = (sectionName, themeName) =>
      "//*[text()='" +
      sectionName +
      "']/following-sibling::div//*[text()='" +
      themeName +
      "']";
    let applyTheme = (sectionName, themeName) =>
      themesSection(sectionName, themeName) +
      "/parent::div/following-sibling::div[contains(@class, 't--theme-card')]//div[text()='Apply theme']";

    it("1. Drag and drop multi-select widget and validate Default font and list of font validation + Bug 15007", function () {
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.MULTISELECT,
        300,
        80,
      );
      agHelper.GetNClick(locators._canvas);
      appSettings.OpenAppSettings();
      appSettings.GoToThemeSettings();
      //Border validation
      //cy.contains("Border").click({ force: true });
      cy.get(themelocator.border).should("have.length", "3");
      cy.borderMouseover(0, "none");
      cy.borderMouseover(1, "M");
      cy.borderMouseover(2, "L");
      cy.get(themelocator.border).eq(1).click({ force: true });
      cy.wait("@updateTheme").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.wait(1000);
      cy.contains("Border").click({ force: true });

      //Shadow validation
      //cy.contains("Shadow").click({ force: true });
      cy.wait(2000);
      cy.xpath(theme.locators._boxShadow("L")).click({ force: true });
      cy.wait("@updateTheme").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.wait(1000);
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
          .eq(3)
          .then(($childElem) => {
            cy.get($childElem).click({ force: true });
            cy.get(".t--draggable-multiselectwidgetv2:contains('more')").should(
              "have.css",
              "font-family",
              `Inter, sans-serif`,
            );
            themeFont = `Inter, sans-serif`;
          });
      });
      cy.contains("Font").click({ force: true });
 
      appSettings.ClosePane();
    });

    //Skipping due to mentioned bug
    it("2. Publish the App and validate Font across the app", function () {
      deployMode.DeployApp();
      cy.get(".rc-select-selection-item > .rc-select-selection-item-content")
        .first()
        .should("have.css", "font-family", themeFont);
      cy.get(".rc-select-selection-item > .rc-select-selection-item-content")
        .last()
        .should("have.css", "font-family", themeFont);
      deployMode.NavigateBacktoEditor();
    });

    it("3. Apply theme and validate the color", function () {
      appSettings.OpenAppSettings();
      appSettings.GoToThemeSettings();
      cy.get(commonlocators.changeThemeBtn).click({ force: true });
      cy.xpath(applyTheme("Featured themes", "Sunrise"))
      .click({ force: true })
      .wait(1000);
      cy.contains("Applied theme")
      .click()
      .parent()
      .siblings()
      .find(".t--theme-card > main > section > div > main")
      .eq(0)
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        themeColor = backgroudColor;

        console.log({ backgroudColor })
        expect(backgroudColor).to.eq("rgb(239, 68, 68)");
      });

      deployMode.DeployApp();

      console.log({ themeColor })
      
      cy.get(".rc-select-selector").click({force: true});
      cy.get(".rc-select-item-option-selected .bp3-control-indicator")
        .first()
        .should("have.css", "background-color", "rgb(239, 68, 68)");
    });
  },
);
