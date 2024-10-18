import gitSyncLocators from "../../../../../locators/gitSyncLocators";

import { agHelper, gitSync } from "../../../../../support/Objects/ObjectsCore";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

let repoName, branchName;
describe("Delete branch flow", { tags: ["@tag.Git", "@tag.Sanity", "@tag.AccessControl", "@tag.Workflows", "@tag.Module", "@tag.Theme", "@tag.JS", "@tag.Container", "@tag.ImportExport"] }, () => {
  it("1. Connect app to git, create new branch and delete it", () => {
    // create git repo and connect app to git
    gitSync.CreateNConnectToGit();
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
    gitSync.CreateGitBranch();
    //cy.createGitBranch(branchName);
    cy.wait(1000);
    // verify can not delete the checked out branch
    DeleteBranchFromUI(1);
    cy.get("@gitbranchName").then((branName) => {
      branchName = branName;
      agHelper.ValidateToastMessage(
        `Cannot delete checked out branch. Please check out other branch before deleting ${branchName}.`,
      );
      cy.get(gitSyncLocators.closeBranchList).click({ force: true });
      // switch to master and delete new branch created
      cy.switchGitBranch("master");
      cy.wait(2000);

      DeleteBranchFromUI(1);
      cy.wait("@deleteBranch").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(gitSyncLocators.closeBranchList).click({ force: true });
      // verify remote branch is there for the deleted local branch
      cy.wait(2000);
      cy.switchGitBranch(`origin/${branchName}`);
      cy.wait(2000);
    });
  });

  it("2. Create child branch, merge data from child branch, delete child branch verify the data should reflect in master ", () => {
    cy.switchGitBranch("master");
    gitSync.CreateGitBranch("", true);
    cy.wait(1000);
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    cy.dragAndDropToCanvas("checkboxwidget", { x: 100, y: 200 });
    cy.get(".t--draggable-checkboxwidget").should("exist");
    cy.wait(2000);
    cy.commitAndPush();
    cy.merge("master");
    gitSync.CloseGitSyncModal();
    cy.switchGitBranch("master");
    cy.wait(2000);

    DeleteBranchFromUI(1);

    cy.wait("@deleteBranch").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(gitSyncLocators.closeBranchList).click({ force: true });
    cy.get(".t--draggable-checkboxwidget").should("be.visible");
  });

  it("3. Create new branch, commit data in that branch , delete the branch, verify data should not reflect in master ", () => {
    gitSync.CreateGitBranch("", true);
    cy.wait(1000);
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    cy.dragAndDropToCanvas("chartwidget", { x: 210, y: 300 });
    cy.get(".t--widget-chartwidget").should("exist");
    cy.wait(2000);
    cy.commitAndPush();
    cy.wait(1000);
    cy.switchGitBranch("master");
    cy.wait(3000);

    DeleteBranchFromUI(1);

    cy.wait("@deleteBranch").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(".--widget-chartwidget").should("not.exist");
    cy.get(gitSyncLocators.closeBranchList).click({ force: true });
  });

  it("4. Verify Default branch deletion not allowed ", () => {
    agHelper.Sleep(2000); //for toasts to appear then wait for disappear
    agHelper.WaitUntilAllToastsDisappear();
    DeleteBranchFromUI(0);
    cy.get(gitSyncLocators.closeBranchList).click({ force: true });
    agHelper.ValidateToastMessage("Cannot delete default branch: master");
  });

  function DeleteBranchFromUI(index = 1) {
    cy.get(gitSyncLocators.branchButton).click();
    cy.get(gitSyncLocators.branchListItem)
      .eq(index)
      .trigger("mouseenter")
      .wait(1000);
    cy.get(gitSyncLocators.gitBranchContextMenu).click({ force: true });
    cy.xpath("//div[@role='menu']//span[text()='Delete']")
      .should("be.visible")
      .click({ force: true });
  }

  after(() => {
    //clean up
    gitSync.DeleteTestGithubRepo(repoName);
  });
});
