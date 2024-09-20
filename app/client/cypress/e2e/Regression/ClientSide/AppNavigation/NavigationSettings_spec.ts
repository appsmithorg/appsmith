import {
  agHelper,
  locators,
  deployMode,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Test app's navigation settings",
  { tags: ["@tag.IDE", "@tag.Sanity"] },
  function () {
    it("1. Open app settings and navigation tab should be there and when the navigation tab is selected, navigation preview should be visible", () => {
      AppSidebar.navigate(AppSidebarButton.Settings);
      agHelper.AssertElementVisibility(
        appSettings.locators._navigationSettingsTab,
      );

      // Should not exist when the tab is not selected
      agHelper.AssertElementAbsence(appSettings.locators._navigationPreview);
      agHelper.GetNClick(appSettings.locators._navigationSettingsTab);

      // Should exist when the tab is selected
      agHelper.AssertElementVisibility(appSettings.locators._navigationPreview);
    });

    it("2. Toggle 'Show navbar' to off, the app header and navigation should not appear when deployed", () => {
      // Toggle show navbar to off
      agHelper.GetNClick(
        appSettings.locators._navigationSettings._showNavbar,
        0,
        true,
      );
      deployMode.DeployApp(locators._emptyPageTxt);
      agHelper.AssertElementAbsence(appSettings.locators._header);
      agHelper.AssertElementAbsence(appSettings.locators._topStacked);
      //Browser back is used as the Navbar is off and there wont be option to come back to editor
      agHelper.BrowserNavigation(-1);
      // Wait for the app to load
      AppSidebar.navigate(AppSidebarButton.Settings);
      agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
      // Toggle show navbar back to on
      agHelper.GetNClick(
        appSettings.locators._navigationSettings._showNavbar,
        0,
        true,
      );
    });

    it("3. Change 'Orientation' to 'Side', deploy, and the sidebar should appear", () => {
      agHelper.GetNClick(
        appSettings.locators._navigationSettings._orientationOptions._side,
        0,
        true,
      );
      agHelper.AssertElementVisibility(appSettings.locators._sideNavbar);
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(appSettings.locators._header);
      agHelper.AssertElementAbsence(appSettings.locators._topStacked);
      agHelper.AssertElementVisibility(appSettings.locators._sideNavbar);
      deployMode.NavigateBacktoEditor();
    });

    it("4. Change 'Orientation' back to 'Top', and 'Nav style' to 'Inline', page navigation items should appear inline", () => {
      PageList.AddNewPage();
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
    });
  },
);
