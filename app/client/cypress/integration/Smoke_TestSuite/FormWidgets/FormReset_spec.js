const dsl = require("../../../fixtures/formResetDsl.json");
const widgetsPage = require("../../../locators/Widgets.json");

describe("Form reset functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Resets the form ", () => {
    cy.get(".tr")
      .eq(2)
      .click()
      .should("have.class", "selected-row");

    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", "lindsay.ferguson@reqres.in");

    cy.get(widgetsPage.formButtonWidget)
      .contains("Reset")
      .click();

    cy.wait(1000);

    cy.get(".tr")
      .eq(2)
      .should("not.have.class", "selected-row");

    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("not.contain", "lindsay.ferguson@reqres.in");
  });
});
