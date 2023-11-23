import {
  agHelper,
  locators,
  deployMode,
  homePage,
  assertHelper,
  inviteModal,
  onboarding,
} from "../../../../support/Objects/ObjectsCore";

import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
const appNavigationLocators = require("../../../../locators/AppNavigation.json");

describe("Create new workspace and share with a user", function () {
  let workspaceId: string, appid: string, currentUrl: any;

  it("1. Create workspace and then share with a user from Application share option within application", function () {
    homePage.NavigateToHome();
    agHelper.Sleep(2000);

    featureFlagIntercept({ license_gac_enabled: true });
    agHelper.Sleep(2000);

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
    homePage.LogOutviaAPI();
  });

  it("2. login as Invited user and then validate viewer privilage", function () {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "App Viewer",
    );
    featureFlagIntercept({ license_gac_enabled: true });
    agHelper.Sleep(3000);

    homePage.FilterApplication(appid, workspaceId, false);
    // // eslint-disable-next-line cypress/no-unnecessary-waiting
    agHelper.Sleep(2000);
    agHelper.GetNAssertContains(homePage._appContainer, workspaceId);
    if (CURRENT_REPO === REPO.CE) {
      agHelper.AssertElementVisibility(locators._buttonByText("Share"));
    }
    agHelper.GetElement(homePage._applicationCard).first().trigger("mouseover");
    agHelper.AssertElementAbsence(homePage._appEditIcon);
    homePage.LaunchAppFromAppHover();
    agHelper.Sleep(2000); //for CI
    agHelper.GetText(locators._emptyPageTxt).then((text) => {
      expect(text).to.equal("This page seems to be blank");
    });
    homePage.LogOutviaAPI();
    agHelper.Sleep(2000); //for CI
  });

  it("3. Enable public access to Application", function () {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid);
    agHelper.Sleep(2000);
    homePage.EditAppFromAppHover();
    agHelper.AssertElementAbsence(locators._loading);
    assertHelper.AssertNetworkStatus("@getPagesForCreateApp");
    agHelper.GetNClick(inviteModal.locators._shareButton, 0, true);
    agHelper.GetNClick(homePage._sharePublicToggle, 0, true);
    agHelper.Sleep(5000);
    agHelper.GetNClick(locators._dialogCloseButton, 0, true);
    deployMode.DeployApp();
    agHelper.Sleep(4000);
    currentUrl = cy.url();
    cy.url().then((url) => {
      currentUrl = url;
      cy.log(currentUrl);
    });
    deployMode.NavigateBacktoEditor();
    homePage.LogOutviaAPI();
  });

  it("4. Open the app without login and validate public access of Application", function () {
    agHelper.VisitNAssert(currentUrl, "@getPagesForViewApp");
    agHelper.Sleep(3000);
    agHelper.GetText(locators._emptyPageTxt).then((text) => {
      expect(text).to.equal("This page seems to be blank");
    });
    // comment toggle should not exist for anonymous users
    agHelper.AssertElementAbsence(homePage._modeSwitchToggle);
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    )
      .click()
      .wait(1000);
    agHelper.ClickButton("Copy application url");
  });

  it("5. login as uninvited user and then validate public access of Application", function () {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    agHelper.VisitNAssert(currentUrl, "@getPagesForViewApp");
    agHelper.GetText(locators._emptyPageTxt).then((text) => {
      expect(text).to.equal("This page seems to be blank");
    });
    cy.get(
      `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
    )
      .click()
      .wait(1000);
    agHelper.ClickButton("Copy application url");
    homePage.LogOutviaAPI();
  });

  it("6. login as Owner and disable public access", function () {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid);
    agHelper.Sleep(3000);
    agHelper.GetElement(homePage._applicationCard).first().trigger("mouseover");
    agHelper.Sleep(1000);
    agHelper.AssertElementExist(homePage._appEditIcon);
    agHelper.GetNClick(homePage._appEditIcon, 0, true);
    agHelper.AssertElementAbsence(locators._loading);
    agHelper.GetNClick(inviteModal.locators._shareButton, 0, true);
    agHelper.GetNClick(homePage._sharePublicToggle, 0, true);
    agHelper.GetNClick(locators._dialogCloseButton, 0, true);
    homePage.LogOutviaAPI();
  });

  it("7. login as uninvited user, validate public access disable feature ", function () {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    agHelper.Sleep(); //for CI
    agHelper.VisitNAssert(currentUrl);
    assertHelper.AssertNetworkStatus("@getPagesForViewApp", 404);
    homePage.LogOutviaAPI();
    // visit the app as anonymous user and validate redirection to login page
    agHelper.VisitNAssert(currentUrl);
    assertHelper.AssertNetworkStatus("@getPagesForViewApp", 404);
    agHelper.AssertContains("Sign in to your account", "be.visible");
  });

  it("8. Show partner program callout when invited user is from a different domain", function () {
    if (CURRENT_REPO === REPO.CE) {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        homePage.SignUp(`${uid}@appsmithtest.com`, uid as unknown as string);
        onboarding.closeIntroModal();

        inviteModal.OpenShareModal();
        homePage.InviteUserToApplication(`${uid}@appsmith.com`, "App Viewer");
      });
      agHelper.AssertElementVisibility(
        `[data-testid="partner-program-callout"]`,
      );

      homePage.Signout();
    }
  });
});
