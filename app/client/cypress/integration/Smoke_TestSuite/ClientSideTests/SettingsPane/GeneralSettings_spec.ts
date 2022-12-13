import * as _ from "../../../../support/Objects/ObjectsCore";

let guid: string;
describe("General Settings", () => {
  before(() => {
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid: any) => {
      guid = uid;
    });
  });

  it("1. App name change updates URL", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToGeneralSettings();
    _.generalSettings.UpdateAppNameAndVerifyUrl(true, guid);
    _.homePage.GetAppName().then((appName) => {
      _.deployMode.DeployApp();
      _.appSettings.CheckUrl(appName as string, "Page1", undefined, false);
      _.deployMode.NavigateBacktoEditor();
    });
  });

  it("2. Handles app icon change", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToGeneralSettings();
    _.generalSettings.UpdateAppIcon();
    _.appSettings.ClosePane();
  });

  it("3. App name allows special and accented character", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToGeneralSettings();
    _.generalSettings.UpdateAppNameAndVerifyUrl(true, guid + "!@#œ™¡", guid);
    _.appSettings.ClosePane();
  });

  it("4. Veirfy App name doesn't allow empty", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToGeneralSettings();
    _.generalSettings.AssertAppErrorMessage("", "App name cannot be empty");
    _.appSettings.ClosePane();
  });
});
