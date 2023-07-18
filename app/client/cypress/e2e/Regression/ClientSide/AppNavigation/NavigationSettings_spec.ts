import {
  agHelper,
  locators,
  entityExplorer,
  deployMode,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";

describe("Test app's navigation settings", function () {
  it("1. Open app settings and navigation tab should be there and when the navigation tab is selected, navigation preview should be visible", () => {
    agHelper.GetNClick(appSettings.locators._appSettings);
    agHelper.AssertElementVisible(appSettings.locators._navigationSettingsTab);

    // Should not exist when the tab is not selected
    agHelper.AssertElementAbsence(appSettings.locators._navigationPreview);
    agHelper.GetNClick(appSettings.locators._navigationSettingsTab);

    // Should exist when the tab is selected
    agHelper.AssertElementVisible(appSettings.locators._navigationPreview);
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
    agHelper.GetNClick(appSettings.locators._appSettings, 0, true);
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
    agHelper.AssertElementVisible(appSettings.locators._sideNavbar);
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(appSettings.locators._header);
    agHelper.AssertElementAbsence(appSettings.locators._topStacked);
    agHelper.AssertElementVisible(appSettings.locators._sideNavbar);
    deployMode.NavigateBacktoEditor();
  });

  it("4. Change 'Orientation' back to 'Top', and 'Nav style' to 'Inline', page navigation items should appear inline", () => {
    entityExplorer.AddNewPage();
    agHelper.GetNClick(appSettings.locators._appSettings);
    agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
    agHelper.GetNClick(
      appSettings.locators._navigationSettings._orientationOptions._top,
      0,
      true,
    );
    agHelper.GetNClick(appSettings.locators._navStyleOptions._inline, 0, true);
    deployMode.DeployApp();
    agHelper.AssertElementVisible(appSettings.locators._header);
    agHelper.AssertElementAbsence(appSettings.locators._topStacked);
    agHelper.AssertElementVisible(appSettings.locators._topInline);
  });
});
