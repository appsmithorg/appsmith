import { ObjectsRegistry } from "../../Objects/Registry";
import { checkUrl } from "./Utils";

export class PageSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private homePage = ObjectsRegistry.HomePage;
  private locators = {
    pageNameField: "#t--page-settings-name",
    customSlugField: "#t--page-settings-custom-slug",
    showPageNavSwitch: "#t--page-settings-show-nav-control",
    setAsHomePageSwitch: "#t--page-settings-home-page-control",
    homePageHeader: "#t--page-settings-default-page",
  };

  changePageNameAndVerifyUrl(newPageName: string) {
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
        });
      });
  }

  changeCustomSlugAndVerifyUrl(customSlug: string) {
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
        });
      });
  }

  changePageNavigationSetting() {
    this.agHelper.GetSiblingNClick(
      this.locators.showPageNavSwitch,
      ".bp3-control-indicator",
    );
    this.agHelper.ValidateNetworkStatus("@updatePage", 200);
  }

  setAsHomePage() {
    this.agHelper.GetSiblingNClick(
      this.locators.setAsHomePageSwitch,
      ".bp3-control-indicator",
    );
    this.agHelper.ValidateNetworkStatus("@makePageDefault", 200);
  }

  isHomePage(pageName: string) {
    this.agHelper.AssertText(this.locators.homePageHeader, "text", pageName);
  }
}
