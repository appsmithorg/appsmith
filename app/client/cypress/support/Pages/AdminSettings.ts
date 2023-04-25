import { ObjectsRegistry } from "../Objects/Registry";

export class AdminSettings {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  public homePage = ObjectsRegistry.HomePage;

  private _adminSettingsBtn = '[data-testid="t--admin-settings-menu-option"]';
  private _settingsList = ".t--settings-category-list";
  public _usersTab = ".t--settings-category-users";
  public _roles = (user: string) =>
    "//span[contains(text(), '" +
    user +
    "')]/parent::div/parent::a/parent::td/following-sibling::td[1]";

  public NavigateToAdminSettings() {
    this.homePage.NavigateToHome();
    this.agHelper.GetNClick(this._adminSettingsBtn);
    this.agHelper.AssertElementVisible(this._settingsList);
  }
}
