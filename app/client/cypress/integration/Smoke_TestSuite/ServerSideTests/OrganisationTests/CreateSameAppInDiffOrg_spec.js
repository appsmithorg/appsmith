/// <reference types="Cypress" />

describe("Create app same name in different org", function() {
  let orgid;
  let appid;
  let newOrganizationName;

  it("create app within a new org", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      appid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg();
      // stub the response and
      // find app name
      cy.wait("@createOrg").then((interception) => {
        newOrganizationName = interception.response.body.data.name;
        cy.renameOrg(newOrganizationName, orgid);
        cy.CreateAppForOrg(orgid, appid);
        cy.NavigateToHome();
        cy.LogOut();
      });
    });
  });

  it("create app with same name in a different org", function() {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    const newOrgName = orgid + "1";
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      console.log("createOrganization response: ", interception);
      newOrganizationName = interception.response.body.data.name;
      cy.renameOrg(newOrganizationName, newOrgName);
      cy.CreateAppForOrg(newOrgName, appid);
    });
  });
});
