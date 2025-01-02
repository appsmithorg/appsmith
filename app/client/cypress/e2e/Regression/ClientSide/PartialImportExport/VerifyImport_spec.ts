import {
  agHelper,
  homePage,
  gitSync,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";
import ReconnectLocators from "../../../../locators/ReconnectLocators";

describe(
  "Tests Import option for Git connected apps and normal apps",
  {},
  () => {
    before(() => {
      gitSync.CreateNConnectToGit();
    });

    it("1. Verify Import Option", () => {
      AppSidebar.navigate(AppSidebarButton.Settings);
      agHelper.GetNClick(appSettings.locators._importHeader);
      agHelper.AssertElementEnabledDisabled(appSettings.locators._importBtn);

      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      AppSidebar.navigate(AppSidebarButton.Settings);
      agHelper.GetNClick(appSettings.locators._importHeader);
      agHelper.AssertElementEnabledDisabled(
        appSettings.locators._importBtn,
        0,
        false,
      );
      agHelper.GetNClick(appSettings.locators._importBtn);
      homePage.ImportApp("TryToCoverMore.json", "", true);
      agHelper.GetNClick(ReconnectLocators.SkipToAppBtn);
    });
  },
);
