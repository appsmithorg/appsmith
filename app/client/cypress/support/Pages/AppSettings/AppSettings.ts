import { ObjectsRegistry } from "../../Objects/Registry";
import { ThemeSettings } from "./ThemeSettings";
import { GeneralSettings } from "./GeneralSettings";
import { PageSettings } from "./PageSettings";

export class AppSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private commonLocators = ObjectsRegistry.CommonLocators;
  private locators = {
    _appSettings_cta: "#t--app-settings-cta",
    _closeSettings: "#t--close-app-settings-pane",
    _themeSettingsHeader: "#t--theme-settings-header",
    _generalSettingsHeader: "#t--general-settings-header",
    _getPageSettingsHeader: (pageName: string) =>
      `#t--page-settings-${pageName}`,
  };

  public readonly theme = new ThemeSettings();
  public readonly general = new GeneralSettings();
  public readonly page = new PageSettings();

  public openPaneFromCta() {
    this.agHelper.GetNClick(this.locators._appSettings_cta);
  }

  public closePane() {
    this.agHelper.GetNClick(this.locators._closeSettings);
  }

  public goToThemeSettings() {
    this.agHelper.GetNClick(this.locators._themeSettingsHeader);
  }

  public goToGeneralSettings() {
    this.agHelper.GetNClick(this.locators._generalSettingsHeader);
  }

  public goToPageSettings(pageName: string) {
    this.agHelper.GetNClick(this.locators._getPageSettingsHeader(pageName));
  }

  public openPaneAndChangeTheme(themeName: string) {
    this.openPaneFromCta();
    this.goToThemeSettings();
    this.theme.ChangeTheme(themeName);
    this.closePane();
  }

  public openPaneAndChangeThemeColors(
    primaryColorIndex: number,
    backgroundColorIndex: number,
  ) {
    this.openPaneFromCta();
    this.goToThemeSettings();
    this.theme.ChangeThemeColor(primaryColorIndex, "Primary");
    this.theme.ChangeThemeColor(backgroundColorIndex, "Background");
    this.closePane();
  }
}
