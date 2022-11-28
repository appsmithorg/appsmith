import { ObjectsRegistry } from "../../Objects/Registry";
import { checkUrl } from "./Utils";

export class GeneralSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locators = {
    appNameField: "#t--general-settings-app-name",
    appNonSelectedIcon: ".t--icon-not-selected",
    appIconSelector: "#t--general-settings-app-icon",
  };

  changeAppNameAndVerifyUrl(newAppName: string, pageName = "page1") {
    this.agHelper
      .InvokeVal(this.locators.appNameField)
      .then((currentAppName) => {
        this.agHelper.RemoveCharsNType(
          this.locators.appNameField,
          (currentAppName as string).length,
          newAppName,
        );
        this.agHelper.PressEnter();
        this.agHelper.ValidateNetworkStatus("@updateApplication", 200);
        checkUrl(newAppName, pageName);
      });
  }

  changeAppIcon() {
    this.agHelper.GetNClick(this.locators.appNonSelectedIcon, 0);
    this.agHelper.ValidateNetworkStatus("@updateApplication", 200);
  }
}
