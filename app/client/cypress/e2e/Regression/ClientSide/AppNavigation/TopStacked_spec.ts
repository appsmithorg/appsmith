import {
  agHelper,
  assertHelper,
  deployMode,
  homePage,
  appSettings,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Test Top + Stacked navigation style",
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
        .WaitForNetworkCall("importNewApplication")
        .then((response: any) => {
          const { isPartialImport } = response.body.data;
          if (isPartialImport) {
            homePage.AssertNCloseImport();
          } else {
            homePage.AssertImportToast(0);
          }
        });
    });

    it("1. In an app with 15 pages, the navbar should be scrollable", () => {
      const pageName = "Page9 - with long long name";
      deployMode.DeployApp();
      agHelper.WaitUntilEleAppear(appSettings.locators._scrollArrows);
      agHelper.AssertElementLength(appSettings.locators._scrollArrows, 2);
      agHelper.AssertElementVisibility(
        appSettings.locators._scrollArrows,
        true,
        1,
      );
      agHelper
        .GetElement(appSettings.locators._navigationMenuItem)
        .contains(pageName)
        .should("not.be.visible");
      agHelper.GetNClickByContains(
        appSettings.locators._navigationMenuItem,
        pageName,
        0,
        true,
      );
      agHelper
        .GetElement(appSettings.locators._navigationMenuItem)
        .contains(pageName)
        .should("be.visible");
      deployMode.NavigateBacktoEditor();
    });

    it("2. Page change should work", () => {
      const pageName = "Page1 - with long long name";
      deployMode.DeployApp();
      agHelper.GetNClickByContains(
        appSettings.locators._navigationMenuItem,
        pageName,
        0,
        true,
      );
      agHelper.AssertElementVisibility(
        appSettings.locators._getActivePage(pageName),
      );
    });

    it("3. Left and right scroll arrows should work", () => {
      const pageName = "Page1 - with long long name";

      // Navigate to Page1
      agHelper.GetNClickByContains(
        appSettings.locators._navigationMenuItem,
        pageName,
        0,
        true,
      );

      // Check for scroll arrows
      agHelper.AssertElementLength(appSettings.locators._scrollArrows, 2);

      // Scroll to the right and page 1 should not be visible
      agHelper.GetNAssertContains(
        appSettings.locators._navigationMenuItem,
        pageName,
      );
      agHelper
        .GetElement(appSettings.locators._scrollArrows)
        .last()
        .trigger("mousedown");
      agHelper.Sleep(1500); //removing this sleep fails the case in CI & local, is needed for trigger event to complete
      agHelper
        .GetElement(appSettings.locators._scrollArrows)
        .last()
        .trigger("mouseup", { force: true });
      agHelper
        .GetElement(appSettings.locators._navigationMenuItem)
        .contains(pageName)
        .should("not.be.visible");

      // Scroll to the left again and page 1 should be visible
      agHelper
        .GetElement(appSettings.locators._scrollArrows)
        .first()
        .trigger("mousedown", { force: true });
      agHelper.Sleep(1500); //removing this sleep fails the case in CI, is needed for trigger event to complete
      agHelper
        .GetElement(appSettings.locators._scrollArrows)
        .first()
        .trigger("mouseup", { force: true });
      agHelper.GetNAssertContains(
        `${appSettings.locators._navigationMenuItem} span`,
        pageName,
      );
    });

    it("4. Navigation's background should be default to white, and should change when background color is set to theme", () => {
      // The background should be white since light color style is default
      agHelper.AssertCSS(
        appSettings.locators._topStacked,
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
        appSettings.locators._topStacked,
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

    it("5. Share button should open the share modal, edit button should take us back to the editor, and clicking on user profile button should open up the dropdown menu", () => {
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
