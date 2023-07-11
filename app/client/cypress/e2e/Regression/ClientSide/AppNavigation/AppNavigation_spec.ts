const appNavigationLocators = require("../../../../locators/AppNavigation.json");
import {
  agHelper,
  entityExplorer,
  deployMode,
  homePage,
  appSettings,
  assertHelper,
  locators,
} from "../../../../support/Objects/ObjectsCore";

describe("General checks for app navigation", function () {
  it("1. App header should appear when there is a single page in the application, and navigation should appear alongside app header when there are two pages", () => {
    // App header should appear when there is a single page in the application
    deployMode.DeployApp();
    agHelper.AssertElementExist(appSettings.locators._header);
    deployMode.NavigateBacktoEditor();
    // Navigation should appear alongside app header when there are two pages
    entityExplorer.AddNewPage();
    deployMode.DeployApp();
    agHelper.AssertElementExist(appSettings.locators._topStacked);
    //Application name, share button, edit button, and user dropdown should be available in the app header
    agHelper.AssertElementExist(appSettings.locators._applicationName);
    agHelper.AssertElementExist(appSettings.locators._shareButton);
    agHelper.AssertElementExist(locators._backToEditor);
    agHelper.AssertElementExist(homePage._profileMenu);
  });

  it("2. Share button should open the share modal, edit button should take us back to the editor, and clicking on user profile button should open up the dropdown menu", () => {
    // Share
    agHelper.GetNClick(
      `${appSettings.locators._header} ${appSettings.locators._shareButton}`,
    );
    agHelper.Sleep(1000);
    agHelper.AssertElementExist(locators._backToEditor);
    agHelper.AssertElementExist(appSettings.locators._modal);
    agHelper.GetNClick(appSettings.locators._modalClose);
    // Edit
    deployMode.NavigateBacktoEditor();
    // User profile dropdown
    deployMode.DeployApp();
    agHelper.GetNClick(homePage._profileMenu);
    agHelper.AssertElementExist(appSettings.locators._userProfileDropdownMenu);
    deployMode.NavigateBacktoEditor();
  });

  it("3. Import an application, deploy and verify if the Top+Stacked navigation style shows up with all the pages and a page change happens", () => {
    // Import an application
    homePage.NavigateToHome();
    homePage.ImportApp("appNavigationTestingApp.json");
    assertHelper
      .WaitForNetworkCall("@importNewApplication")
      .then((interception) => {
        agHelper.Sleep();
        const { isPartialImport } = interception.response.body.data;
        if (isPartialImport) {
          homePage.AssertNCloseImport();
        } else {
          homePage.AssertImportToast();
        }

        deployMode.DeployApp();

        // Assert app header, top stacked navigation and page menu items
        agHelper.AssertElementExist(appSettings.locators._header);
        agHelper.AssertElementExist(appSettings.locators._topStacked);
        agHelper.AssertElementLength(
          appSettings.locators._navigationMenuItem,
          10,
        );
        // Switch page
        agHelper.GetNClickByContains(
          appSettings.locators._navigationMenuItem,
          "Page5",
        );
        // Assert active page menu item
        agHelper
          .GetElement(appSettings.locators._navigationMenuItem)
          .contains("Page5")
          .parent()
          .parent()
          .parent()
          .parent()
          .parent()
          .should("have.class", "is-active");
        deployMode.NavigateBacktoEditor();
      });
  });
});
