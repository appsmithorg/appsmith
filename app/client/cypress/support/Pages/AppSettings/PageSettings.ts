import { ObjectsRegistry } from "../../Objects/Registry";

interface UpdatePageNameAndVerifyUrlObj {
  newPageName: string;
  reset?: boolean;
  verifyPageNameAs?: string;
  restOfUrl?: string;
}

export class PageSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private homePage = ObjectsRegistry.HomePage;
  private appSettings = ObjectsRegistry.AppSettings;
  private assertHelper = ObjectsRegistry.AssertHelper;

  public locators = {
    _pageNameField: "#t--page-settings-name",
    _customSlugField: "#t--page-settings-custom-slug",
    _showPageNavSwitch: "#t--page-settings-show-nav-control",
    _setAsHomePageSwitch: "#t--page-settings-home-page-control",
    _setHomePageToggle: ".bp3-control-indicator",
    _homePageHeader: "#t--page-settings-default-page",
  };

  UpdatePageNameAndVerifyTextValue(
    newPageName: string,
    verifyPageNameAs: string,
  ) {
    this.AssertPageValue(
      this.locators._pageNameField,
      newPageName,
      verifyPageNameAs,
    );
  }

  UpdateCustomSlugAndVerifyTextValue(
    newCustomSlug: string,
    verifyCustomSlugAs: string,
  ) {
    this.AssertPageValue(
      this.locators._customSlugField,
      newCustomSlug,
      verifyCustomSlugAs,
    );
  }

  public AssertPageValue(
    locator: string,
    newValue: string,
    verifyValueAs: string,
  ) {
    this.agHelper.GetText(locator, "val").then((currentValue) => {
      const currentValueLength = (currentValue as string).length;
      if (currentValueLength === 0) this.agHelper.TypeText(locator, newValue);
      else
        this.agHelper.RemoveCharsNType(locator, currentValueLength, newValue);

      this.agHelper.GetText(locator, "val").then((fieldValue) => {
        expect(fieldValue).to.equal(verifyValueAs);
        if (currentValueLength === 0) this.agHelper.ClearTextField(locator);
        else
          this.agHelper.RemoveCharsNType(
            locator,
            (fieldValue as string).length,
            currentValue as string,
          );
      });
    });
  }

  UpdatePageNameAndVerifyUrl({
    newPageName,
    reset = true,
    restOfUrl = "",
    verifyPageNameAs,
  }: UpdatePageNameAndVerifyUrlObj) {
    const pageNameToBeVerified = verifyPageNameAs ?? newPageName;
    this.agHelper
      .GetText(this.locators._pageNameField, "val")
      .then((currentPageName) => {
        const currentPageNameLength = (currentPageName as string).length;

        this.homePage.GetAppName().then((appName) => {
          this.agHelper.RemoveCharsNType(
            this.locators._pageNameField,
            currentPageNameLength,
            newPageName,
          );
          this.agHelper.PressEnter();
          this.assertHelper.AssertNetworkStatus("@updatePage", 200);
          this.appSettings.CheckUrl(
            appName as string,
            pageNameToBeVerified,
            undefined,
            true,
            restOfUrl,
          );
          if (reset) {
            this.agHelper.RemoveCharsNType(
              this.locators._pageNameField,
              newPageName.length,
              currentPageName as string,
            );
            this.agHelper.PressEnter();
            this.assertHelper.AssertNetworkStatus("@updatePage", 200);
            this.appSettings.CheckUrl(
              appName as string,
              currentPageName as string,
              undefined,
              true,
              restOfUrl,
            );
          }
        });
      });
  }

  UpdateCustomSlugAndVerifyUrl(customSlug: string, restOfUrl = "") {
    this.agHelper
      .GetText(this.locators._customSlugField, "val")
      .then((currentCustomSlug) => {
        const currentCustomSlugLength = (currentCustomSlug as string).length;

        this.homePage.GetAppName().then((appName) => {
          if (currentCustomSlugLength === 0) {
            this.agHelper.TypeText(this.locators._customSlugField, customSlug);
          } else {
            this.agHelper.RemoveCharsNType(
              this.locators._customSlugField,
              currentCustomSlugLength,
              customSlug,
            );
          }
          this.agHelper.PressEnter();
          this.assertHelper.AssertNetworkStatus("@updatePage", 200);
          this.appSettings.CheckUrl(
            appName as string,
            "",
            customSlug,
            true,
            restOfUrl,
          );
        });
      });
  }

  AssertPageErrorMessage(newPageName: string, errorMessage: string) {
    this.appSettings.AssertErrorMessage(
      this.locators._pageNameField,
      newPageName,
      errorMessage,
      true,
    );
  }

  TogglePageNavigation() {
    this.agHelper.GetNClick(this.locators._showPageNavSwitch);
    this.assertHelper.AssertNetworkStatus("@updatePage", 200);
  }

  ToggleHomePage() {
    this.agHelper.GetNClick(this.locators._setAsHomePageSwitch);
    this.assertHelper.AssertNetworkStatus("@makePageDefault", 200);
  }

  AssertHomePage(pageName: string) {
    this.agHelper.AssertText(this.locators._homePageHeader, "text", pageName);
  }
}
