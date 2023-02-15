const dsl = require("../../../../../fixtures/Listv2/copy_paste_listv2_dsl.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

describe(" Nested List Widgets ", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  before(() => {
    cy.addDsl(dsl);
  });

  it("a. Pasting - should show toast when nesting is greater than 3", function() {
    cy.openPropertyPaneByWidgetName("List1", "listwidgetv2");
    // Copy List1
    cy.get(".t--copy-widget").click({ force: true });
    cy.wait(500);
    //Paste inside List 1
    cy.get(`${widgetSelector("List1")} [type="CONTAINER_WIDGET"]`)
      .first()
      .click({ force: true })
      .type(`{${modifierKey}}{v}`);
    cy.wait(500);

    //Copy List 2 and Paste inside list 2
    cy.openPropertyPaneByWidgetName("List2", "listwidgetv2");
    cy.get(".t--copy-widget").click({ force: true });
    cy.wait(500);
    // Paste inside list 2
    cy.get(`${widgetSelector("List2")} [type="CONTAINER_WIDGET"]`)
      .first()
      .click({ force: true })
      .type(`{${modifierKey}}{v}`);
    cy.wait(500);

    //Now Both List1 and List2 are n-2 levels

    //Copy List2 and Past in List 1
    cy.openPropertyPaneByWidgetName("List2", "listwidgetv2");
    cy.get(".t--copy-widget").click({ force: true });
    cy.wait(500);
    cy.get(`${widgetSelector("List1Copy")} [type="CONTAINER_WIDGET"]`)
      .first()
      .click({ force: true })
      .type(`{${modifierKey}}{v}`);

    cy.wait(500);
    cy.validateToastMessage("Cannot have more than 3 levels of nesting");
    cy.get(`${widgetSelector("List2Copy1")}`).should("not.exist");
  });
});
