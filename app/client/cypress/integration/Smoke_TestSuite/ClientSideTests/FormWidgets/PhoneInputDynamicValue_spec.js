const dynamicDSL = require("../../../../fixtures/PhoneInputDynamic.json");

describe("Phone input widget - ", () => {
  before(() => {
    cy.addDsl(dynamicDSL);
  });

  it("should check that widget can be used with dynamic default dial code", () => {
    cy.PublishtheApp();
    cy.get(".bp3-button.select-button").click({ force: true });
    cy.get(".menu-item-text")
      .first()
      .click({ force: true });
    cy.get(".t--input-country-code-change").should("contain", "+91");
    cy.get(".bp3-button.select-button").click({ force: true });
    cy.get(".menu-item-text")
      .last()
      .click({ force: true });
    cy.get(".t--input-country-code-change").should("contain", "+93");
  });
});
