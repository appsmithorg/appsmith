import { ObjectsRegistry } from "../../Objects/Registry";

interface UpdateNameAndVerifyUrlObj {
  reset: boolean;
  newAppName: string;
  verifyAppNameAs?: string;
  pageName?: string;
  restOfUrl?: string;
}

export class GeneralSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private appSettings = ObjectsRegistry.AppSettings;
  private assertHelper = ObjectsRegistry.AssertHelper;

  private locators = {
    _appNameField: "#t--general-settings-app-name",
    _appNonSelectedIcon: ".t--icon-not-selected",
    _appIconSelector: "#t--general-settings-app-icon",
  };

  UpdateAppNameAndVerifyUrl({
    newAppName,
    pageName = "page1",
    reset,
    restOfUrl = "",
    verifyAppNameAs,
  }: UpdateNameAndVerifyUrlObj) {
    const appNameToBeVerified = verifyAppNameAs ?? newAppName;
    this.agHelper
      .GetText(this.locators._appNameField, "val")
      .then((currentAppName) => {
        this.agHelper.RemoveCharsNType(
          this.locators._appNameField,
          (currentAppName as string).length,
          newAppName,
        );
        this.agHelper.PressEnter(1000);
        this.assertHelper.AssertNetworkStatus("@updateApplication", 200);
        this.appSettings.CheckUrl(
          appNameToBeVerified,
          pageName,
          undefined,
          true,
          restOfUrl,
        );
        if (reset) {
          this.agHelper.RemoveCharsNType(
            this.locators._appNameField,
            newAppName.length,
            currentAppName as string,
          );
          this.agHelper.PressEnter(1000);
          this.assertHelper.AssertNetworkStatus("@updateApplication", 200);
          this.appSettings.CheckUrl(
            currentAppName as string,
            pageName,
            undefined,
            true,
            restOfUrl,
          );
        }
      });
  }

  AssertAppErrorMessage(newAppName: string, errorMessage: string) {
    this.appSettings.AssertErrorMessage(
      this.locators._appNameField,
      newAppName,
      errorMessage,
      true,
    );
  }

  UpdateAppIcon() {
    this.agHelper.GetNClick(this.locators._appNonSelectedIcon, 0);
    this.assertHelper.AssertNetworkStatus("@updateApplication", 200);
  }
}
