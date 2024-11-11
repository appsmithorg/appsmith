import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import homePage from "../../../../../locators/HomePage";
import * as _ from "../../../../../support/Objects/ObjectsCore";

let repoName;
describe(
  "Git sync modal: deploy tab",
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
      //_.homePage.CreateNewWorkspace("DeployGitTest");
      cy.wait("@createWorkspace").then((interception) => {
        const newWorkspaceName = interception.response.body.data.name;
        cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
      });
      _.gitSync.CreateNConnectToGit("Test");
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });
    });

    it("1. Validate commit comment inputbox and last deployed preview", function () {
      // last deployed preview
      // The deploy preview Link should be displayed only after the first commit done
      cy.get(gitSyncLocators.bottomBarCommitButton).click();

      cy.get(gitSyncLocators.commitCommentInput).should("be.disabled");
      cy.get(gitSyncLocators.commitButton).should("be.disabled");
      cy.get(gitSyncLocators.closeGitSyncModal).click();
    });

    it("2. Post connection app name deploy menu", function () {
      // deploy
      _.agHelper.GetNClick(_.locators._publishButton);

      cy.get(gitSyncLocators.gitSyncModal);
      cy.get(gitSyncLocators.gitSyncModalDeployTab)
        .should("have.attr", "aria-selected", "true")
        .and("not.be.empty");
      cy.window().then((window) => {
        cy.stub(window, "open").callsFake((url) => {
          expect(url.indexOf("branch=master")).to.be.at.least(0);
          expect(!!url).to.be.true;
        });
      });

      cy.get(gitSyncLocators.closeGitSyncModal).click();

      // current deployed version
      _.agHelper.GetNClick(homePage.deployPopupOptionTrigger);
      _.agHelper.AssertElementExist(homePage.currentDeployedPreviewBtn);

      // connect to git
      _.agHelper.AssertElementAbsence(homePage.connectToGitBtn);
    });

    after(() => {
      _.gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
