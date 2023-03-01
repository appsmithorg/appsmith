import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import homePage from "../../../../../locators/HomePage";
import * as _ from "../../../../../support/Objects/ObjectsCore";

let repoName;
describe("Git sync modal: deploy tab", function() {
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

  it("1. Validate commit comment inputbox and last deployed preview", function() {
    // last deployed preview
    // The deploy preview Link should be displayed only after the first commit done
    cy.get(gitSyncLocators.bottomBarCommitButton).click();

    // comment text input should not empty
    cy.get(gitSyncLocators.commitCommentInput)
      .invoke("val")
      .should("not.be.empty");
    cy.get(gitSyncLocators.commitButton).should("be.disabled");
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  it("2. Post connection app name deploy menu", function() {
    // deploy
    _.agHelper.GetNClick(_.locators._publishButton);

    cy.get(gitSyncLocators.gitSyncModal);
    cy.get(gitSyncLocators.gitSyncModalDeployTab).should(
      "have.class",
      "react-tabs__tab--selected",
    );

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
    //cy.deleteTestGithubRepo(repoName);
  });
});
