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
    });
    cy.LogOut();
  });

  it("login again and create app with same name in same org", function() {
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.CreateAppForOrg(orgid, appid);
    cy.get(homePage.searchInput).type(appid);
    cy.wait(2000);
    cy.get(homePage.appsContainer).contains(orgid);
    cy.xpath(homePage.ShareBtn).should("not.exist");
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.applicationCard)
      .last()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).should("not.exist");
    cy.LogOut();
  });
});
