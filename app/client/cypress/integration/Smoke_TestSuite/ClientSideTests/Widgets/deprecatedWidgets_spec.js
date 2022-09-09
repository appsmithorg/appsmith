const dsl = require("../../../../fixtures/deprecatedWidgets.json");

describe("Deprecation warning feature", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("should have deprecation warning on all the deprecated widgets", function() {
    cy.get(`#div-selection-0`).click({
      force: true,
    });

    for (const widgets of dsl.dsl.children) {
      cy.get(`#div-selection-0`).click({
        force: true,
      });

      cy.get(`#${widgets.widgetId}`).click({
        ctrlKey: true,
      });

      cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

      cy.get(`.t--deprecation-warning`).should("have.length", 1);
    }
  });
});
