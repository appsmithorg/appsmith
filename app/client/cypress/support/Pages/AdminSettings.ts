import AdminsSettings from "../../locators/AdminsSettings";
import githubForm from "../../locators/GithubForm.json";
import HomePage from "../../locators/HomePage";
import { featureFlagIntercept } from "../Objects/FeatureFlags";
import { ObjectsRegistry } from "../Objects/Registry";

export class AdminSettings {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  public homePage = ObjectsRegistry.HomePage;
  public assertHelper = ObjectsRegistry.AssertHelper;

  public _adminSettingsBtn = ".admin-settings-menu-option";
  public _authenticationTab = ".t--settings-category-authentication";
  public _saveButton = ".t--admin-settings-save-button";
  private _settingsList = ".t--settings-category-list";
  public _usersTab = ".t--settings-category-users";
  public _roles = (user: string) =>
    "//span[contains(text(), '" +
    user +
    "')]/parent::div/parent::span/parent::a/parent::td/following-sibling::td[1]";
  public _instanceName = '[name="instanceName"]';
  public _googleMapsAPIField = '[name="googleMapsKey"]';
  public rolesTab = ".t--settings-category-roles";
  public auditLogsTab = ".t--settings-category-audit-logs";
  public routes = {
    APPLICATIONS: "/applications",
    SETTINGS: "/settings",
    PROFILE: "/settings/profile",
    GENERAL: "/settings/general",
    EMAIL: "/settings/email",
    USER_SETTINGS: "/settings/user-settings",
    INSTANCE_SETTINGS: "/settings/instance-settings",
    CONFIGURATION: "/settings/configuration",
    VERSION: "/settings/version",
    AUTHENTICATION: "/settings/authentication",
    GOOGLEAUTH: "/settings/authentication/google-auth",
    GITHUBAUTH: "/settings/authentication/github-auth",
    FORMLOGIN: "/settings/authentication/form-login",
    BRANDING: "/settings/branding",
    ACCESS_CONTROL: "/settings/access-control",
    AUDIT_LOGS: "/settings/audit-logs",
    PROVISIONING: "/settings/provisioning",
  };

  public NavigateToAdminSettings(toNavigateToHome = true) {
    toNavigateToHome && this.homePage.NavigateToHome();
    this.agHelper.AssertElementVisibility(this._adminSettingsBtn);
    this.agHelper.GetNClick(this._adminSettingsBtn);
    this.assertHelper.AssertNetworkStatus("getEnvVariables");
    this.agHelper.AssertElementVisibility(this._settingsList);
  }

  public NavigateToAuthenticationSettings(toNavigateToHome = true) {
    this.NavigateToAdminSettings(toNavigateToHome);
    this.agHelper.GetNClick(this._authenticationTab);
  }

  public FillAndSaveGithubForm() {
    this.agHelper.GetNClick(githubForm.githubClientId);
    this.agHelper.TypeText(
      githubForm.githubClientId,
      Cypress.env("APPSMITH_OAUTH2_GITHUB_CLIENT_ID"),
    );

    this.agHelper.GetNClick(githubForm.githubClientSecret);
    this.agHelper.TypeText(
      githubForm.githubClientSecret,
      Cypress.env("APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET"),
    );

    this.agHelper.GetNClick(githubForm.saveBtn);
  }

  public fillSaveAndAssertGithubForm() {
    this.FillAndSaveGithubForm();
    this.agHelper.WaitUntilEleAppear(AdminsSettings.restartNotice);
    this.agHelper.AssertElementAbsence(AdminsSettings.restartNotice, 200000);
  }

  public toggleFormSignupLoginAndSave(enable = true, type = "signup") {
    const selector =
      type === "signup"
        ? AdminsSettings.formSignupDisabled
        : AdminsSettings.formLoginEnabled;
    this.agHelper.GetNClick(AdminsSettings.formloginButton);
    this.agHelper.WaitUntilEleAppear(selector);

    if (enable) {
      this.agHelper.GetElement(selector).then(($el) => {
        if (!$el.prop("checked")) {
          this.agHelper.GetNClick(selector);
        }
      });
    } else {
      this.agHelper.GetElement(selector).then(($el) => {
        if ($el.prop("checked")) {
          this.agHelper.GetNClick(selector);
        }
      });
    }

    this.agHelper.AssertElementVisibility(AdminsSettings.saveButton);
    this.agHelper.GetNClick(AdminsSettings.saveButton);
    this.agHelper.WaitUntilToastDisappear("Successfully saved");
  }

  public EnableGAC(
    toNavigateToHome = true,
    toNavigateBackToHome = true,
    methodType: "adminSettings" | "home" = "adminSettings",
  ) {
    switch (methodType) {
      case "adminSettings":
        this.NavigateToAdminSettings(toNavigateToHome);
        this.enableGACFeatureFlag();
        this.assertHelper.AssertDocumentReady();
        this.agHelper.WaitUntilEleAppear(this.rolesTab);
        this.agHelper.AssertElementExist(this.rolesTab);
        this.agHelper.AssertElementVisibility(this.rolesTab);
        toNavigateBackToHome && this.homePage.NavigateToHome();
        break;
      case "home":
        toNavigateToHome && this.homePage.NavigateToHome();
        this.enableGACFeatureFlag();
        this.assertHelper.AssertDocumentReady();
        this.agHelper.AssertElementExist(this.homePage._homePageContainer);
        this.agHelper.AssertElementVisibility(this.homePage._homePageContainer);
        break;
      default:
        break;
    }
  }

  public logoutFromApp() {
    this.agHelper.GetNClick(HomePage.profileMenu);
    this.agHelper.GetNClick(HomePage.signOutIcon);
  }

  public verifyFormLogin() {
    this.agHelper.AssertElementVisibility(AdminsSettings.formloginButton);
    this.agHelper.AssertContains(
      "Edit",
      "exist",
      AdminsSettings.formloginButton,
    );
  }

  private enableGACFeatureFlag() {
    featureFlagIntercept({ license_gac_enabled: true });
  }
}
