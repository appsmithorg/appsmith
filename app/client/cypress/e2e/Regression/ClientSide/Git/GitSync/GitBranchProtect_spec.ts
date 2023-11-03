import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../../support/Objects/ObjectsCore";

let guid: any;
let repoName1: any;
let repoName2: any;

describe("Git Branch Protection", function () {
  it("Issue 28056 - 1 : Check if protection is not enabled when feature flag is disabled", function () {
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      guid = uid;
      const wsName = "GitBranchProtect-1" + uid;
      const appName = "GitBranchProtect-1" + uid;
      _.homePage.CreateNewWorkspace(wsName, true);
      _.homePage.CreateAppInWorkspace(wsName, appName);
      featureFlagIntercept({
        release_git_connect_v2_enabled: true,
        release_git_branch_protection_enabled: false,
      });
      cy.wait(1000);
      _.gitSync.CreateNConnectToGitV2();
      cy.get("@gitRepoName").then((repName) => {
        repoName1 = repName;
        _.agHelper.AssertElementExist(_.entityExplorer._entityExplorerWrapper);
        _.agHelper.AssertElementExist(_.propPane._propertyPaneSidebar);
        _.agHelper.AssertElementEnabledDisabled(
          _.gitSync._bottomBarCommit,
          0,
          false,
        );
      });
    });
  });

  it("Issue 28056 - 2 : Check if protection is enabled when feature flag is enabled", function () {
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      guid = uid;
      const wsName = "GitBranchProtect-2" + uid;
      const appName = "GitBranchProtect-2" + uid;
      _.homePage.CreateNewWorkspace(wsName, true);
      _.homePage.CreateAppInWorkspace(wsName, appName);
      featureFlagIntercept({
        release_git_connect_v2_enabled: true,
        release_git_branch_protection_enabled: true,
      });
      cy.wait(1000);

      cy.intercept({
        method: "POST",
        url: /\/api\/v1\/git\/branch\/app\/.*\/protected/,
      }).as("gitProtectApi");

      _.gitSync.CreateNConnectToGitV2();
      cy.get("@gitRepoName").then((repName) => {
        repoName2 = repName;
        cy.wait("@gitProtectApi").then((res1) => {
          expect(res1.response).to.have.property("statusCode", 200);
          _.agHelper.AssertElementVisibility(
            _.entityExplorer._entityExplorerWrapper,
            false,
          );
          _.agHelper.AssertElementVisibility(
            _.propPane._propertyPaneSidebar,
            false,
          );
          _.agHelper.AssertElementEnabledDisabled(
            _.gitSync._bottomBarCommit,
            0,
            true,
          );
        });
      });
    });
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName1);
    _.gitSync.DeleteTestGithubRepo(repoName2);
  });
});
