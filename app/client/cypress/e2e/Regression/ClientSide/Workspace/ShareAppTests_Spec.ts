import {
  agHelper,
  adminSettings,
  locators,
  deployMode,
  homePage,
  assertHelper,
  inviteModal,
} from "../../../../support/Objects/ObjectsCore";

import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
const appNavigationLocators = require("../../../../locators/AppNavigation.json");

describe(
  "Create new workspace and share with a user",
  { tags: ["@tag.Workspace", "@tag.Sanity"] },
  function () {
    let workspaceId: string, appid: string, currentUrl: any;

    it("1. Create workspace and then share with a user from Application share option within application", function () {
      homePage.NavigateToHome();
      if (CURRENT_REPO == REPO.EE) adminSettings.EnableGAC(false, true);

      agHelper.GenerateUUID();
      agHelper.GetElement("@guid").then((uid) => {
        workspaceId = "shareApp" + uid;
        appid = "Share" + uid;
        homePage.CreateNewWorkspace(workspaceId);
        homePage.CreateAppInWorkspace(workspaceId, appid);

        agHelper.GetNClick(inviteModal.locators._shareButton, 0, true);
        homePage.InviteUserToApplication(
          Cypress.env("TESTUSERNAME1"),
          "App Viewer",
        );
      });
    });

    it("2. login as Invited user and then validate viewer privilage", function () {
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      if (CURRENT_REPO == REPO.EE) adminSettings.EnableGAC(false, true, "home");

      homePage.SelectWorkspace(workspaceId);
      agHelper.GetNAssertContains(homePage._appContainer, workspaceId);
      if (CURRENT_REPO === REPO.CE) {
        agHelper.AssertElementVisibility(locators._buttonByText("Share"));
      }
      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementAbsence(homePage._appEditIcon);
      homePage.LaunchAppFromAppHover(locators._emptyPageTxt);
      agHelper.GetText(locators._emptyPageTxt).then((text) => {
        expect(text).to.equal("This page seems to be blank");
      });
    });

    it("3. Enable public access to Application", function () {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      homePage.FilterApplication(appid);
      homePage.EditAppFromAppHover();
      agHelper.AssertElementAbsence(locators._loading);
      assertHelper.AssertNetworkStatus("@getConsolidatedData");
      agHelper.GetNClick(inviteModal.locators._shareButton, 0, true);
      agHelper.GetNClick(homePage._sharePublicToggle, 0, true);
      agHelper.GetNClick(locators._dialogCloseButton, 0, true);
      deployMode.DeployApp();
      cy.url().then((url) => {
        currentUrl = url;
        cy.log(currentUrl);
      });
    });

    it("4. Open the app without login and validate public access of Application", function () {
      agHelper.VisitNAssert(currentUrl, "@getConsolidatedData");
      agHelper.GetText(locators._emptyPageTxt).then((text) => {
        expect(text).to.equal("This page seems to be blank");
      });
      // comment toggle should not exist for anonymous users
      agHelper.AssertElementAbsence(homePage._modeSwitchToggle);
      agHelper.GetNClick(
        `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
      );
      agHelper.ClickButton("Copy application url");
    });

    it("5. login as uninvited user and then validate public access of Application", function () {
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME2"),
        Cypress.env("TESTPASSWORD2"),
      );
      agHelper.VisitNAssert(currentUrl, "@getConsolidatedData");
      agHelper.GetText(locators._emptyPageTxt).then((text) => {
        expect(text).to.equal("This page seems to be blank");
      });
      agHelper.GetNClick(
        `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
      );
      agHelper.ClickButton("Copy application url");
    });

    it("6. login as Owner and disable public access", function () {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      homePage.FilterApplication(appid);
      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementExist(homePage._appEditIcon);
      agHelper.GetNClick(homePage._appEditIcon, 0, true);
      agHelper.AssertElementAbsence(locators._loading);
      assertHelper.AssertNetworkStatus("@getConsolidatedData", 200, true);
      agHelper.GetNClick(inviteModal.locators._shareButton, 0, true);
      agHelper.GetNClick(homePage._sharePublicToggle, 0, true);
      agHelper.GetNClick(locators._dialogCloseButton, 0, true);
    });

    it("7. login as uninvited user, validate public access disable feature ", function () {
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME2"),
        Cypress.env("TESTPASSWORD2"),
      );
      agHelper.VisitNAssert(currentUrl);
      cy.get(locators.errorPageTitle).should(($x) => {
        //for 404 screen
        expect($x).contain(Cypress.env("MESSAGES").PAGE_NOT_FOUND());
      });
      cy.get(locators.errorPageDescription).should(($x) => {
        //for 404 screen
        expect($x).contain(
          "Either this page doesn't exist, or you don't have access to this page",
        );
      });
      agHelper.ValidateToastMessage("Resource Not Found");
      homePage.LogOutviaAPI();
      // visit the app as anonymous user and validate redirection to login page
      agHelper.VisitNAssert(currentUrl);
      agHelper.AssertContains("Sign in to your account", "be.visible");
    });
  },
);
