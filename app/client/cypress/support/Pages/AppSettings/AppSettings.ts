import { ObjectsRegistry } from "../../Objects/Registry";
export class AppSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private theme = ObjectsRegistry.ThemeSettings;

  private locators = {
    _appSettings: "#t--app-settings-cta",
    _closeSettings: "#t--close-app-settings-pane",
    _themeSettingsHeader: "#t--theme-settings-header",
    _generalSettingsHeader: "#t--general-settings-header",
    _getPageSettingsHeader: (pageName: string) =>
      `#t--page-settings-${pageName}`,
  };

  public errorMessageSelector = (fieldId: string) => {
    fieldId = fieldId[0] === "#" ? fieldId.slice(1, fieldId.length) : fieldId;
    return `//input[@id='${fieldId}']/following-sibling::div/span`;
  };

  public OpenAppSettings() {
    this.agHelper.GetNClick(this.locators._appSettings);
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
    this.OpenAppSettings();
    this.GoToThemeSettings();
    this.theme.ChangeTheme(themeName);
    this.ClosePane();
  }

  public OpenPaneAndChangeThemeColors(
    primaryColorIndex: number,
    backgroundColorIndex: number,
  ) {
    this.OpenAppSettings();
    this.GoToThemeSettings();
    this.theme.ChangeThemeColor(primaryColorIndex, "Primary");
    this.theme.ChangeThemeColor(backgroundColorIndex, "Background");
    this.ClosePane();
  }

  public CheckUrl(
    appName: string,
    pageName: string,
    customSlug?: string,
    editMode = true,
  ) {
    cy.location("pathname").then((pathname) => {
      if (customSlug && customSlug.length > 0) {
        const pageId = pathname
          .split("/")[2]
          ?.split("-")
          .pop();
        expect(pathname).to.be.equal(
          `/app/${customSlug}-${pageId}${editMode ? "/edit" : ""}`.toLowerCase(),
        );
      } else {
        const pageId = pathname
          .split("/")[3]
          ?.split("-")
          .pop();
        expect(pathname).to.be.equal(
          `/app/${appName}/${pageName}-${pageId}${
            editMode ? "/edit" : ""
          }`.toLowerCase(),
        );
      }
    });
  };

  public AssertErrorMessage(
    fieldId: string,
    newValue: string,
    errorMessage: string,
    resetValue = true,
  ) {
    this.agHelper.GetText(fieldId, "val").then((currentValue) => {
      if (newValue.length === 0) this.agHelper.ClearTextField(fieldId);
      else
        this.agHelper.RemoveCharsNType(
          fieldId,
          (currentValue as string).length,
          newValue,
        );
      this.agHelper.AssertText(
        this.errorMessageSelector(fieldId),
        "text",
        errorMessage,
      );
      if (resetValue) {
        this.agHelper.RemoveCharsNType(
          fieldId,
          newValue.length,
          currentValue as string,
        );
      }
    });
  }


}
