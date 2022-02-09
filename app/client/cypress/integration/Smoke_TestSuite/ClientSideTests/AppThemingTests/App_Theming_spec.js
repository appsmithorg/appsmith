const commonlocators = require("../../../../locators/commonlocators.json");
const widgetLocators = require("../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/replay.json");

describe("App Theming funtionality", function() {
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
      .siblings("h3")
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
    cy.dragAndDropToCanvas("buttonwidget", { x: 200, y: 200 });
    cy.get("body").click();

    //Click the back button
    cy.get(commonlocators.selectThemeBackBtn).click({ force: true });

    //Click the border radius toggle
    cy.contains("Border Radius").click({ force: true });

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
        cy.PublishtheApp();
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "border-radius",
          borderRadius,
        );
      });
  });
});
