import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import commonLocators from "../../../../../locators/commonlocators.json";
import * as _ from "../../../../../support/Objects/ObjectsCore";

let repoName;
let childBranchKey = "ChildBranch";
let mainBranch = "master";
describe(
  "Git sync modal: merge tab",
  {
    tags: [
      "@tag.Git",
      "@tag.Sanity",
      "@tag.AccessControl",
      "@tag.Workflows",
      "@tag.Module",
      "@tag.Theme",
      "@tag.JS",
      "@tag.Container",
      "@tag.ImportExport",
    ],
  },
  function () {
    before(() => {
      _.homePage.NavigateToHome();
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        const newWorkspaceName = interception.response.body.data.name;
        cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
      });

      _.gitSync.CreateNConnectToGit(repoName);
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });
    });

    it("1. Verify the functionality of the default dropdown under merge tab", function () {
      cy.get(commonLocators.canvas).click({ force: true });
      _.gitSync.CreateGitBranch(childBranchKey);
      cy.get(_.gitSync.locators.quickActionsMergeBtn).click();
      cy.get(_.gitSync.locators.opsModal).should("exist");
      cy.get(_.gitSync.locators.opsModalTabDeploy).should("exist");
      cy.get(_.gitSync.locators.opsModalTabDeploy)
        .invoke("attr", "aria-selected")
        .should("eq", "true");

      cy.get(_.gitSync.locators.opsMergeBtn).should("be.disabled");
      cy.wait(3000);
      cy.get(_.gitSync.locators.opsMergeBranchSelect).click();
      cy.get(commonLocators.dropdownmenu).contains(mainBranch).click();
      _.gitSync.AssertAbsenceOfCheckingMergeability();

      cy.wait("@mergeStatus", { timeout: 35000 }).should(
        "have.nested.property",
        "response.body.data.isMergeAble",
        true,
      );
      cy.wait(2000);
      cy.get(_.gitSync.locators.opsMergeBtn).should("be.enabled");
      _.gitSync.CloseOpsModal();
    });

    after(() => {
      _.gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
