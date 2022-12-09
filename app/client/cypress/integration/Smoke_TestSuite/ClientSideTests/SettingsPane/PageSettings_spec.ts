import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { checkUrl } from "../../../../support/Pages/AppSettings/Utils";

const appSettings = ObjectsRegistry.AppSettings,
  ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  commonLocators = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode,
  homePage = ObjectsRegistry.HomePage;

describe("Page Settings", () => {
  it("1. Page name change updates URL", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page1");
    appSettings.page.changePageNameAndVerifyUrl("Page2", undefined, false);
    homePage.GetAppName().then((appName) => {
      deployMode.DeployApp();
      checkUrl(appName as string, "Page2", undefined, false);
      deployMode.NavigateBacktoEditor();
    });
    cy.wait(2000);
  });

  it("2. Custom slug change updates URL", () => {
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

  it("3. Check default page is updated", () => {
    ee.AddNewPage();
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page3");
    appSettings.page.setAsHomePage();
    appSettings.page.isHomePage("Page3");
  });

  it("4. Check page navigation is updated", () => {
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

  it("5. Page name allows accented character", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page3");
    appSettings.page.changePageNameAndVerifyUrl("Page3œßð", "Page3");
    appSettings.ClosePane();
  });

  it("6. Page name doesn't allow special character", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page3");
    appSettings.page.tryPageNameAndVerifyTextValue("Page3!@#", "Page3 ");
    appSettings.ClosePane();
  });

  it("7. Page name doesn't allow empty", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page3");
    appSettings.page.tryPageNameAndVerifyErrorMessage(
      "",
      "Page name cannot be empty",
    );
    appSettings.ClosePane();
  });

  it("8. Page name doesn't allow duplicate name", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page3");
    appSettings.page.tryPageNameAndVerifyErrorMessage(
      "Page2",
      "Page2 is already being used.",
    );
    appSettings.ClosePane();
  });

  it("9. Page name doesn't allow keywords", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page3");
    appSettings.page.tryPageNameAndVerifyErrorMessage(
      "appsmith",
      "appsmith is already being used.",
    );
    appSettings.ClosePane();
  });

  it("10. Custom slug doesn't allow special/accented characters", () => {
    appSettings.OpenPaneFromCta();
    appSettings.GoToPageSettings("Page2");
    appSettings.page.tryCustomSlugAndVerifyTextValue(
      "custom-slug!@#œßð",
      "custom-slug",
    );
    appSettings.ClosePane();
  });
});
