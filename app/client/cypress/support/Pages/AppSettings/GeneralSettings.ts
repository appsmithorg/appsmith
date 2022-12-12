import { ObjectsRegistry } from "../../Objects/Registry";

export class GeneralSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private appSettings = ObjectsRegistry.AppSettings;

  private locators = {
    _appNameField: "#t--general-settings-app-name",
    _appNonSelectedIcon: ".t--icon-not-selected",
    _appIconSelector: "#t--general-settings-app-icon",
  };

  UpdateAppNameAndVerifyUrl(
    reset: boolean,
    newAppName: string,
    verifyAppNameAs?: string,
    pageName = "page1",
  ) {
    const appNameToBeVerified = verifyAppNameAs ?? newAppName;
    this.agHelper
      .GetText(this.locators._appNameField, "val")
      .then((currentAppName) => {
        this.agHelper.RemoveCharsNType(
          this.locators._appNameField,
          (currentAppName as string).length,
          newAppName,
        );
        this.agHelper.PressEnter();
        this.agHelper.Sleep();
        this.agHelper.ValidateNetworkStatus("@updateApplication", 200);
        this.appSettings.CheckUrl(appNameToBeVerified, pageName);
        if (reset) {
          this.agHelper.RemoveCharsNType(
            this.locators._appNameField,
            newAppName.length,
            currentAppName as string,
          );
          this.agHelper.PressEnter();
          this.agHelper.ValidateNetworkStatus("@updateApplication", 200);
          this.appSettings.CheckUrl(currentAppName as string, pageName);
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
    this.agHelper.ValidateNetworkStatus("@updateApplication", 200);
  }
}
