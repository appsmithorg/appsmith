import adminSettingsLocators from "../../../../locators/AdminsSettings";
import {
  agHelper,
  adminSettings,
  homePage,
  locators,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "SSO with Github test functionality",
  { tags: ["@tag.Authentication", "@tag.excludeForAirgap"] },
  function () {
    it("1. Go to admin settings and enable Github with not all mandatory fields filled", function () {
      homePage.Signout();
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.NavigateToAdminSettings();
      // click authentication tab
      agHelper.GetNClick(adminSettingsLocators.authenticationTab);
      agHelper.AssertURL("/settings/authentication");
      assertHelper.AssertContains(
        "Enable",
        "be.visible",
        adminSettingsLocators.githubButton,
      );
      agHelper.GetNClick(adminSettingsLocators.githubButton);
      agHelper.Sleep(2000);
      // fill github form
      cy.fillGithubFormPartly();
      agHelper.AssertElementVisibility(locators._toastMsg);
      agHelper.AssertElementVisibility(
        locators._specificToast("Mandatory fields cannot be empty"),
      );
    });

    it("2. Go to admin settings and enable Github", function () {
      homePage.Signout();
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.NavigateToAdminSettings();
      // click authentication tab
      agHelper.GetNClick(adminSettingsLocators.authenticationTab);
      agHelper.AssertURL("/settings/authentication");
      assertHelper.AssertContains(
        "Enable",
        "be.visible",
        adminSettingsLocators.githubButton,
      );
      agHelper.GetNClick(adminSettingsLocators.githubButton);
      agHelper.Sleep(2000);
      // fill github form
      cy.fillGithubForm();
      agHelper.Sleep(2000);
      // assert server is restarting
      agHelper.AssertElementVisibility(adminSettingsLocators.restartNotice);
      // adding wait for server to restart
      cy.waitUntil(() =>
        cy
          .contains("GitHub authentication", { timeout: 180000 })
          .should("be.visible"),
      );
      cy.waitUntil(() =>
        agHelper.AssertElementVisibility(homePage._profileMenu),
      );
      homePage.Signout();
      // validating sso with github is enabled
      assertHelper.AssertContains(
        "Github",
        "be.visible",
        adminSettingsLocators.loginWithGithub,
      );
    });

    it("3. Go to admin settings and disable Github", function () {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.NavigateToAdminSettings();
      // click authentication tab
      agHelper.GetNClick(adminSettingsLocators.authenticationTab);
      agHelper.AssertURL("/settings/authentication");
      assertHelper.AssertContains(
        "Edit",
        "be.visible",
        adminSettingsLocators.githubButton,
      );
      agHelper.GetNClick(adminSettingsLocators.githubButton);
      agHelper.Sleep(2000);
      assertHelper.AssertContains(
        "Disconnect",
        "be.visible",
        adminSettingsLocators.disconnectBtn,
      );
      agHelper.GetNClick(adminSettingsLocators.disconnectBtn);
      assertHelper.AssertContains(
        "Are you sure?",
        "be.visible",
        adminSettingsLocators.disconnectBtn,
      );
      agHelper.GetNClick(adminSettingsLocators.disconnectBtn);

      // assert server is restarting
      agHelper.AssertElementVisibility(adminSettingsLocators.restartNotice);
      // adding wait for server to restart
      cy.waitUntil(() =>
        cy
          .contains("GitHub authentication", { timeout: 180000 })
          .should("be.visible"),
      );
      cy.waitUntil(() =>
        agHelper.AssertElementVisibility(homePage._profileMenu),
      );
      homePage.Signout();
      // validating sso with github is disabled
      assertHelper.AssertContains(
        "Github",
        "not.exist",
        adminSettingsLocators.loginWithGithub,
      );
    });
  },
);
