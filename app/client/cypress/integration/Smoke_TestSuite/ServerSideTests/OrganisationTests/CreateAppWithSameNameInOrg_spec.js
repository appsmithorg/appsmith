/// <reference types="Cypress" />

describe("Create org and a new app / delete and recreate app", function() {
  let orgid;
  let appid;

  it("create app within an org and delete and re-create another app with same name", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      appid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg(orgid);
      cy.CreateAppForOrg(orgid, appid);
      cy.DeleteAppByApi();
      cy.NavigateToHome();
      cy.CreateAppForOrg(orgid, appid);
    });
  });
});
