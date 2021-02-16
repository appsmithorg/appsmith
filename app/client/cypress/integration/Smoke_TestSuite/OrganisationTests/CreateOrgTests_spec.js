/// <reference types="Cypress" />

const homePage = require("../../../locators/HomePage.json");

describe("Create new org and share with a user", function() {
  let orgid;
  let appid;

  it("create org and then share with a user from UI", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      appid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg(orgid);
      cy.CheckShareIcon(orgid, 1);
      cy.inviteUserForOrg(
        orgid,
        Cypress.env("TESTUSERNAME1"),
        homePage.viewerRole,
      );
      cy.CheckShareIcon(orgid, 2);
      cy.CreateAppForOrg(orgid, appid);
    });
    cy.LogOut();
  });

  it("login as invited user and then validate viewer privilage", function() {
    cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.get(homePage.searchInput).type(appid);
    cy.wait(2000);
    cy.get(homePage.appsContainer).contains(orgid);
    cy.xpath(homePage.ShareBtn)
      .first()
      .should("be.visible");
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).should("not.exist");
    cy.launchApp(appid);
    cy.LogOut();
  });

  it("login as Org owner and update the invited user role to developer", function() {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.searchInput).type(appid);
    cy.wait(2000);
    cy.deleteUserFromOrg(orgid, Cypress.env("TESTUSERNAME1"));
    cy.updateUserRoleForOrg(
      orgid,
      Cypress.env("TESTUSERNAME1"),
      homePage.developerRole,
    );
    cy.LogOut();
  });

  it("login as invited user and then validate developer privilage", function() {
    cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.get(homePage.searchInput).type(appid);
    cy.wait(2000);
    cy.get(homePage.appsContainer).contains(orgid);
    cy.xpath(homePage.ShareBtn)
      .first()
      .should("be.visible");
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon)
      .first()
      .click({ force: true });
    cy.get("#loading").should("not.exist");
    cy.LogOut();
  });

  it("login as Org owner and update the invited user role to administrator", function() {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.searchInput).type(appid);
    cy.wait(2000);
    cy.deleteUserFromOrg(orgid, Cypress.env("TESTUSERNAME1"));
    cy.updateUserRoleForOrg(
      orgid,
      Cypress.env("TESTUSERNAME1"),
      homePage.adminRole,
    );
    cy.LogOut();
  });

  it("login as invited user and then validate administrator privilage", function() {
    cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.get(homePage.searchInput).type(appid);
    cy.wait(2000);
    cy.get(homePage.appsContainer).contains(orgid);
    cy.inviteUserForOrg(
      orgid,
      Cypress.env("TESTUSERNAME2"),
      homePage.viewerRole,
    );
    cy.LogOut();
  });

  it("login as Org owner and delete App ", function() {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.searchInput).type(appid);
    cy.wait(2000);
    cy.navigateToOrgSettings(orgid);
    cy.get(homePage.emailList).then(function($list) {
      expect($list).to.have.length(3);
      expect($list.eq(0)).to.contain(Cypress.env("USERNAME"));
      expect($list.eq(1)).to.contain(Cypress.env("TESTUSERNAME1"));
      expect($list.eq(2)).to.contain(Cypress.env("TESTUSERNAME2"));
    });
    cy.xpath(homePage.appHome)
      .should("be.visible")
      .first()
      .click();
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.SearchApp(appid);
    cy.get("#loading").should("not.exist");
  });
});
