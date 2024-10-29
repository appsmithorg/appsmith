import {
  agHelper,
  homePage,
  locators,
  adminSettings,
} from "../../../../support/Objects/ObjectsCore";
import HomepageLocators from "../../../../locators/HomePage";

describe(
  "Validate Homepage Experience V2 changes",
  { tags: ["@tag.Workspace", "@tag.AccessControl"] },
  function () {
    before(() => {});

    it("1. Applications of other workspaces should not be visible in current workspace", () => {
      homePage.NavigateToHome();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        const workspaceName = `workspace-${uid}`;
        const applicationName = `application-${uid}`;
        homePage.CreateNewWorkspace(workspaceName);
        homePage.CreateAppInWorkspace(workspaceName, applicationName);
        homePage.NavigateToHome();
        homePage.CreateNewWorkspace();
        agHelper.AssertElementAbsence(`.${applicationName}`);
      });
    });

    it("2. Entity Search bar should be visible on Homepage and not visible on Settings and Editor", () => {
      homePage.CreateNewApplication();
      agHelper.AssertElementAbsence(HomepageLocators._entitySearchBar);
      homePage.NavigateToHome();
      agHelper.AssertElementExist(HomepageLocators._entitySearchBar);
      agHelper.GetNClick(adminSettings._adminSettingsBtn);
      agHelper.AssertElementAbsence(HomepageLocators._entitySearchBar);
      homePage.NavigateToHome();
      agHelper.GetNClick(HomepageLocators.optionsIcon);
      agHelper.GetNClick(HomepageLocators.workspaceSettingOption);
      agHelper.AssertElementAbsence(HomepageLocators._entitySearchBar);
    });

    it("3. Workspace and Applications should be visible in Entity search", () => {
      homePage.NavigateToHome();
      agHelper.TypeText(HomepageLocators._entitySearchBar, "Untitled");
      agHelper.AssertElementExist(HomepageLocators.initialWorkspace, 0);
      agHelper.AssertElementExist(HomepageLocators.initialApplication, 0);
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        agHelper.TypeText(HomepageLocators._entitySearchBar, `abc-${uid}`);
        agHelper.AssertElementExist(HomepageLocators.noEntityFound);
      });
    });
  },
);
