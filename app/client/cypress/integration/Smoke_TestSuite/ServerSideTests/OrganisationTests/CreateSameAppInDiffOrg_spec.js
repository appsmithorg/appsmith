/// <reference types="Cypress" />

describe("Create app same name in different org", function() {
  let orgid;
  let appid;

  it("create app within a new org", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      appid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg(orgid);
      cy.CreateAppForOrg(orgid, appid);
      cy.NavigateToHome();
      cy.LogOut();
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
    cy.reload();
    const newOrgName = orgid + "1";
    cy.createOrg(newOrgName);
    cy.CreateAppForOrg(newOrgName, appid);
  });
});
