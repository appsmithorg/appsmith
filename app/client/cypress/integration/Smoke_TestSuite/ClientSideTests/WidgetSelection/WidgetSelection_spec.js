const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/TextTabledsl.json");

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
    cy.get(`.t--widget-propertypane-toggle`).should("have.length", 2);
    cy.get(`#${dsl.dsl.children[2].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`.t--widget-propertypane-toggle`)
      .should("not.have.css", "background-color", "rgb(255, 224, 210)")
      .should("have.length", 3);
    cy.get(`#${dsl.dsl.children[1].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`.t--widget-propertypane-toggle`)
      .should("not.have.css", "background-color", "rgb(255, 224, 210)")
      .should("have.length", 2);
  });
});
