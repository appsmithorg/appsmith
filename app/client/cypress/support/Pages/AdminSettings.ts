import { ObjectsRegistry } from "../Objects/Registry";
import { featureFlagIntercept } from "../Objects/FeatureFlags";

export class AdminSettings {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  public homePage = ObjectsRegistry.HomePage;
  public assertHelper = ObjectsRegistry.AssertHelper;

  public _adminSettingsBtn = ".admin-settings-menu-option";
  private _settingsList = ".t--settings-category-list";
  public _usersTab = ".t--settings-category-users";
  public _roles = (user: string) =>
    "//span[contains(text(), '" +
    user +
    "')]/parent::div/parent::span/parent::a/parent::td/following-sibling::td[1]";
  public _instanceName = '[name="instanceName"]';
  public rolesTab = ".t--settings-category-roles";

  public NavigateToAdminSettings(toNavigateToHome = true) {
    toNavigateToHome && this.homePage.NavigateToHome();
    this.agHelper.AssertElementVisibility(this._adminSettingsBtn);
    this.agHelper.GetNClick(this._adminSettingsBtn);
    this.assertHelper.AssertNetworkStatus("getEnvVariables");
    this.agHelper.AssertElementVisibility(this._settingsList);
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

  private enableGACFeatureFlag() {
    featureFlagIntercept({ license_gac_enabled: true });
  }
}
