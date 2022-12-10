import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { checkUrl } from "../../../../support/Pages/AppSettings/Utils";

const appSettings = ObjectsRegistry.AppSettings,
  ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  commonLocators = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode,
  homePage = ObjectsRegistry.HomePage;

describe("Page Settings", () => {
  it("Page name change updates URL", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page1");
    appSettings.page.changePageNameAndVerifyUrl("Page2");
    homePage.GetAppName().then((appName) => {
      deployMode.DeployApp();
      checkUrl(appName as string, "Page2", undefined, false);
      deployMode.NavigateBacktoEditor();
    });
    cy.wait(2000);
  });

  it("Custom slug change updates URL", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page2");
    appSettings.page.changeCustomSlugAndVerifyUrl("custom");
    homePage.GetAppName().then((appName) => {
      deployMode.DeployApp();
      checkUrl(appName as string, "Page2", "custom", false);
      deployMode.NavigateBacktoEditor();
    });
    cy.wait(2000);
  });

  it("Check default page is updated", () => {
    ee.AddNewPage();
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page3");
    appSettings.page.setAsHomePage();
    appSettings.page.isHomePage("Page3");
  });

  it("Check page navigation is updated", () => {
    agHelper.GetNClick(commonLocators._previewModeToggle);
    agHelper.AssertElementExist(commonLocators._deployedPage);
    agHelper.GetNClick(commonLocators._editModeToggle);
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page2");
    appSettings.page.changePageNavigationSetting();
    agHelper.GetNClick(commonLocators._previewModeToggle);
    agHelper.AssertElementAbsence(commonLocators._deployedPage);
    agHelper.GetNClick(commonLocators._editModeToggle);
  });
});
