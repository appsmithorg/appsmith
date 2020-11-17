/// <reference types="Cypress" />

const homePage = require("../../../locators/HomePage.json");

describe("Create new org and an app within the same", function() {
  let orgid;
  let appid;

  it("create org and then share with a user from UI", function() {
    cy.NavigateToHome();
    cy.generateUUID().then(uid => {
      orgid = uid;
      appid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg(orgid);
      cy.CreateAppForOrg(orgid, appid);
      cy.NavigateToHome();
      cy.get(homePage.searchInput).type(appid);
      cy.CreateAppForOrg(orgid, appid);
      cy.wait(2000);
      cy.get(homePage.appsContainer).contains(orgid);
      cy.get(homePage.applicationCard)
        .first()
        .trigger("mouseover");
      cy.get(homePage.appEditIcon).should("be.visible");
      cy.get(homePage.applicationCard)
        .last()
        .trigger("mouseover");
      cy.get(homePage.appEditIcon).should("be.visible");
    });
    cy.LogOut();
  });
});
