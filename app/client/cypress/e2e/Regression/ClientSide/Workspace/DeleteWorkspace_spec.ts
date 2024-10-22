import { CURRENT_REPO, REPO } from "../../../../fixtures/REPO";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  homePage,
  assertHelper,
  adminSettings,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Delete workspace test spec",
  { tags: ["@tag.Workspace", "@tag.AccessControl"] },
  function () {
    let newWorkspaceName: any;

    it("1. Should delete the workspace", function () {
      homePage.NavigateToHome();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        newWorkspaceName = "workspace" + uid;
        homePage.CreateNewWorkspace(newWorkspaceName);
        homePage.DeleteWorkspace(newWorkspaceName);
        assertHelper.AssertNetworkStatus("@deleteWorkspaceApiCall");
        agHelper.AssertElementAbsence(newWorkspaceName);
      });
    });

    it("2. Should show option to delete workspace for an admin user", function () {
      if (CURRENT_REPO == REPO.EE) adminSettings.EnableGAC(false, true);
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        newWorkspaceName = uid;
        homePage.CreateNewWorkspace(newWorkspaceName);
        agHelper.AssertContains("Delete workspace"); //only to check if Delete workspace is shown to an admin user
        homePage.InviteUserToWorkspace(
          newWorkspaceName,
          Cypress.env("TESTUSERNAME1"),
          "App Viewer",
          false,
        );
        homePage.LogOutviaAPI();
        cy.LoginFromAPI(
          Cypress.env("TESTUSERNAME1"),
          Cypress.env("TESTPASSWORD1"),
        );
        homePage.OpenWorkspaceOptions(newWorkspaceName);
        agHelper.AssertContains(
          "Delete workspace",
          "not.exist",
          appSettings.locators._userProfileDropdownMenu,
        );
      });
    });
  },
);
