import { ObjectsRegistry } from "../Objects/Registry";

export class AdminSettings {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  public homePage = ObjectsRegistry.HomePage;
  public assertHelper = ObjectsRegistry.AssertHelper;

  public _adminSettingsBtn = '[data-testid="t--admin-settings-menu-option"]';
  private _settingsList = ".t--settings-category-list";
  public _usersTab = ".t--settings-category-users";
  public _roles = (user: string) =>
    "//span[contains(text(), '" +
    user +
    "')]/parent::div/parent::span/parent::a/parent::td/following-sibling::td[1]";
  public _instanceName = '[name="instanceName"]';

  public NavigateToAdminSettings() {
    this.homePage.NavigateToHome();
    this.agHelper.GetNClick(this._adminSettingsBtn);
    this.assertHelper.AssertNetworkStatus("getEnvVariables");
    this.agHelper.AssertElementVisibility(this._settingsList);
  }
}
