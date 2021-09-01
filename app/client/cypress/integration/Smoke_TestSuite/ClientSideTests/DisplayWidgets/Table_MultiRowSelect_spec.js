const widgetsPage = require("../../../../locators/Widgets.json");
const dsl = require("../../../../fixtures/tableNewDsl.json");

describe("Table Widget row multi select validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test multi select column shows when enableMultirowselection is true", function() {
    cy.openPropertyPane("tablewidget");
    cy.get(widgetsPage.toggleEnableMultirowselection)
      .first()
      .click({ force: true });
    cy.get(".t--table-multiselect-header")
      .first()
      .should("be.visible");

    cy.get(".t--table-multiselect")
      .first()
      .should("be.visible");
  });

  it("Test click on header cell selects all row", function() {
    // click on header check cell
    cy.get(".t--table-multiselect-header")
      .first()
      .click({ force: true });
    // check if rows selected
    cy.get(".tr").should("have.class", "selected-row");
  });

  it("Test click on single row cell changes header select cell state", function() {
    // un select all rows
    cy.get(".t--table-multiselect-header")
      .first()
      .click({ force: true });
    // click on first row select box
    cy.get(".t--table-multiselect")
      .first()
      .click({ force: true });
    // check if header cell is in half check state
    cy.get(".t--table-multiselect-header-half-check-svg")
      .first()
      .should("be.visible");
  });
});
