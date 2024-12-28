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
      cy.get(gitSync.locators.quickActionsCommitBtn).click();

      cy.get(gitSync.locators.opsCommitInput).should("be.disabled");
      cy.get(gitSync.locators.opsCommitBtn).should("be.disabled");
      _.gitSync.CloseOpsModal();
    });

    it("2. Post connection app name deploy menu", function () {
      // deploy
      _.agHelper.GetNClick(_.locators._publishButton);

      cy.get(_.gitSync.locators.opsModal);
      cy.get(_.gitSync.locators.opsModalTabDeploy)
        .should("have.attr", "aria-selected", "true")
        .and("not.be.empty");
      cy.window().then((window) => {
        cy.stub(window, "open").callsFake((url) => {
          expect(url.indexOf("branch=master")).to.be.at.least(0);
          expect(!!url).to.be.true;
        });
      });

      _.gitSync.CloseOpsModal();

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
