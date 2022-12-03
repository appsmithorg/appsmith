import { ObjectsRegistry } from "../../Objects/Registry";
import { ThemeSettings } from "./ThemeSettings";
import { GeneralSettings } from "./GeneralSettings";
import { PageSettings } from "./PageSettings";

export class AppSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
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

  public OpenPaneFromCta() {
    this.agHelper.GetNClick(this.locators._appSettings_cta);
  }

  public ClosePane() {
    this.agHelper.GetNClick(this.locators._closeSettings);
  }

  public GoToThemeSettings() {
    this.agHelper.GetNClick(this.locators._themeSettingsHeader);
  }

  public GoToGeneralSettings() {
    this.agHelper.GetNClick(this.locators._generalSettingsHeader);
  }

  public GoToPageSettings(pageName: string) {
    this.agHelper.GetNClick(this.locators._getPageSettingsHeader(pageName));
  }

  public OpenPaneAndChangeTheme(themeName: string) {
    this.OpenPaneFromCta();
    this.GoToThemeSettings();
    this.theme.ChangeTheme(themeName);
    this.ClosePane();
  }

  public OpenPaneAndChangeThemeColors(
    primaryColorIndex: number,
    backgroundColorIndex: number,
  ) {
    this.OpenPaneFromCta();
    this.GoToThemeSettings();
    this.theme.ChangeThemeColor(primaryColorIndex, "Primary");
    this.theme.ChangeThemeColor(backgroundColorIndex, "Background");
    this.ClosePane();
  }
}
