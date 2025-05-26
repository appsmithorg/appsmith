import adminSettings from "../../../../locators/AdminsSettings";
import homePage from "../../../../locators/HomePage";
import loginPage from "../../../../locators/LoginPage.json";
import {
  agHelper,
  adminSettings as objectsCoreAdminSettings,
} from "../../../../support/Objects/ObjectsCore";

describe("Form Login test functionality", function () {
  const logoutFromApp = () => {
    agHelper.GetNClick(homePage.profileMenu);
    agHelper.GetNClick(homePage.signOutIcon);
  };

  const verifyFormLogin = (enable = true) => {
    agHelper.AssertElementVisibility(adminSettings.formloginButton);
    agHelper.AssertContains("Edit", "exist", adminSettings.formloginButton);
  };

  after(function () {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    // Enable form signup if disabled
    objectsCoreAdminSettings.NavigateToAuthenticationSettings();
    agHelper.GetNClick(adminSettings.formloginButton);
    if (
      !agHelper.AssertElementEnabledDisabled(
        adminSettings.formSignupDisabled,
        undefined,
        false,
      )
    ) {
      objectsCoreAdminSettings.toggleFormSignupLoginAndSave(true, "signup");
    }

    // Enable form login if disabled
    objectsCoreAdminSettings.NavigateToAuthenticationSettings();
    agHelper.GetNClick(adminSettings.formloginButton);
    if (
      !agHelper.AssertElementEnabledDisabled(
        adminSettings.formLoginEnabled,
        undefined,
        false,
      )
    ) {
      objectsCoreAdminSettings.toggleFormSignupLoginAndSave(true, "login");
    }
    // Check and disable GitHub if connected
    objectsCoreAdminSettings.NavigateToAuthenticationSettings();
    objectsCoreAdminSettings.checkAndDisableGithub();
  });

  it(
    "1. Go to admin settings and disable Form Signup",
    { tags: ["@tag.Authentication", "@tag.Settings"] },
    function () {
      objectsCoreAdminSettings.NavigateToAuthenticationSettings();
      verifyFormLogin();

      // disable form signup
      objectsCoreAdminSettings.toggleFormSignupLoginAndSave(false, "signup");
      logoutFromApp();

      agHelper.GetNClick(loginPage.signupLink);
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        const email = uid.toString() + "@appsmith.com";
        const password = uid.toString();

        agHelper.TypeText("[type='email']", email);
        agHelper.TypeText("[type='password']", password);
        agHelper.GetNClick("[type='submit']");

        agHelper.AssertContains(
          "Signup is restricted on this instance of Appsmith",
          "exist",
          ".ads-v2-callout__children",
        );

        cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
        objectsCoreAdminSettings.NavigateToAuthenticationSettings();
        objectsCoreAdminSettings.toggleFormSignupLoginAndSave(true, "signup");
      });
    },
  );

  it(
    "2. Go to admin settings and disable Form Login",
    { tags: ["@tag.excludeForAirgap"] },
    function () {
      objectsCoreAdminSettings.NavigateToAuthenticationSettings();
      verifyFormLogin();

      // enable github login
      agHelper.GetNClick(adminSettings.githubButton);
      agHelper.WaitForCondition(() =>
        agHelper.AssertContains("GitHub authentication", "exist"),
      );
      objectsCoreAdminSettings.fillSaveAndAssertGithubForm();

      // Disable form login
      objectsCoreAdminSettings.NavigateToAuthenticationSettings();
      verifyFormLogin();
      objectsCoreAdminSettings.toggleFormSignupLoginAndSave(false, "login");
      logoutFromApp();

      // validate login is disabled
      agHelper.AssertElementAbsence("form");
      agHelper.AssertElementAbsence(loginPage.signupLink);

      // restore settings
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));

      agHelper.AssertElementVisibility(homePage.homeIcon);
      agHelper.GetNClick(homePage.homeIcon, 0, true, 2500);
      objectsCoreAdminSettings.NavigateToAuthenticationSettings(false);
      objectsCoreAdminSettings.toggleFormSignupLoginAndSave(true, "login");
      agHelper.AssertElementVisibility(homePage.homeIcon);
      agHelper.GetNClick(homePage.homeIcon, 0, true, 2500);
      objectsCoreAdminSettings.NavigateToAuthenticationSettings(false);
      agHelper.GetNClick(adminSettings.githubButton);
      agHelper.GetNClick(adminSettings.disconnectBtn);
      agHelper
        .GetElement(adminSettings.disconnectBtn)
        .should("contain.text", "Are you sure?");
      agHelper.GetNClick(adminSettings.disconnectBtn);
      agHelper.WaitUntilEleAppear(adminSettings.restartNotice);
      agHelper.AssertElementAbsence(adminSettings.restartNotice, 200000);
      logoutFromApp();
      agHelper.AssertElementAbsence(adminSettings.loginWithGithub);
      agHelper.AssertElementExist("form");
      agHelper.AssertElementExist(loginPage.signupLink);
    },
  );
});
