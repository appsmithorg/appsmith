/// <reference types="Cypress" />

import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
import homePageLocators from "../../../../locators/HomePage";
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

      agHelper.GetNClick(homePageLocators.shareApp, 0, true);
      homePage.InviteUserToApplication(
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
      );
    });
    cy.LogOut();
  });

  it("2. login as Invited user and then validate viewer privilage", function () {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "App Viewer",
    );

    cy.get(homePageLocators.searchInput).type(appid, { force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePageLocators.appsContainer).contains(workspaceId);
    if (CURRENT_REPO === REPO.CE) {
      cy.xpath(homePageLocators.ShareBtn).first().should("be.visible");
    }
    cy.get(homePageLocators.applicationCard).trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).should("not.exist");
    cy.launchApp(appid);
    cy.wait(2000); //for CI
    cy.LogOut();
    cy.wait(2000); //for CI
  });

  it("3. Enable public access to Application", function () {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.SearchApp(appid);
    cy.wait("@getPagesForCreateApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    agHelper.GetNClick(homePageLocators.shareApp, 0, true);
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
    cy.visit(currentUrl, { timeout: 60000 });
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
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.visit(currentUrl, { timeout: 60000 });
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
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.SearchApp(appid);
    cy.wait("@getPagesForCreateApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    agHelper.GetNClick(homePageLocators.shareApp, 0, true);
    cy.enablePublicAccess(true);
    cy.LogOut();
  });

  it("7. login as uninvited user, validate public access disable feature ", function () {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.visit(currentUrl, { timeout: 60000 });
    cy.wait("@getPagesForViewApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      404,
    );
    cy.LogOut();

    // visit the app as anonymous user and validate redirection to login page
    cy.visit(currentUrl, { timeout: 60000 });
    cy.wait("@getPagesForViewApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      404,
    );
    cy.wait(2000);
    cy.contains("Sign in to your account").should("be.visible");
  });
});
