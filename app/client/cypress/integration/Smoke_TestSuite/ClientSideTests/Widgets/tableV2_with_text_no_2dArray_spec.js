const dsl = require("../../../../fixtures/tableV2WithTextWidgetDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Table widget v2 edge case scenario testing", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check if the selectedRowIndices does not contain 2d array", function() {
    cy.openPropertyPane("tablewidgetv2");

    //Enable Multi row select
    cy.get(widgetsPage.toggleEnableMultirowselection)
      .first()
      .click({ force: true });

    //Change the value of default selected row
    cy.updateCodeInput(".t--property-control-defaultselectedrows", "[1]");

    //Disable Multi row select
    cy.get(widgetsPage.toggleEnableMultirowselection)
      .first()
      .click({ force: true });

    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should("have.text", "[]");

    //Enable Multi row select
    cy.get(widgetsPage.toggleEnableMultirowselection)
      .first()
      .click({ force: true });

    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
      "have.text",
      "[  1]",
    );

    //Disable Multi row select
    cy.get(widgetsPage.toggleEnableMultirowselection)
      .first()
      .click({ force: true });

    //Enable Multi row select
    cy.get(widgetsPage.toggleEnableMultirowselection)
      .first()
      .click({ force: true });

    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
      "have.text",
      "[  1]",
    );
  });
});
