import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const appSettings = ObjectsRegistry.AppSettings;

describe("General Settings", () => {
  it("App name change updates URL", () => {
    appSettings.openPaneFromCta();
    appSettings.goToGeneralSettings();
    appSettings.general.changeAppNameAndVerifyUrl("myapp", true);
  });

  it("Handles app icon change", () => {
    appSettings.general.changeAppIcon();
  });
});
