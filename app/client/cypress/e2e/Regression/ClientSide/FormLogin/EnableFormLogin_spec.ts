import adminSettings from "../../../../locators/AdminsSettings";
import loginPage from "../../../../locators/LoginPage.json";
import {
  agHelper,
  adminSettings as objectsCoreAdminSettings,
} from "../../../../support/Objects/ObjectsCore";

describe("Form Login test functionality", function () {
  it(
    "1. Go to admin settings and disable Form Signup",
    { tags: ["@tag.Authentication", "@tag.Settings"] },
    function () {
      objectsCoreAdminSettings.NavigateToAuthenticationSettings();
      objectsCoreAdminSettings.verifyFormLogin();

      // disable form signup
      objectsCoreAdminSettings.toggleFormSignupLoginAndSave(false, "signup");
      objectsCoreAdminSettings.logoutFromApp();

      agHelper.GetNClick(loginPage.signupLink);
      agHelper.GenerateUUID();
      agHelper.GetElement("@guid").then((uid) => {
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

        // Cleanup: Restore form signup to enabled state
        cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
        objectsCoreAdminSettings.NavigateToAuthenticationSettings();
        objectsCoreAdminSettings.toggleFormSignupLoginAndSave(true, "signup");
        objectsCoreAdminSettings.logoutFromApp();

        agHelper.GetNClick(loginPage.signupLink);
        agHelper.GenerateUUID();
        agHelper.GetElement("@guid").then((uid) => {
          const email = uid.toString() + "@appsmith.com";
          const password = uid.toString();

          agHelper.TypeText("[type='email']", email);
          agHelper.TypeText("[type='password']", password);
          agHelper.GetNClick("[type='submit']");

          agHelper.AssertElementAbsence(".ads-v2-callout__children");
        });
      });
    },
  );

  it(
    "2. Go to admin settings and disable Form Login",
    { tags: ["@tag.excludeForAirgap"] },
    function () {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      // agHelper.Sleep(10000);
      objectsCoreAdminSettings.NavigateToAuthenticationSettings(false);
      objectsCoreAdminSettings.verifyFormLogin();

      // enable github login
      agHelper.GetNClick(adminSettings.githubButton);
      agHelper.WaitForCondition(() =>
        agHelper.AssertContains("GitHub authentication", "exist"),
      );
      objectsCoreAdminSettings.fillSaveAndAssertGithubForm();

      // Disable form login
      objectsCoreAdminSettings.NavigateToAuthenticationSettings();
      objectsCoreAdminSettings.verifyFormLogin();
      objectsCoreAdminSettings.toggleFormSignupLoginAndSave(false, "login");
      objectsCoreAdminSettings.logoutFromApp();

      // validate login is disabled
      agHelper.AssertElementAbsence(loginPage.loginForm);
      agHelper.AssertElementAbsence(loginPage.signupLink);

      // restore settings
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));

      objectsCoreAdminSettings.NavigateToAuthenticationSettings(false);
      objectsCoreAdminSettings.toggleFormSignupLoginAndSave(true, "login");
      objectsCoreAdminSettings.NavigateToAuthenticationSettings(true);
      agHelper.GetNClick(adminSettings.githubButton);
      agHelper.GetNClick(adminSettings.disconnectBtn);
      agHelper
        .GetElement(adminSettings.disconnectBtn)
        .should("contain.text", "Are you sure?");
      agHelper.GetNClick(adminSettings.disconnectBtn);
      agHelper.WaitUntilEleAppear(adminSettings.restartNotice);
      agHelper.AssertElementAbsence(adminSettings.restartNotice, 200000);
      objectsCoreAdminSettings.logoutFromApp();
      agHelper.AssertElementAbsence(adminSettings.loginWithGithub);
      agHelper.AssertElementExist(loginPage.loginForm);
      agHelper.AssertElementExist(loginPage.signupLink);
    },
  );
});
