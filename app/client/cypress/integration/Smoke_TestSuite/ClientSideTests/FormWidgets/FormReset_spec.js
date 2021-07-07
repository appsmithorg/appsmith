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

    cy.get(".t--draggable-dropdownwidget").click({ force: true });
    cy.get(".t--draggable-dropdownwidget").type("Option");
    cy.dropdownDynamic("Option 1");
    cy.dropdownDynamic("Option 2");
    cy.dropdownDynamic("Option 3");

    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", "lindsay.ferguson@reqres.in");

    cy.get(widgetsPage.formButtonWidget)
      .contains("Reset")
      .click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);

    cy.get(".tr")
      .eq(2)
      .should("not.have.class", "selected-row");

    cy.get(".t-draggable-dropdownwidget .bp3-tag-input-values .bp3-tag").should(
      ($span) => {
        expect($span).to.have.length(0);
      },
    );

    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("not.contain", "lindsay.ferguson@reqres.in");
  });
});
