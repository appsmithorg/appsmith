/// <reference types="Cypress" />

const homePage = require("../../../../locators/HomePage.json");

describe("Leave organization test spec", function() {
  let newOrgId;
  let newOrganizationName;

  it("leave organization menu is visible validation", function() {
    cy.visit("/applications");
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      newOrganizationName = interception.response.body.data.name;
      newOrgId = interception.response.body.data.name;
      cy.visit("/applications");
      cy.openOrgOptionsPopup(newOrganizationName);
      cy.contains(Cypress.env("MESSAGES").ORGANIZATION_LEAVE_ORGANIZATION());
    });
  });

  it("Only admin user can not leave organization validation", function() {
    cy.visit("/applications");
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      newOrganizationName = interception.response.body.data.name;
      newOrgId = interception.response.body.data.name;
      cy.visit("/applications");
      cy.openOrgOptionsPopup(newOrganizationName);
      cy.contains(
        Cypress.env("MESSAGES").ORGANIZATION_LEAVE_ORGANIZATION(),
      ).click();
      cy.contains(Cypress.env("MESSAGES").ORGANIZATION_ARE_YOU_SURE()).click();
      cy.wait("@leaveOrgApiCall").then((httpResponse) => {
        expect(httpResponse.status).to.equal(400);
      });
      cy.contains(newOrganizationName);
    });
  });

  it("Non admin users can only access leave organization popup menu validation", function() {
    cy.visit("/applications");
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      newOrganizationName = interception.response.body.data.name;
      newOrgId = interception.response.body.data.name;
      cy.visit("/applications");
      cy.inviteUserForOrg(
        newOrganizationName,
        Cypress.env("TESTUSERNAME1"),
        homePage.viewerRole,
      );
      cy.LogOut();

      cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
      cy.visit("/applications");
      cy.openOrgOptionsPopup(newOrganizationName);
      cy.get(homePage.orgNamePopoverContent)
        .find("a")
        .should("have.length", 1)
        .first()
        .contains(Cypress.env("MESSAGES").ORGANIZATION_LEAVE_ORGANIZATION());
    });
  });
});
