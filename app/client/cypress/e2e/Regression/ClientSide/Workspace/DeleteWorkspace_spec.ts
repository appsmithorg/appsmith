import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  locators,
  homePage,
  assertHelper,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";

describe("Delete workspace test spec", function () {
  let newWorkspaceName;

  it("1. Should delete the workspace", function () {
    agHelper.VisitNAssert("/applications", "getReleaseItems");
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
    agHelper.VisitNAssert("/applications", "getReleaseItems");
    agHelper.Sleep(2000);

    featureFlagIntercept({ license_gac_enabled: true });
    agHelper.Sleep(2000);

    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      newWorkspaceName = uid;
      homePage.CreateNewWorkspace(newWorkspaceName);
      agHelper.Sleep(500);
      agHelper.AssertContains("Delete workspace"); //only to check if Delete workspace is shown to an admin user
      homePage.InviteUserToWorkspace(
        newWorkspaceName,
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
      );
      homePage.LogOutviaAPI();
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      agHelper.VisitNAssert("/applications", "getReleaseItems");
      homePage.OpenWorkspaceOptions(newWorkspaceName);
      agHelper.AssertContains(
        "Delete workspace",
        "not.exist",
        appSettings.locators._userProfileDropdownMenu,
      );
      homePage.LogOutviaAPI();
    });
  });
});
