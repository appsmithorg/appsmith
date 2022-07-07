const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Theme validation usecases", function() {
  it("Drag and drop button widget, change value and check reset flow", function() {
    // drop button widget
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    cy.get(".t--widget-buttonwidget").should("exist");

    // open property pane
    cy.openPropertyPane("buttonwidget");

    // change color to red
    cy.get(widgetsPage.buttonColor)
      .click({ force: true })
      .clear()
      .type("red");

    // click on canvas to see the theming pane
    cy.get("#canvas-selection-0").click({ force: true });

    // reset theme
    cy.contains("Theme Properties")
      .closest("div")
      .siblings()
      .first()
      .find("button")
      .click({ force: true });
    cy.contains("Reset widget styles").click({ force: true });

    cy.get(`${commonlocators.themeCard} > main > main`)
      .first()
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        cy.get(widgetsPage.widgetBtn).should(
          "have.css",
          "background-color",
          backgroudColor,
        );
      });
  });
});
