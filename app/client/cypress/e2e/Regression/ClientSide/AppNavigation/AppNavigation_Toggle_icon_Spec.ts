import {
  agHelper,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Validating the App Setting pane toggles when clicked on settings icons in sidebar",
  { tags: ["@tag.IDE"] },
  function () {
    it("1. Should close theb App Settings pane when open and clicked on Settings icon", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      AppSidebar.navigate(AppSidebarButton.Settings);
      agHelper.GetNClick(appSettings.locators._navigationSettingsTab);
      agHelper.GetNClick(
        appSettings.locators._navigationSettings._orientationOptions._side,
      );
      agHelper.AssertElementExist(appSettings.locators._sideNavbar);
      AppSidebar.navigate(AppSidebarButton.Settings);
    });
  },
);