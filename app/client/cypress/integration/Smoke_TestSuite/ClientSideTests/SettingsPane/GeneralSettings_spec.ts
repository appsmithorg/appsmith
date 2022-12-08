import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { checkUrl } from "../../../../support/Pages/AppSettings/Utils";

const appSettings = ObjectsRegistry.AppSettings,
  deployMode = ObjectsRegistry.DeployMode,
  homePage = ObjectsRegistry.HomePage;

describe("General Settings", () => {
  it("App name change updates URL", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToGeneralSettings();
    appSettings.general.changeAppNameAndVerifyUrl(true, "myapp");
    homePage.GetAppName().then((appName) => {
      deployMode.DeployApp();
      checkUrl(appName as string, "Page1", undefined, false);
      deployMode.NavigateBacktoEditor();
    });
  });

  it("Handles app icon change", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToGeneralSettings();
    appSettings.general.changeAppIcon();
    appSettings.ClosePane();
  });

  it("App name allows special and accented character", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToGeneralSettings();
    appSettings.general.changeAppNameAndVerifyUrl(true, "myapp!@#œ™¡", "myapp");
    appSettings.ClosePane();
  });

  it("App name doesn't allow empty", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToGeneralSettings();
    appSettings.general.tryAppNameAndVerifyErrorMessage(
      "",
      "App name cannot be empty",
    );
    appSettings.ClosePane();
  });
});
