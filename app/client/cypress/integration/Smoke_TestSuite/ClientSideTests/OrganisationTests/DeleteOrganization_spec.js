/// <reference types="Cypress" />

const homePage = require("../../../../locators/HomePage.json");

describe("Delete organization test spec", function() {
  let newOrganizationName;

  it("should delete the organization", function() {
    cy.visit("/applications");
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      newOrganizationName = interception.response.body.data.name;
      cy.visit("/applications");
      cy.openOrgOptionsPopup(newOrganizationName);
      cy.contains("Delete Organization").click();
      cy.contains("Are you sure").click();
      cy.wait("@deleteOrgApiCall").then((httpResponse) => {
        expect(httpResponse.status).to.equal(200);
      });
      cy.get(newOrganizationName).should("not.exist");
    });
  });

  it("should show option to delete organization for an admin user", function() {
    cy.visit("/applications");
    cy.wait(2000);
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      newOrganizationName = interception.response.body.data.name;
      cy.visit("/applications");
      cy.openOrgOptionsPopup(newOrganizationName);
      cy.contains("Delete Organization");
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
        .contains("Delete Organization")
        .should("not.exist");
      cy.LogOut();
    });
  });
});
