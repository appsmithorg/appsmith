import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Page Settings", () => {
  it("1. Page name change updates URL", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToPageSettings("Page1");
    _.pageSettings.UpdatePageNameAndVerifyUrl("Page2", undefined, false);
    _.homePage.GetAppName().then((appName) => {
      _.deployMode.DeployApp();
      _.appSettings.CheckUrl(appName as string, "Page2", undefined, false);
      _.deployMode.NavigateBacktoEditor();
    });
    _.agHelper.Sleep();
  });

  it("2. Custom slug change updates URL", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToPageSettings("Page2");
    _.pageSettings.UpdateCustomSlugAndVerifyUrl("custom");
    _.homePage.GetAppName().then((appName) => {
      _.deployMode.DeployApp();
      _.appSettings.CheckUrl(appName as string, "Page2", "custom", false);
      _.deployMode.NavigateBacktoEditor();
    });
    _.agHelper.Sleep();
  });

  it("3. Check SetAsHome page setting", () => {
    _.ee.AddNewPage();
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToPageSettings("Page3");
    _.pageSettings.ToggleHomePage();
    _.pageSettings.AssertHomePage("Page3");
  });

  it("4. Check SetPageNavigation settings", () => {
    _.agHelper.GetNClick(_.locators._previewModeToggle);
    _.agHelper.AssertElementExist(_.locators._deployedPage);
    _.agHelper.GetNClick(_.locators._editModeToggle);
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToPageSettings("Page2");
    _.pageSettings.TogglePageNavigation();
    _.agHelper.GetNClick(_.locators._previewModeToggle);
    _.agHelper.AssertElementAbsence(_.locators._deployedPage);
    _.agHelper.GetNClick(_.locators._editModeToggle);
  });

  it("5. Page name allows accented character", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToPageSettings("Page3");
    _.pageSettings.UpdatePageNameAndVerifyUrl("Page3œßð", "Page3");
    _.appSettings.ClosePane();
  });

  it("6. Page name doesn't allow special character", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToPageSettings("Page3");
    _.pageSettings.UpdatePageNameAndVerifyTextValue("Page3!@#", "Page3 ");
    _.appSettings.ClosePane();
  });

  it("7. Page name doesn't allow empty", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToPageSettings("Page3");
    _.pageSettings.AssertPageErrorMessage(
      "",
      "Page name cannot be empty",
    );
    _.appSettings.ClosePane();
  });

  it("8. Bug #18698 : Page name doesn't allow duplicate name", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToPageSettings("Page3");
    _.pageSettings.AssertPageErrorMessage(
      "Page2",
      "Page2 is already being used.",
    );
    _.appSettings.ClosePane();
  });

  it("9. Page name doesn't allow keywords", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToPageSettings("Page3");
    _.pageSettings.AssertPageErrorMessage(
      "appsmith",
      "appsmith is already being used.",
    );
    _.appSettings.ClosePane();
  });

  it("10. Custom slug doesn't allow special/accented characters", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToPageSettings("Page2");
    _.pageSettings.UpdateCustomSlugAndVerifyTextValue(
      "custom-slug!@#œßð",
      "custom-slug",
    );
    _.appSettings.ClosePane();
  });
});
