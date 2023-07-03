import {
  agHelper,
  appSettings,
  deployMode,
  homePage,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Test Sidebar navigation style", function () {
  before(() => {
    // Import an application
    homePage.NavigateToHome();
    homePage.ImportApp("appNavigationTestingAppWithLongPageNamesAndTitle.json");

    assertHelper
      .WaitForNetworkCall("@importNewApplication", 200)
      .then((interception) => {
        agHelper.Sleep();

        const { isPartialImport } = interception.response.body.data;

        if (isPartialImport) {
          homePage.AssertNCloseImport();
        } else {
          homePage.AssertImportToast();
        }
      });
  });

  it("1. Change 'Orientation' to 'Side', sidebar should appear", () => {
    agHelper.GetNClick(appSettings.locators._appSettings);
    agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
    agHelper.GetNClick(
      appSettings.locators._navigationSettings._orientationOptions._side,
      0,
      true,
    );
    deployMode.DeployApp();
    agHelper.AssertElementExist(appSettings.locators._sideNavbar);
    agHelper.AssertElementAbsence(appSettings.locators._topStacked);
    agHelper.AssertElementAbsence(appSettings.locators._topInline);
  });

  it("2. Page change should work", () => {
    const pageName = "Page5 - with long long name";
    agHelper.GetNClickByContains(
      appSettings.locators._navigationMenuItem,
      pageName,
      0,
      true,
    );
    agHelper
      .GetElement(appSettings.locators._navigationMenuItem)
      .contains(pageName)
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .should("have.class", "is-active");
  });

  it("3. Sidebar background should be default to white, and should change when background color is set to theme", () => {
    // The background of sidebar should be white since light color style is default
    agHelper
      .GetElement(appSettings.locators._sideNavbar)
      .should("have.css", "background-color", "rgb(255, 255, 255)");

    // Changing color style to theme should change navigation's background color
    deployMode.NavigateBacktoEditor();
    agHelper.GetNClick(appSettings.locators._appSettings);
    agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
    agHelper.GetNClick(appSettings.locators._colorStyleOptions._theme, 0, true);
    deployMode.DeployApp();
    agHelper
      .GetElement(appSettings.locators._sideNavbar)
      .should("have.css", "background-color", "rgb(85, 61, 233)");
  });

  it("4. Application name, share button, edit button, and user dropdown should be available in the app sidebar", () => {
    agHelper.AssertElementExist(appSettings.locators._applicationName);
    agHelper.AssertElementExist(appSettings.locators._shareButton);
    agHelper.AssertElementExist(appSettings.locators._editButton);
    agHelper.AssertElementExist(
      appSettings.locators._userProfileDropdownButton,
    );
  });

  it("5. Share button should open the share modal, edit button should take us back to the editor, and clicking on user profile button should open up the dropdown menu", () => {
    // Share
    agHelper.GetNClick(
      `${appSettings.locators._sideNavbar} ${appSettings.locators._shareButton}`,
    );
    agHelper.Sleep(1000);
    agHelper.AssertElementExist(appSettings.locators._modal);
    agHelper.GetNClick(appSettings.locators._modalClose, 0, true);
    // Edit
    agHelper.GetNClick(
      `${appSettings.locators._sideNavbar} ${appSettings.locators._editButton}`,
    );
    agHelper.AssertElementExist(appSettings.locators._canvas);
    // User profile dropdown
    deployMode.DeployApp();
    agHelper.GetNClick(appSettings.locators._userProfileDropdownButton);
    agHelper.AssertElementExist(appSettings.locators._userProfileDropdownMenu);
    // Back to editor
    agHelper.GetNClick(
      `${appSettings.locators._sideNavbar} ${appSettings.locators._editButton}`,
      0,
      true,
    );
  });
});
