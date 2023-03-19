const widgetsPage = require("../../../../../locators/Widgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

describe("List widget v2 Regression", () => {
  it("1. List widget V2 with invisible widgets", () => {
    cy.dragAndDropToCanvas("listwidgetv2", {
      x: 300,
      y: 300,
    });
    cy.openPropertyPaneByWidgetName("Text1", "textwidget");

    cy.get(widgetsPage.toggleVisible).click({ force: true });
    cy.testJsontext("visible", "false");
    cy.PublishtheApp();
    cy.get(`${widgetSelector("Text1")}`).should("not.exist");

    cy.get(`${widgetSelector("List1")} div[type="CONTAINER_WIDGET"]`).each(
      ($el) => {
        cy.wrap($el).click({ force: true });
        cy.wrap($el)
          .parent()
          .should("have.css", "outline", "rgb(59, 130, 246) solid 1px");
      },
    );
    cy.get(publishPage.backToEditor).click({ force: true });
  });
});
