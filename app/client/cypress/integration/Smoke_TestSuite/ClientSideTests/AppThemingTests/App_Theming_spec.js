const commonlocators = require("../../../../locators/commonlocators.json");
const widgetLocators = require("../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/replay.json");

describe("App Theming funtionality", function() {
  /**
   * Test cases; Check:
   * 1. If theme can be changed*
   * 2. If the theme can edited*
   * 4. If the save theme can be used.
   * 5. If the theme can be deleled
   */
  before(() => {
    cy.addDsl(dsl);
  });

  it("checks if theme can be changed", function() {
    cy.get(commonlocators.changeThemeBtn).click({ force: true });

    // select a theme
    cy.get(commonlocators.themeCard)
      .last()
      .click({ force: true });

    // check for alert
    cy.get(`${commonlocators.themeCard}`)
      .last()
      .siblings("div")
      .first()
      .invoke("text")
      .then((text) => {
        cy.get(commonlocators.toastmsg).contains(`Theme ${text} Applied`);
      });

    // check if color of canvas is same as theme bg color
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
  });

  it("checks if theme can be edited", function() {
    // drop a button widget and click on body
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 80 });
    cy.wait(5000);
    cy.get("#canvas-selection-0").click({ force: true });

    //Click the back button
    //cy.get(commonlocators.selectThemeBackBtn).click({ force: true });

    //Click the border radius toggle

    // change app border radius
    cy.get(commonlocators.themeAppBorderRadiusBtn)
      .eq(1)
      .click({ force: true });

    // check if border radius is changed on button
    cy.get(`${commonlocators.themeAppBorderRadiusBtn} > div`)
      .eq(1)
      .invoke("css", "border-top-left-radius")
      .then((borderRadius) => {
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "border-radius",
          borderRadius,
        );

        // publish the app
        // cy.PublishtheApp();
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "border-radius",
          borderRadius,
        );
      });
    cy.contains("Border").click({ force: true });
    //Change the font

    cy.get("span[name='expand-more']").then(($elem) => {
      cy.get($elem).click({ force: true });
      cy.wait(250);
      cy.get(".ads-dropdown-options-wrapper div")
        .children()
        .eq(2)
        .then(($childElem) => {
          cy.get($childElem).click({ force: true });
          cy.get(widgetsPage.widgetBtn).should(
            "have.css",
            "font-family",
            $childElem
              .children()
              .last()
              .text(),
          );
        });
    });

    cy.contains("Font").click({ force: true });

    //Change the shadow
    cy.contains("App Box Shadow")
      .siblings("div")
      .children("span")
      .last()
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "box-shadow",
          $elem.css("box-shadow"),
        );
      });
    cy.contains("Shadow").click({ force: true });

    //Change the primary color:
    cy.get(".border-2")
      .first()
      .click({ force: true });
    cy.get(".t--colorpicker-v2-popover input").click({ force: true });
    cy.get(widgetsPage.colorPickerV2Color)
      .eq(-3)
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "background-color",
          $elem.css("background-color"),
        );
      });

    //Change the background color:
    cy.get(".border-2")
      .last()
      .click({ force: true });
    cy.get(".t--colorpicker-v2-popover input").click({ force: true });
    cy.get(widgetsPage.colorPickerV2Color)
      .first()
      .then(($elem) => {
        cy.get($elem).click({ force: true });
        cy.get(commonlocators.canvas).should(
          "have.css",
          "background-color",
          $elem.css("background-color"),
        );
      });
  });

  it("Checks if the theme can be saved", () => {
    //Click on dropDown elipses
    cy.get(".t--property-pane-sidebar .remixicon-icon")
      .first()
      .click({ force: true });
    // .then(($elem) => {
    //   cy.get(`${$elem} button`).click({ force: true });
    // })
    cy.wait(1000);

    //Click on save theme dropdown option
    cy.contains("Save theme").click({ force: true });

    cy.wait(200);

    //Type the name of the theme:
    cy.get("input[placeholder='My theme']").type("testtheme");

    //Click on save theme button
    cy.get("a[type='submit']").click({ force: true });

    cy.wait(200);

    //Click on change theme:
    cy.get(commonlocators.changeThemeBtn).click({ force: true });

    //Check if the saved theme is present under 'Yours Themes' section
    cy.contains("Your Themes")
      .siblings()
      .find(".t--theme-card")
      .parent()
      .should("contain.text", "testtheme");
  });

  it("Checks if the theme can be deleted", () => {
    cy.wait(300);

    //Check if the saved theme is present under 'Yours Themes' section
    cy.contains("Your Themes")
      .siblings()
      .find(".t--theme-card")
      .parent()
      .find("button")
      .click({ force: true });

    cy.contains("Delete").click({ force: true });

    //check for delete alert
    cy.wait(1000);
    cy.get(commonlocators.toastMsg).contains("Theme testtheme Deleted");
  });
});
