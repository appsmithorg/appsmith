import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  gitSync,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

let wsName: string;
let appName: string;
let repoName: string;

describe(
  "Git Persist Branch",
  {
    tags: ["@tag.Git", "@tag.GitPersistBranch"],
  },
  function () {
    it("Check if branch persist after changing branch and exiting the app", function () {
      featureFlagIntercept({ release_git_persist_branch_enabled: true }, true);
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        wsName = "GitPB-" + uid;
        appName = "GitBranchProtect-2" + uid;
        homePage.CreateNewWorkspace(wsName, true);
        homePage.CreateAppInWorkspace(wsName, appName);
        gitSync.CreateNConnectToGit("test-git-perssit-branch", true, true);

        cy.get("@gitRepoName").then((resRepoName) => {
          repoName = resRepoName.toString();
          gitSync.CreateGitBranch("b1", false);
          cy.get("@gitbranchName").then((resBranchName) => {
            const branchName = resBranchName.toString();
            homePage.NavigateToHome();
            homePage.EditAppFromAppHover(appName);
            gitSync.AssertBranchName(branchName);
            gitSync.AssertBranchNameInUrl(branchName);
          });
        });
      });
    });
  },
);
