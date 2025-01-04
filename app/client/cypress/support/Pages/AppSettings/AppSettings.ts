import { ObjectsRegistry } from "../../Objects/Registry";
import { AppSidebar, AppSidebarButton } from "../EditorNavigation";
export class AppSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private theme = ObjectsRegistry.ThemeSettings;

  public locators = {
    _themeSettingsHeader: "#t--theme-settings-header",
    _generalSettingsHeader: "#t--general-settings-header",
    _embedSettingsHeader: "#t--share-embed-settings",
    _navigationSettingsTab: "#t--navigation-settings-header",
    _importHeader: "#t--update-via-import",
    _navigationSettings: {
      _showNavbar: "#t--navigation-settings-show-navbar",
      _showSignIn: "#t--navigation-settings-show-sign-in",
      _orientation: ".t--navigation-settings-orientation",
      _navStyle: ".t--navigation-settings-navStyle",
      _colorStyle: ".t--navigation-settings-colorStyle",
      _orientationOptions: {
        _top: ".t--navigation-settings-orientation .ads-v2-segmented-control-value-top",
        _side:
          ".t--navigation-settings-orientation .ads-v2-segmented-control-value-side",
      },
    },
    _navigationMenuItem: ".t--page-switch-tab",
    _sideNavbar: ".t--app-viewer-navigation-sidebar",
    _getPageSettingsHeader: (pageName: string) =>
      `#t--page-settings-${pageName}`,
    _updateStatus: ".ads-v2-icon.rotate",
    _header: ".t--app-viewer-navigation-header",
    _topStacked: ".t--app-viewer-navigation-top-stacked",
    _applicationName: ".t--app-viewer-application-name",
    _shareButton: ".t--app-viewer-share-button",
    _modal: "div[role=dialog]",
    _modalClose: "div[role=dialog] button[aria-label='Close']",
    _canvas: ".t--canvas-artboard",
    _userProfileDropdownMenu: ".ads-v2-menu",
    _navigationPreview: ".t--navigation-preview",
    _navStyleOptions: {
      _stacked:
        ".t--navigation-settings-navStyle .ads-v2-segmented-control-value-stacked",
      _inline:
        ".t--navigation-settings-navStyle .ads-v2-segmented-control-value-inline",
    },
    _colorStyleOptions: {
      _light:
        ".t--navigation-settings-colorStyle .ads-v2-segmented-control-value-light",
      _theme:
        ".t--navigation-settings-colorStyle .ads-v2-segmented-control-value-theme",
    },
    _topInline: ".t--app-viewer-navigation-top-inline",
    _sidebarCollapseButton: ".t--app-viewer-navigation-sidebar-collapse",
    _topStackedScrollableContainer:
      ".t--app-viewer-navigation-top-stacked .hidden-scrollbar",
    _topInlineMoreButton: ".t--app-viewer-navigation-top-inline-more-button",
    _topInlineMoreDropdown:
      ".t--app-viewer-navigation-top-inline-more-dropdown",
    _topInlineMoreDropdownItem:
      ".t--app-viewer-navigation-top-inline-more-dropdown-item",
    _scrollArrows: ".scroll-arrows",
    _getActivePage: (pageName: string) =>
      `//span[contains(text(),"${pageName}")]//ancestor::a[contains(@class,'is-active')]`,
    _importBtn: "[data-testid='t--app-setting-import-btn']",
    _listItemTitle = ".ads-v2-listitem__title",
  };

  public errorMessageSelector = (fieldId: string) => {
    fieldId = fieldId[0] === "#" ? fieldId.slice(1, fieldId.length) : fieldId;
    return `//input[@id='${fieldId}']/parent::div/following-sibling::span`;
  };

  public OpenAppSettings() {
    AppSidebar.navigate(AppSidebarButton.Settings);
  }

  public ClosePane() {
    AppSidebar.navigate(AppSidebarButton.Editor);
  }

  public GoToThemeSettings() {
    this.agHelper.GetNClick(this.locators._themeSettingsHeader);
  }

  public GoToGeneralSettings() {
    this.agHelper.GetNClick(this.locators._generalSettingsHeader);
  }

  public GoToEmbedSettings() {
    this.agHelper.GetNClick(this.locators._embedSettingsHeader);
  }

  public GoToImport() {
    this.agHelper.GetNClick(this.locators._importHeader);
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
    restOfUrl = "",
  ) {
    appName = appName.replace(/\s+/g, "-");
    this.agHelper.AssertElementAbsence(this.locators._updateStatus, 10000);
    cy.location("pathname").then((pathname) => {
      const pageId = this.agHelper.extractPageIdFromUrl(pathname);
      if (customSlug && customSlug.length > 0) {
        expect(pathname).to.be.equal(
          `/app/${customSlug}-${pageId}${
            editMode ? "/edit" : ""
          }${restOfUrl}`.toLowerCase(),
        );
      } else {
        expect(pathname).to.be.equal(
          `/app/${appName}/${pageName}-${pageId}${
            editMode ? "/edit" : ""
          }${restOfUrl}`.toLowerCase(),
        );
      }
    });
  }

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
