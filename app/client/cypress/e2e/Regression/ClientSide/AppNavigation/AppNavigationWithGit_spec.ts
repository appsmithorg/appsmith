import {
  agHelper,
  appSettings,
  locators,
  gitSync,
} from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe(
  "General checks for app navigation with Git",
  {
    tags: [
      "@tag.IDE",
      "@tag.Git",
      "@tag.Sanity",
      "@tag.AccessControl",
      "@tag.Workflows",
      "@tag.Module",
      "@tag.Theme",
      "@tag.JS",
      "@tag.Container",
      "@tag.ImportExport",
      "@tag.PropertyPane",
    ],
  },
  function () {
    it("Issue #32050 - Branch parameter should not be removed when navigating from the inline nav more dropdown", () => {
      gitSync.CreateNConnectToGit();
      gitSync.CreateGitBranch();
      cy.get("@gitbranchName").then((branchName) => {
        for (let i = 0; i < 8; i++) {
          PageList.AddNewPage();
        }
        AppSidebar.navigate(AppSidebarButton.Settings);
        agHelper.GetNClick(locators._appNavigationSettings);
        agHelper.GetNClick(locators._appNavigationSettingsShowTitle);
        agHelper.GetNClickByContains(
          appSettings.locators._navigationSettings._navStyle,
          "Inline",
        );
        AppSidebar.navigate(AppSidebarButton.Editor);
        agHelper.GetNClick(locators._previewModeToggle("edit"));
        agHelper.GetNClick(appSettings.locators._topInlineMoreButton);
        agHelper.GetNClickByContains(
          appSettings.locators._topInlineMoreDropdown,
          "Page7",
        );
        cy.url().should("include", `branch=${branchName}`);
      });
    });
  },
);
