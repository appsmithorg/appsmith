import {
  agHelper,
  deployMode,
  homePage,
  assertHelper,
  appSettings,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Test Top + Inline navigation style",
  { tags: ["@tag.IDE", "@tag.ImportExport", "@tag.PropertyPane", "@tag.Git"] },
  function () {
    before(() => {
      // Import an application
      homePage.NavigateToHome();
      agHelper.RefreshPage();
      homePage.ImportApp(
        "appNavigationTestingAppWithLongPageNamesAndTitle.json",
      );

      assertHelper
        .WaitForNetworkCall("@importNewApplication")
        .then((response) => {
          const { isPartialImport } = response.body.data;
          if (isPartialImport) {
            homePage.AssertNCloseImport();
          } else {
            homePage.AssertImportToast();
          }
        });
    });

    it("1. Change 'Orientation' to 'Top', and 'Nav style' to 'Inline', page navigation items should appear inline", () => {
      AppSidebar.navigate(AppSidebarButton.Settings);
      agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
      agHelper.GetNClick(
        appSettings.locators._navigationSettings._orientationOptions._top,
        0,
        true,
      );
      agHelper.GetNClick(
        appSettings.locators._navStyleOptions._inline,
        0,
        true,
      );
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.AssertElementAbsence(appSettings.locators._topStacked);
      agHelper.AssertElementVisibility(appSettings.locators._topInline);
      //More button should exist and when clicked on it, it should open the dropdown with rest of the pages
      // 'More' button should exist
      agHelper.AssertElementVisibility(
        appSettings.locators._topInlineMoreButton,
      );
      // Should open the dropdown
      agHelper.GetNClick(appSettings.locators._topInlineMoreButton, 0, true);
      agHelper.AssertElementVisibility(
        appSettings.locators._topInlineMoreDropdown,
      );
      agHelper
        .GetElement(appSettings.locators._topInlineMoreDropdown)
        .should("have.class", "bp3-overlay-open");
      agHelper.AssertElementVisibility(
        appSettings.locators._topInlineMoreDropdownItem,
      );
      agHelper
        .GetElementLength(appSettings.locators._topInlineMoreDropdownItem)
        .then(($len) => expect($len).to.be.at.least(1));
    });

    it("2. Page change from inside this dropdown should work", () => {
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
      agHelper.AssertElementVisibility(
        appSettings.locators._getActivePage(pageName),
      );
      //Update the Page and check the active page
      const pageNameUpdated = "Page1 - with long long name";
      agHelper.GetNClickByContains(
        appSettings.locators._navigationMenuItem,
        pageNameUpdated,
        0,
        true,
      );
      agHelper.AssertElementVisibility(
        appSettings.locators._getActivePage(pageNameUpdated),
      );
    });

    it("3. Navigation's background should be default to white, and should change when background color is set to theme", () => {
      // The background should be white since light color style is default
      agHelper.AssertCSS(
        appSettings.locators._header,
        "background-color",
        "rgb(255, 255, 255)",
        0,
      );
      // Changing color style to theme should change navigation's background color
      deployMode.NavigateBacktoEditor();
      AppSidebar.navigate(AppSidebarButton.Settings);
      agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
      agHelper.GetNClick(
        appSettings.locators._colorStyleOptions._theme,
        0,
        true,
      );
      deployMode.DeployApp();
      agHelper.AssertCSS(
        appSettings.locators._header,
        "background-color",
        "rgb(85, 61, 233)",
        0,
      );
      //Application name, share button, edit button, and user dropdown should be available in the app header
      agHelper.AssertElementVisibility(appSettings.locators._applicationName);
      agHelper.AssertElementVisibility(appSettings.locators._shareButton);
      agHelper.AssertElementVisibility(locators._backToEditor);
      agHelper.AssertElementVisibility(homePage._profileMenu);
    });

    it("4. Share button should open the share modal, edit button should take us back to the editor, and clicking on user profile button should open up the dropdown menu", () => {
      // Share
      agHelper.GetNClick(
        `${appSettings.locators._header} ${appSettings.locators._shareButton}`,
      );
      agHelper.WaitUntilEleAppear(appSettings.locators._modal);
      agHelper.AssertElementVisibility(appSettings.locators._modal);
      agHelper.GetNClick(appSettings.locators._modalClose, 0, true);
      // User profile dropdown
      agHelper.GetNClick(homePage._profileMenu);
      agHelper.AssertElementVisibility(
        appSettings.locators._userProfileDropdownMenu,
      );
    });
  },
);
