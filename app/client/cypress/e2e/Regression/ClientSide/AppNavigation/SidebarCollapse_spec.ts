import {
  deployMode,
  agHelper,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Test Sidebar Collapse",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  function () {
    it("1. Sidebar collapse button should be there", () => {
      // First make sure that nav orientation is set to side
      AppSidebar.navigate(AppSidebarButton.Settings);
      agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
      agHelper.GetNClick(
        appSettings.locators._navigationSettings._orientationOptions._side,
        0,
        true,
      );
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(
        appSettings.locators._sidebarCollapseButton,
      );
      //Sidebar should collapse and open on click of collapse button again
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
    });
  },
);
