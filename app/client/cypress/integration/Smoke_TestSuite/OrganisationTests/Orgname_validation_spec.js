/// <reference types="Cypress" />

const homePage = require("../../../locators/HomePage.json");

describe("Org name validation spec", function() {
  it("create org with leading space validation", function() {
    cy.NavigateToHome();
    cy.get(homePage.createOrg)
      .should("be.visible")
      .first()
      .click({ force: true });
    cy.xpath(homePage.inputOrgName)
      .should("be.visible")
      .type(" ");
    cy.get(homePage.submit).should("be.disabled");
    cy.xpath(homePage.cancelBtn).click();
  });

  it("create org with special characters validation", function() {
    cy.get(homePage.createOrg)
      .should("be.visible")
      .first()
      .click({ force: true });
    cy.xpath(homePage.inputOrgName)
      .should("be.visible")
      .type("Test & Org");
    cy.get(homePage.submit).should("be.enabled");
    cy.xpath(homePage.cancelBtn).click();
  });
});
