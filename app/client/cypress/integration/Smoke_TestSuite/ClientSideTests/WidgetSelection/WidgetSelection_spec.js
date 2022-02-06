const dsl = require("../../../../fixtures/widgetSelection.json");

describe("Widget Selection", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Multi Select widgets using cmd + click", function() {
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
});
