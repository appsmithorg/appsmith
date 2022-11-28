import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const appSettings = ObjectsRegistry.AppSettings,
  ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  commonLocators = ObjectsRegistry.CommonLocators;

describe("Page Settings", () => {
  it("Page name change updates URL", () => {
    appSettings.openPaneFromCta();
    appSettings.goToPageSettings("Page1");
    appSettings.page.changePageNameAndVerifyUrl("Page2", true);
  });

  it("Custom slug change updates URL", () => {
    appSettings.page.changeCustomSlugAndVerifyUrl("custom");
    appSettings.page.changeCustomSlugAndVerifyUrl("custom2", true);
  });

  it("Check default page is updated", () => {
    appSettings.closePane();
    ee.AddNewPage();
    appSettings.openPaneFromCta();
    appSettings.goToPageSettings("Page2");
    appSettings.page.setAsHomePage();
    appSettings.page.isHomePage("Page2");
  });

  it("Check page navigation is updated", () => {
    agHelper.GetNClick(commonLocators._previewModeToggle);
    agHelper.AssertElementExist(commonLocators._deployedPage);
    agHelper.GetNClick(commonLocators._editModeToggle);
    appSettings.openPaneFromCta();
    appSettings.goToPageSettings("Page2");
    appSettings.page.changePageNavigationSetting();
    agHelper.GetNClick(commonLocators._previewModeToggle);
    agHelper.AssertElementAbsence(commonLocators._deployedPage);
    agHelper.GetNClick(commonLocators._editModeToggle);
  });
});
