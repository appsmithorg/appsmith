import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../../support/Objects/ObjectsCore";

let guid: any;
let repoName1: any;

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

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName1);
  });
});
