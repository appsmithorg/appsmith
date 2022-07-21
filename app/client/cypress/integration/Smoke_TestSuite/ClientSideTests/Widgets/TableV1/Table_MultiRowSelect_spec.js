const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/tableNewDsl.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

describe("Table Widget row multi select validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Test multi select column shows when enable Multirowselection is true", function() {
    cy.openPropertyPane("tablewidget");
    cy.get(widgetsPage.toggleEnableMultirowselection)
      .first()
      .click({ force: true });
    cy.closePropertyPane("tablewidget");
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
  it("Test action configured on onRowSelected get triggered whenever a table row is selected", function() {
    cy.openPropertyPane("tablewidget");
    cy.onTableAction(0, "onrowselected", "Row Selected");
    // un select first row
    cy.get(".t--table-multiselect")
      .first()
      .click({ force: true });
    cy.get(commonlocators.toastmsg).should("not.exist");
    // click on first row select box
    cy.get(".t--table-multiselect")
      .first()
      .click({ force: true });
    cy.get(commonlocators.toastmsg).contains("Row Selected");
  });

  it("It should deselected default Selected Row when the header cell is clicked", () => {
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("defaultselectedrow", 0);

    // click on header check cell
    cy.get(".t--table-multiselect-header")
      .first()
      .click({
        force: true,
      });
    // check if rows selected
    cy.get(".tr").should("not.have.class", "selected-row");

    // click on header check cell
    cy.get(".t--table-multiselect-header")
      .first()
      .click({
        force: true,
      });
    // check if rows is not selected
    cy.get(".tr").should("have.class", "selected-row");
  });
});
