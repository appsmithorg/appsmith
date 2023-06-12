/// <reference types="Cypress" />

import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
import homePage from "../../../../locators/HomePage";
const publish = require("../../../../locators/publishWidgetspage.json");

import {
  agHelper,
  deployMode,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

describe("Create new workspace and share with a user", function () {
  let workspaceId;
  let appid;
  let currentUrl;
  let newWorkspaceName;

  it("1. Create workspace and then share with a user from Application share option within application", function () {
    homePage.NavigateToHome();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceId = "shareApp" + uid;
      appid = "Share" + uid;
      homePage.CreateNewWorkspace(workspaceId);
      homePage.CreateAppInWorkspace(workspaceId, appid);

      cy.get("h2").contains("Drag and drop a widget here");
      cy.get(homePage.shareApp).click({ force: true });
      homePage.InviteUserToApplication(
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
      );
    });
    cy.LogOut();
  });

  it("2. login as Invited user and then validate viewer privilage", function () {
    cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.get(homePage.searchInput).type(appid, { force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.appsContainer).contains(workspaceId);
    if (CURRENT_REPO === REPO.CE) {
      cy.xpath(homePage.ShareBtn).first().should("be.visible");
    }
    cy.get(homePage.applicationCard).trigger("mouseover");
    cy.get(homePage.appEditIcon).should("not.exist");
    cy.launchApp(appid);
    cy.LogOut();
  });

  it("3. Enable public access to Application", function () {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.SearchApp(appid);
    cy.wait("@getPagesForCreateApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get("h2").contains("Drag and drop a widget here");
    cy.get(homePage.shareApp).click();
    cy.enablePublicAccess(true);
    deployMode.DeployApp();
    currentUrl = cy.url();
    cy.url().then((url) => {
      currentUrl = url;
      cy.log(currentUrl);
    });
    deployMode.NavigateBacktoEditor();
    cy.LogOut();
  });

  it("4. Open the app without login and validate public access of Application", function () {
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

  it("5. login as uninvited user and then validate public access of Application", function () {
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

  it("6. login as Owner and disable public access", function () {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.SearchApp(appid);
    cy.wait("@getPagesForCreateApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get("h2").contains("Drag and drop a widget here");
    cy.get(homePage.shareApp).click();
    cy.enablePublicAccess(true);
    cy.LogOut();
  });

  it("7. login as uninvited user, validate public access disable feature ", function () {
    cy.LoginFromAPI(Cypress.env("TESTUSERNAME2"), Cypress.env("TESTPASSWORD2"));
    cy.visit(currentUrl);
    cy.wait("@getPagesForViewApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      404,
    );
    cy.LogOut();

    // visit the app as anonymous user and validate redirection to login page
    cy.visit(currentUrl);
    cy.wait("@getPagesForViewApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      404,
    );
    cy.wait(2000);
    cy.contains("Sign in to your account").should("be.visible");
  });
});
