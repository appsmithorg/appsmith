const dsl = require("../../../../fixtures/widgetSelection.json");

describe("Widget Selection", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Multi Select widgets using cmd + click", function() {
    cy.get(`#${dsl.dsl.children[0].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`#${dsl.dsl.children[1].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
    cy.get(`#${dsl.dsl.children[2].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 3);
    cy.get(`#${dsl.dsl.children[0].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);

    cy.get(`.t--multi-selection-box`).should("have.length", 1);
  });

  it("2. Select widgets using cmd + click and open property pane by clicking on the widget from right side panel", function() {
    // Selection
    cy.get(`#${dsl.dsl.children[0].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`#${dsl.dsl.children[2].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
    cy.get(`.t--multi-selection-box`).should("have.length", 1);

    //select on one of the widgets from the right side panel
    cy.get(`.t-multi-widget-property-pane`).should("have.length", 1);
    cy.get(`#${dsl.dsl.children[2].widgetId}`).should("have.length", 1);
    cy.get(`#${dsl.dsl.children[2].widgetId}`).click({
      force: true,
    });

    //should open property pane
    cy.get(`.t--property-pane-view`).should("have.length", 1);
  });

  it("3. Should not select widgets if we hit CTRL + A on other Pages", function() {
    // Switch to the Explorer Pane
    cy.get("#switcher--explorer").click();
    // Click to create a New Data Source
    cy.get(".t--entity-add-btn")
      .eq(3)
      .click();
    // Hit CTRL +A
    cy.get("body").type("{ctrl}{a}");
    // Switch to the Canvas
    cy.get("#switcher--widgets").click();
    // Widgets should not be selected
    cy.get(".t--multi-selection-box").should("not.exist");
  });
});
