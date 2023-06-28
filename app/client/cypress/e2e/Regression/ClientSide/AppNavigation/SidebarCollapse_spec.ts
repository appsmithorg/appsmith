import {
  deployMode,
  agHelper,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";

describe("Test Sidebar Collapse", function () {
  it("1. Sidebar collapse button should be there", () => {
    // First make sure that nav orientation is set to side
    agHelper.GetNClick(appSettings.locators._applicationName);
    agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
    agHelper.GetNClick(
      appSettings.locators._navigationSettings._orientationOptions._side,
      0,
      true,
    );
    deployMode.DeployApp();
    agHelper.AssertElementExist(appSettings.locators._sidebarCollapseButton);
  });

  it("2. Sidebar should collapse and open on click of collapse button again", () => {
    // Collapse
    agHelper.GetNClick(appSettings.locators._sidebarCollapseButton, 0, true);
    agHelper
      .GetElement(appSettings.locators._sideNavbar)
      .should("not.have.class", "is-open");
    // Open
    agHelper.GetNClick(appSettings.locators._sidebarCollapseButton);
    agHelper
      .GetElement(appSettings.locators._sideNavbar)
      .should("have.class", "is-open");
    // Back to editor
    agHelper.GetNClick(
      `${appSettings.locators._sideNavbar} ${appSettings.locators._editButton}`,
      0,
      true,
    );
  });
});
