import { ObjectsRegistry } from "../Objects/Registry";

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
}

class ThemeSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locators = {
    _changeThemeBtn: ".t--change-theme-btn",
    _themeCard: (themeName: string) =>
      "//h3[text()='" +
      themeName +
      "']//ancestor::div[@class= 'space-y-1 group']",
    _colorPickerV2Popover: ".t--colorpicker-v2-popover",
    _colorPickerV2Color: ".t--colorpicker-v2-color",
    _colorRing: ".border-2",
    _colorInput: (option: string) =>
      "//h3[text()='" + option + " Color']//parent::div//input",
    _colorInputField: (option: string) =>
      "//h3[text()='" + option + " Color']//parent::div",
  };

  public ChangeTheme(newTheme: string) {
    this.agHelper.GetNClick(this.locators._changeThemeBtn, 0, true);
    this.agHelper.GetNClick(this.locators._themeCard(newTheme));
    this.agHelper.AssertContains("Theme " + newTheme + " Applied");
  }

  public ChangeThemeColor(
    colorIndex: number | string,
    type: "Primary" | "Background" = "Primary",
  ) {
    const typeIndex = type == "Primary" ? 0 : 1;
    this.agHelper.GetNClick(this.locators._colorRing, typeIndex);
    if (typeof colorIndex == "number") {
      this.agHelper.GetNClick(this.locators._colorPickerV2Popover);
      this.agHelper.GetNClick(this.locators._colorPickerV2Color, colorIndex);
    } else {
      this.agHelper.GetElement(this.locators._colorInput(type)).clear();
      this.agHelper.TypeText(this.locators._colorInput(type), colorIndex);
      //this.agHelper.UpdateInput(this._colorInputField(type), colorIndex);//not working!
    }
  }
}

class GeneralSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locators = {
    appNameField: "#t--general-settings-app-name",
    appNonSelectedIcon: ".t--icon-not-selected",
    appIconSelector: "#t--general-settings-app-icon",
  };

  changeAppNameAndVerifyUrl(
    newAppName: string,
    reset = false,
    pageName = "page1",
  ) {
    this.agHelper
      .InvokeVal(this.locators.appNameField)
      .then((currentAppName) => {
        this.agHelper.RemoveCharsNType(
          this.locators.appNameField,
          4,
          newAppName,
        );
        this.agHelper.PressEnter();
        this.agHelper.ValidateNetworkStatus("@updateApplication", 200);
        checkUrl((currentAppName as string).slice(0, 4) + newAppName, pageName);
        if (reset) {
          this.agHelper.RemoveCharsNType(
            this.locators.appNameField,
            4 + newAppName.length,
            currentAppName as string,
          );
          this.agHelper.PressEnter();
          this.agHelper.ValidateNetworkStatus("@updateApplication", 200);
          checkUrl(currentAppName as string, pageName);
        }
      });
  }

  changeAppIconAndValidateApi() {
    this.agHelper.GetNClick(this.locators.appNonSelectedIcon, 0);
    this.agHelper.ValidateNetworkStatus("@updateApplication", 200);
  }
}

class PageSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private homePage = ObjectsRegistry.HomePage;
  private locators = {
    pageNameField: "#t--page-settings-name",
    customSlugField: "#t--page-settings-custom-slug",
  };

  changePageNameAndVerifyUrl(newPageName: string, reset = false) {
    this.agHelper
      .InvokeVal(this.locators.pageNameField)
      .then((currentPageName) => {
        const currentPageNameLength = (currentPageName as string).length;

        this.homePage.GetAppName().then((appName) => {
          this.agHelper.RemoveCharsNType(
            this.locators.pageNameField,
            currentPageNameLength,
            newPageName,
          );
          this.agHelper.PressEnter();
          this.agHelper.ValidateNetworkStatus("@updatePage", 200);
          checkUrl(appName as string, newPageName);

          if (reset) {
            this.agHelper.RemoveCharsNType(
              this.locators.pageNameField,
              currentPageNameLength + newPageName.length,
              currentPageName as string,
            );
            this.agHelper.PressEnter();
            this.agHelper.ValidateNetworkStatus("@updatePage", 200);
            checkUrl(appName as string, currentPageName as string);
          }
        });
      });
  }

  changeCustomSlugAndVerifyUrl(customSlug: string, reset = false) {
    this.agHelper
      .InvokeVal(this.locators.customSlugField)
      .then((currentCustomSlug) => {
        const currentCustomSlugLength = (currentCustomSlug as string).length;

        this.homePage.GetAppName().then((appName) => {
          if (currentCustomSlugLength === 0) {
            this.agHelper.TypeText(this.locators.customSlugField, customSlug);
          } else {
            this.agHelper.RemoveCharsNType(
              this.locators.customSlugField,
              currentCustomSlugLength,
              customSlug,
            );
          }
          this.agHelper.PressEnter();
          this.agHelper.ValidateNetworkStatus("@updatePage", 200);
          checkUrl(appName as string, "", customSlug);

          if (reset) {
            if (currentCustomSlugLength === 0) {
              this.agHelper.ClearTextField(this.locators.customSlugField);
            } else {
              this.agHelper.RemoveCharsNType(
                this.locators.customSlugField,
                currentCustomSlugLength + customSlug.length,
                currentCustomSlug as string,
              );
            }
            this.agHelper.PressEnter();
            this.agHelper.ValidateNetworkStatus("@updatePage", 200);
            this.agHelper
              .InvokeVal(this.locators.pageNameField)
              .then((currentPageName) => {
                checkUrl(
                  appName as string,
                  currentPageName as string,
                  currentCustomSlug as string,
                );
              });
          }
        });
      });
  }
}

export const checkUrl = (
  appName: string,
  pageName: string,
  customSlug?: string,
) => {
  cy.location("pathname").then((pathname) => {
    if (customSlug && customSlug.length > 0) {
      const pageId = pathname
        .split("/")[2]
        ?.split("-")
        .pop();
      expect(pathname).to.be.equal(
        `/app/${customSlug}-${pageId}/edit`.toLowerCase(),
      );
    } else {
      const pageId = pathname
        .split("/")[3]
        ?.split("-")
        .pop();
      expect(pathname).to.be.equal(
        `/app/${appName}/${pageName}-${pageId}/edit`.toLowerCase(),
      );
    }
  });
};
