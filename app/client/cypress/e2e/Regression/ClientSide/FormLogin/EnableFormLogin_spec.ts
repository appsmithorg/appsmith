import adminSettings from "../../../../locators/AdminsSettings";
import homePage from "../../../../locators/HomePage";
import loginPage from "../../../../locators/LoginPage.json";
import {
  agHelper,
  adminSettings as objectsCoreAdminSettings,
} from "../../../../support/Objects/ObjectsCore";

describe("Form Login test functionality", function () {
  const toggleFormSignupLoginAndSave = (enable = true, type = "signup") => {
    const selector =
      type === "signup"
        ? adminSettings.formSignupDisabled
        : adminSettings.formLoginEnabled;
    agHelper.GetNClick(adminSettings.formloginButton);
    agHelper.WaitUntilEleAppear(selector);

    if (enable) {
      cy.get(selector).then(($el) => {
        if (!$el.prop("checked")) {
          agHelper.GetNClick(selector);
        }
      });
    } else {
      cy.get(selector).then(($el) => {
        if ($el.prop("checked")) {
          agHelper.GetNClick(selector);
        }
      });
    }

    agHelper.AssertElementVisibility(adminSettings.saveButton);
    agHelper.GetNClick(adminSettings.saveButton);
    agHelper.WaitUntilToastDisappear("Successfully saved");
  };

  const logoutFromApp = () => {
    agHelper.GetNClick(homePage.profileMenu);
    agHelper.GetNClick(homePage.signOutIcon);
  };

  const verifyFormLogin = (enable = true) => {
    agHelper.AssertElementVisibility(adminSettings.formloginButton);
    agHelper.AssertContains("Edit", "exist", adminSettings.formloginButton);
  };

  const fillSaveAndAssertGithubForm = () => {
    objectsCoreAdminSettings.FillAndSaveGithubForm();
    agHelper.WaitUntilEleAppear(adminSettings.restartNotice);
    agHelper.AssertElementAbsence(adminSettings.restartNotice, 200000);
  };

  const checkAndDisableGithub = () => {
    // Check if GitHub is connected and disconnect if needed
    agHelper.GetNClick(adminSettings.githubButton);
    cy.get("body").then(($body) => {
      if ($body.find(adminSettings.disconnectBtn).length > 0) {
        // GitHub is connected, need to disconnect
        agHelper.GetNClick(adminSettings.disconnectBtn);
        agHelper
          .GetElement(adminSettings.disconnectBtn)
          .should("contain.text", "Are you sure?");
        agHelper.GetNClick(adminSettings.disconnectBtn);
        agHelper.WaitUntilEleAppear(adminSettings.restartNotice);
        agHelper.AssertElementAbsence(adminSettings.restartNotice, 200000);
        agHelper.WaitForCondition(() =>
          agHelper.AssertContains("GitHub authentication", "exist"),
        );
      } else {
        // GitHub is already disconnected, go back to auth settings
        agHelper.GetNClick(adminSettings.authenticationTab);
      }
    });
  };

  before(function () {
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
      toggleFormSignupLoginAndSave(true, "signup");
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
      toggleFormSignupLoginAndSave(true, "login");
    }
    // Check and disable GitHub if connected
    objectsCoreAdminSettings.NavigateToAuthenticationSettings();
    checkAndDisableGithub();
  });

  it(
    "1. Go to admin settings and disable Form Signup",
    { tags: ["@tag.Authentication", "@tag.Settings"] },
    function () {
      objectsCoreAdminSettings.NavigateToAuthenticationSettings();
      verifyFormLogin();

      // disable form signup
      toggleFormSignupLoginAndSave(false, "signup");
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
        toggleFormSignupLoginAndSave(true, "signup");
        logoutFromApp();
      });
    },
  );

  it(
    "2. Go to admin settings and disable Form Login",
    { tags: ["@tag.excludeForAirgap"] },
    function () {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      agHelper.WaitForCondition(() =>
        agHelper.AssertContains("Workspaces", "exist"),
      );
      objectsCoreAdminSettings.NavigateToAuthenticationSettings();
      verifyFormLogin();

      // enable github login
      agHelper.GetNClick(adminSettings.githubButton);
      agHelper.WaitForCondition(() =>
        agHelper.AssertContains("GitHub authentication", "exist"),
      );
      fillSaveAndAssertGithubForm();

      // Disable form login
      objectsCoreAdminSettings.NavigateToAuthenticationSettings();
      verifyFormLogin();
      toggleFormSignupLoginAndSave(false, "login");
      logoutFromApp();

      // validate login is disabled
      agHelper.AssertElementAbsence("form");
      agHelper.AssertElementAbsence(loginPage.signupLink);

      // restore settings
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      agHelper.WaitForCondition(() =>
        agHelper.AssertContains("Workspaces", "exist"),
      );
      objectsCoreAdminSettings.NavigateToAuthenticationSettings();
      toggleFormSignupLoginAndSave(true, "login");
      objectsCoreAdminSettings.NavigateToAuthenticationSettings();
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
