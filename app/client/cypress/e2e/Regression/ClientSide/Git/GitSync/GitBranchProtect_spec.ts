import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../../support/Objects/ObjectsCore";

let guid: any;
let repoName: any;

describe("Git Branch Protection", function () {
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
      });
      cy.wait(1000);

      cy.intercept({
        method: "POST",
        url: /\/api\/v1\/git\/branch\/app\/.*\/protected/,
      }).as("gitProtectApi");

      _.gitSync.CreateNConnectToGitV2();
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
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
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
