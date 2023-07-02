import {
  agHelper,
  deployMode,
  homePage,
  assertHelper,
  appSettings,
  locators,
} from "../../../../support/Objects/ObjectsCore";

describe("Test Top + Inline navigation style", function () {
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

  it("1. Change 'Orientation' to 'Top', and 'Nav style' to 'Inline', page navigation items should appear inline", () => {
    agHelper.GetNClick(appSettings.locators._appSettings);
    agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
    agHelper.GetNClick(
      appSettings.locators._navigationSettings._orientationOptions._top,
      0,
      true,
    );
    agHelper.GetNClick(appSettings.locators._navStyleOptions._inline, 0, true);
    deployMode.DeployApp();
    agHelper.AssertElementExist(appSettings.locators._header);
    agHelper.AssertElementAbsence(appSettings.locators._topStacked);
    agHelper.AssertElementExist(appSettings.locators._topInline);
  });

  it("2. More button should exist and when clicked on it, it should open the dropdown with rest of the pages", () => {
    // 'More' button should exist
    agHelper.AssertElementExist(appSettings.locators._topInlineMoreButton);
    // Should open the dropdown
    agHelper.GetNClick(appSettings.locators._topInlineMoreButton, 0, true);
    agHelper.AssertElementExist(appSettings.locators._topInlineMoreDropdown);
    agHelper
      .GetElement(appSettings.locators._topInlineMoreDropdown)
      .should("have.class", "bp3-overlay-open");
    agHelper.AssertElementExist(
      appSettings.locators._topInlineMoreDropdownItem,
    );
    agHelper
      .GetElementLength(appSettings.locators._topInlineMoreDropdownItem)
      .then(($len) => expect($len).to.be.at.least(1));
  });

  it("3. Page change from inside this dropdown should work", () => {
    const pageName = "Page6 - with long long name";
    agHelper.GetNClickByContains(
      appSettings.locators._topInlineMoreDropdownItem,
      pageName,
      0,
      true,
    );
    // dropdown should close after page change

    agHelper
      .GetElement(appSettings.locators._topInlineMoreDropdown)
      .should("not.have.class", "bp3-overlay-open");

    // open the dropdown again
    agHelper.GetNClick(appSettings.locators._topInlineMoreButton, 0, true);
    // verify that the current page is active
    agHelper
      .GetElement(appSettings.locators._topInlineMoreDropdownItem)
      .contains(pageName)
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .should("have.class", "is-active");
  });

  it("4. Page change should work", () => {
    const pageName = "Page1 - with long long name";
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

  it("5. Navigation's background should be default to white, and should change when background color is set to theme", () => {
    // The background should be white since light color style is default
    agHelper
      .GetElement(appSettings.locators._header)
      .should("have.css", "background-color", "rgb(255, 255, 255)");

    // Changing color style to theme should change navigation's background color
    deployMode.NavigateBacktoEditor();
    agHelper.GetNClick(appSettings.locators._appSettings);
    agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
    agHelper.GetNClick(appSettings.locators._colorStyleOptions._theme, 0, true);
    deployMode.DeployApp();
    agHelper
      .GetElement(appSettings.locators._header)
      .should("have.css", "background-color", "rgb(85, 61, 233)");
  });

  it("6. Application name, share button, edit button, and user dropdown should be available in the app header", () => {
    agHelper.AssertElementExist(appSettings.locators._applicationName);
    agHelper.AssertElementExist(appSettings.locators._shareButton);
    agHelper.AssertElementExist(appSettings.locators._editButton);
    agHelper.AssertElementExist(
      appSettings.locators._userProfileDropdownButton,
    );
  });

  it("7. Share button should open the share modal, edit button should take us back to the editor, and clicking on user profile button should open up the dropdown menu", () => {
    // Share
    agHelper.GetNClick(
      `${appSettings.locators._header} ${appSettings.locators._shareButton}`,
    );
    agHelper.Sleep();
    agHelper.AssertElementExist(appSettings.locators._modal);
    agHelper.GetNClick(appSettings.locators._modalClose, 0, true);
    // Edit
    agHelper.GetNClick(
      `${appSettings.locators._header} ${appSettings.locators._editButton}`,
    );
    agHelper.AssertElementExist(locators._canvas);
    // User profile dropdown
    deployMode.DeployApp();
    agHelper.GetNClick(appSettings.locators._userProfileDropdownButton);
    agHelper.AssertElementExist(appSettings.locators._userProfileDropdownMenu);
  });
});
