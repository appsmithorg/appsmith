/// <reference types="Cypress" />

const homePage = require("../../../../locators/HomePage.json");

describe("Org name validation spec", function() {
  let orgid;
  let newOrganizationName;
  it("create org with leading space validation", function() {
    cy.NavigateToHome();
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      newOrganizationName = interception.response.body.data.name;
      cy.NavigateToHome();
      cy.contains(newOrganizationName)
        .closest(homePage.orgCompleteSection)
        .find(homePage.orgNamePopover)
        .find(homePage.optionsIcon)
        .click({ force: true });
      cy.get(homePage.renameOrgInput)
        .should("be.visible")
        .type(" ");
      cy.get(".error-message").should("be.visible");
    });
  });
  it("creates org and checks that orgname is editable", function() {
    cy.createOrg();
    cy.generateUUID().then((uid) => {
      orgid =
        "kadjhfkjadsjkfakjdscajdsnckjadsnckadsjcnanakdjsnckjdscnakjdscnnadjkncakjdsnckjadsnckajsdfkjadshfkjsdhfjkasdhfkjasdhfjkasdhjfasdjkfhjhdsfjhdsfjhadasdfasdfadsasdf" +
        uid;
      // create org with long name
      cy.createOrg();
      cy.wait("@createOrg").then((interception) => {
        newOrganizationName = interception.response.body.data.name;
        cy.renameOrg(newOrganizationName, orgid);
      });
    });
  });
  it("create org with special characters validation", function() {
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      newOrganizationName = interception.response.body.data.name;
      cy.renameOrg(newOrganizationName, "Test & Org");
    });
  });
});
