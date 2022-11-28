import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { checkUrl } from "../../../../support/Pages/AppSettings/Utils";

const appSettings = ObjectsRegistry.AppSettings,
  deployMode = ObjectsRegistry.DeployMode;

describe("General Settings", () => {
  it("App name change updates URL", () => {
    appSettings.openPaneFromCta();
    appSettings.goToGeneralSettings();
    appSettings.general.changeAppNameAndVerifyUrl("myapp");
    deployMode.DeployApp();
    checkUrl("myapp", "Page1", undefined, false);
    deployMode.NavigateBacktoEditor();
  });

  it("Handles app icon change", () => {
    appSettings.openPaneFromCta();
    appSettings.goToGeneralSettings();
    appSettings.general.changeAppIcon();
  });
});
