import commonLocators from "../../../../locators/commonlocators.json";

import {
  agHelper,
  entityExplorer,
  jsEditor,
  deployMode,
  gitSync,
  apiPage,
  dataSources,
  assertHelper,
  locators,
  appSettings,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

let repoName;
let demoBranch: any;
describe("Git Branch:", {}, function () {
  before(() => {
    gitSync.CreateNConnectToGit();
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
  });

  it("1. Verify branch with same name cannot be created", function () {
    gitSync.CreateGitBranch("Test_Branch");
    gitSync.verifyNoDuplicateBranch("Test_Branch");
  });

  it("2. Verify delete branch", function () {
    gitSync.CreateGitBranch("Demo", true);
    gitSync.GetCurrentBranchName().then((branchName: any) => {
      cy.wrap(demoBranch).as("demoBranch");
      demoBranch = branchName;
      gitSync.SwitchGitBranch("master");
      DeleteBranchFromUI(demoBranch);
      cy.wait(5000);
      gitSync.SwitchGitBranch(`origin/${demoBranch}`);

      // Verify cannot delete checked out branch
      //   DeleteBranchFromUI(demoBranch);
      //   agHelper.ValidateToastMessage("Cannot delete checked out branch.");
      //   cy.wait(5000)
    });
  });

  it("3. Verify merge branch", function () {
    gitSync.CreateGitBranch("Demo1", true);
    PageList.AddNewPage();
    gitSync.CommitAndPush();
    cy.wait(3000);
    cy.then(() => {
      gitSync.CheckMergeConflicts(demoBranch);
      agHelper.GetNClick(gitSync.locators.opsMergeBtn);
      assertHelper.AssertNetworkStatus("@mergeBranch");
      gitSync.CloseOpsModal();
      gitSync.SwitchGitBranch(demoBranch);
      PageList.assertPresence("Page2");
    });
  });

  it("4. Verify merge branch with new query", function () {
    gitSync.SwitchGitBranch("Demo1");
    dataSources.CreateMockDB("Users");
    dataSources.CreateQueryAfterDSSaved("select * from users limit 10");
    dataSources.RunQuery();
    gitSync.CommitAndPush();
    cy.then(() => {
      gitSync.CheckMergeConflicts(demoBranch);
      agHelper.GetNClick(gitSync.locators.opsMergeBtn);
      assertHelper.AssertNetworkStatus("@mergeBranch");
      gitSync.CloseOpsModal();
      gitSync.SwitchGitBranch(demoBranch);
      EditorNavigation.NavigateToPage("Page2", true);
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      agHelper.AssertElementVisibility(locators._entityTestId("Query1"));
    });
  });

  it("5. Verify merge branch with new JS object", function () {
    gitSync.SwitchGitBranch("Demo1");
    EditorNavigation.NavigateToPage("Page2", true);
    jsEditor.CreateJSObject('return "Success";');
    gitSync.CommitAndPush();
    cy.then(() => {
      gitSync.CheckMergeConflicts(demoBranch);
      agHelper.GetNClick(gitSync.locators.opsMergeBtn);
      assertHelper.AssertNetworkStatus("@mergeBranch");
      gitSync.CloseOpsModal();
      gitSync.SwitchGitBranch(demoBranch);
      EditorNavigation.NavigateToPage("Page2", true);
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      agHelper.AssertElementVisibility(locators._entityTestId("JSObject1"));
    });
  });

  it("6. Verify merge branch with theme change", function () {
    gitSync.SwitchGitBranch("Demo1");
    appSettings.OpenAppSettings();
    appSettings.GoToThemeSettings();
    cy.get(commonLocators.changeThemeBtn).click({ force: true });
    agHelper.AssertAutoSave();
    // select a theme
    cy.get(commonLocators.themeCard).last().click({ force: true });
    agHelper.AssertAutoSave();
    // check for alert
    cy.get(`${commonLocators.themeCard}`)
      .last()
      .siblings("div")
      .first()
      .invoke("text")
      .then((text) => {
        cy.get(commonLocators.toastmsg).contains(`Theme ${text} applied`);
      });

    // check if color of canvas is same as theme bg color
    cy.get(`${commonLocators.themeCard} > main`)
      .last()
      .invoke("css", "background-color")
      .then((backgroudColor) => {
        cy.get(commonLocators.canvas).should(
          "have.css",
          "background-color",
          backgroudColor,
        );

        gitSync.CommitAndPush();
        cy.then(() => {
          gitSync.CheckMergeConflicts(demoBranch);
          agHelper.GetNClick(gitSync.locators.opsMergeBtn);
          assertHelper.AssertNetworkStatus("@mergeBranch");
          gitSync.CloseOpsModal();
          gitSync.SwitchGitBranch(demoBranch);
          cy.get(commonLocators.canvas).should(
            "have.css",
            "background-color",
            backgroudColor,
          );
        });
      });
  });

  function DeleteBranchFromUI(branch: any) {
    cy.get(gitSync.locators.quickActionsBranchBtn).click();
    agHelper.HoverElement(
      `${gitSync.locators.branchItem}:contains('${branch}')`,
    );
    cy.get(gitSync.locators.branchItemMenuBtn).click({ force: true });
    cy.get(gitSync.locators.branchItemMenuDeleteBtn)
      .should("be.visible")
      .click({ force: true });
  }
});
