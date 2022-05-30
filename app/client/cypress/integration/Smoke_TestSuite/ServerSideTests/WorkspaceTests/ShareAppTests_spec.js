/// <reference types="Cypress" />

import homePage from "../../../../locators/HomePage";
const publish = require("../../../../locators/publishWidgetspage.json");

describe("Create new workspace and share with a user", function() {
  let workspaceId;
  let appid;
  let currentUrl;
  let newWorkspaceName;

  it("1. Create workspace and then share with a user from Application share option within application", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceId = uid;
      appid = uid;
      localStorage.setItem("WorkspaceName", workspaceId);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceId);
      });
      cy.CreateAppForWorkspace(workspaceId, appid);
      cy.wait("@getPagesForCreateApp").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get("h2").contains("Drag and drop a widget here");
      cy.get(homePage.shareApp).click({ force: true });
      cy.shareApp(Cypress.env("TESTUSERNAME1"), homePage.viewerRole);
    });
    cy.LogOut();
  });

  it("2. login as Invited user and then validate viewer privilage", function() {
    cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.get(homePage.searchInput).type(appid);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.appsContainer).contains(workspaceId);
    cy.xpath(homePage.ShareBtn)
      .first()
      .should("be.visible");
    cy.get(homePage.applicationCard).trigger("mouseover");
    cy.get(homePage.appEditIcon).should("not.exist");
    cy.launchApp(appid);
    cy.LogOut();
  });

  it("3. Enable public access to Application", function() {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.SearchApp(appid);
    cy.wait("@getPagesForCreateApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get("h2").contains("Drag and drop a widget here");
    cy.get(homePage.shareApp).click();
    cy.enablePublicAccess();
    cy.PublishtheApp();
    currentUrl = cy.url();
    cy.url().then((url) => {
      currentUrl = url;
      cy.log(currentUrl);
    });
    cy.get(publish.backToEditor).click();
    cy.LogOut();
  });

  it("4. Open the app without login and validate public access of Application", function() {
    cy.visit(currentUrl);
    cy.wait("@getPagesForViewApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(3000);
    cy.get(publish.pageInfo)
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.equal("This page seems to be blank");
      });
    // comment toggle should not exist for anonymous users
    cy.get(".t--comment-mode-switch-toggle").should("not.exist");
  });

  it("5. login as uninvited user and then validate public access of Application", function() {
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME2"), Cypress.env("TESTPASSWORD2"));
    cy.visit(currentUrl);
    cy.wait("@getPagesForViewApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(publish.pageInfo)
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.equal("This page seems to be blank");
      });
    cy.LogOut();
  });

  it("login as Owner and disable public access", function() {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.SearchApp(appid);
    cy.wait("@getPagesForCreateApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get("h2").contains("Drag and drop a widget here");
    cy.get(homePage.shareApp).click();
    cy.enablePublicAccess();
    cy.LogOut();
  });

  it("6. login as uninvited user and then validate public access disable feature", function() {
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME2"), Cypress.env("TESTPASSWORD2"));
    cy.visit(currentUrl);
    cy.wait("@getPagesForViewApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      404,
    );
    cy.LogOut();
  });

  it("7. visit the app as anonymous user and validate redirection to login page", function() {
    cy.visit(currentUrl);
    cy.wait("@getPagesForViewApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      404,
    );
    cy.contains("Sign in to your account").should("be.visible");
  });

  it("8. login as owner and delete App ", function() {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.SearchApp(appid);
    cy.get("#loading").should("not.exist");
  });
});
