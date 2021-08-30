const dsl = require("../../../../fixtures/formResetDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Form reset functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Resets the form ", () => {
    cy.get(".tr")
      .eq(2)
      .click()
      .should("have.class", "selected-row");

    cy.get(".t--draggable-multiselectwidget").click({ force: true });
    cy.get(".t--draggable-multiselectwidget").type("Option");
    cy.dropdownMultiSelectDynamic("Option 1");
    cy.dropdownMultiSelectDynamic("Option 2");
    cy.dropdownMultiSelectDynamic("Option 3");

    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", "lindsay.ferguson@reqres.in");

    cy.get(widgetsPage.formButtonWidget)
      .contains("Reset")
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);

    cy.get(".tr")
      .eq(2)
      .should("not.have.class", "selected-row");

    cy.get(
      ".t-draggable-multiselectwidget .bp3-tag-input-values .bp3-tag",
    ).should(($span) => {
      expect($span).to.have.length(0);
    });

    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("not.contain", "lindsay.ferguson@reqres.in");
  });
});
