/// <reference types="Cypress" />

const homePage = require("../../../../locators/HomePage.json");

describe("Org name validation spec", function() {
  let orgid;
  it("creates org and checks that orgname is visible", function() {
    cy.NavigateToHome();
    cy.createOrg();
  });
  it("creates org and checks that orgname is editable", function() {
    cy.generateUUID().then((uid) => {
      orgid =
        "kadjhfkjadsjkfakjdscajdsnckjadsnckadsjcnanakdjsnckjdscnakjdscnnadjkncakjdsnckjadsnckajsdfkjadshfkjsdhfjkasdhfkjasdhfjkasdhjfasdjkfhjhdsfjhdsfjhadasdfasdfadsasdf" +
        uid;
      // create org with long name
      cy.createOrg();
      cy.renameRandomOrg(orgid);
    });
  });
  it("create org with special characters validation", function() {
    cy.createOrg();
    cy.renameRandomOrg("Test & Org");
  });
  it("creates org with leading space validation and ensures error", function() {
    cy.get(".t--org-name")
      .should("be.visible")
      .first()
      .click({ force: true });
    cy.get(".t--org-rename-input")
      .should("be.visible")
      .type(" ");
    cy.get(".error-message").should("be.visible");
  });
});
