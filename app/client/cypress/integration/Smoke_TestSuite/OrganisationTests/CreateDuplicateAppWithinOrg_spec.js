/// <reference types="Cypress" />

describe("Create new org and an app within the same", function() {
  let orgid;
  let appid;

  it("create multiple apps and validate", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      appid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg(orgid);
      cy.CreateAppForOrg(orgid, appid);
      cy.NavigateToHome();

      cy.CreateApp(appid);
    });
  });
});
