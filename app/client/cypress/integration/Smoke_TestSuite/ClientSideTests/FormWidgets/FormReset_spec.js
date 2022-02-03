const dsl = require("../../../../fixtures/formResetDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Form reset functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Resets the form ", () => {
    // Select a row and verify
    cy.get(".tr")
      .eq(2)
      .click()
      .should("have.class", "selected-row");
    // Select three options
    cy.get(".t--draggable-multiselectwidgetv2").click({ force: true });
    cy.get(".t--draggable-multiselectwidgetv2").type("Option");
    cy.dropdownMultiSelectDynamic("Option 1");
    cy.dropdownMultiSelectDynamic("Option 2");
    cy.dropdownMultiSelectDynamic("Option 3");
    // Verify input should include the name "lindsay.ferguson@reqres.in"
    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", "lindsay.ferguson@reqres.in");
    // Reset the form
    cy.get(widgetsPage.formButtonWidget)
      .contains("Reset")
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    // verify table should not have selected row
    cy.get(".tr")
      .eq(2)
      .should("not.have.class", "selected-row");
    // Verify dropdown does not have selected values
    cy.get(".t-draggable-selectwidget .bp3-tag-input-values .bp3-tag").should(
      ($span) => {
        expect($span).to.have.length(0);
      },
    );
    // Verify input should not include "lindsay.ferguson@reqres.in"
    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("not.contain", "lindsay.ferguson@reqres.in");
  });
});
