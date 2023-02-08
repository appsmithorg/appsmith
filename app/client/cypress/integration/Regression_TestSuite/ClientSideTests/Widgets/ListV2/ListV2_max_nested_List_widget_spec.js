const dsl = require("../../../../../fixtures/Listv2/simpleLargeListv2.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

describe(" Nested List Widgets ", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  before(() => {
    cy.addDsl(dsl);
  });

  it("a. Pasting - should show toast when nesting is greater than 3", function() {
    cy.openPropertyPane("listwidgetv2");
    cy.get("body").type(`{${modifierKey}}{c}`);
    //Paste first List widget Level-2
    cy.get(`${widgetSelector("List1")} [type="CONTAINER_WIDGET"]`)
      .first()
      .type(`{${modifierKey}}{v}`);

    //Paste Second List widget Level-3
    cy.get(`${widgetSelector("List1Copy")} [type="CONTAINER_WIDGET"]`)
      .first()
      .type(`{${modifierKey}}{v}`);

    //Paste third List widget Level-4
    cy.get(`${widgetSelector("List1Copy1")} [type="CONTAINER_WIDGET"]`)
      .first()
      .type(`{${modifierKey}}{v}`);

    cy.validateToastMessage("Cannot have more than 3 levels of nesting");
    cy.get(`${widgetSelector("List1Copy1Copy")}`).should("not.exist");
  });
});
