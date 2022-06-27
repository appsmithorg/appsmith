import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import homePage from "../../../../../locators/HomePage";
const commonLocators = require("../../../../../locators/commonlocators.json");

let repoName;
describe("Git sync modal: deploy tab", function() {
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName, false);
    });
  });

  it("Validate commit comment inputbox and last deployed preview", function() {
    // last deployed preview
    // The deploy preview Link should be displayed only after the first commit done
    cy.get(gitSyncLocators.bottomBarCommitButton).click();
    // cy.get(gitSyncLocators.deployPreview).should("not.exist");

    // comment text input should not empty
    cy.get(gitSyncLocators.commitCommentInput)
      .invoke("val")
      .should("not.be.empty");
    // cy.get(gitSyncLocators.commitCommentInput).clear();
    cy.get(gitSyncLocators.commitButton).should("be.disabled");
    /*  cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");

    cy.get(gitSyncLocators.commitButton).click();
    // check for commit success
    cy.wait("@commit").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    ); */

    // last deployed preview
    // it should be updated with the each commit and push
    // cy.get(gitSyncLocators.deployPreview).should("exist");
    //cy.get(gitSyncLocators.deployPreview).contains("ago");

    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  it("post connection app name deploy menu", function() {
    cy.get(homePage.applicationName).click();
    cy.get(commonLocators.appNameDeployMenu).click();
    cy.get(commonLocators.appNameDeployMenuPublish).click();
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

    cy.get(homePage.applicationName).click();
    cy.get(commonLocators.appNameDeployMenu).click();
    cy.get(commonLocators.appNameDeployMenuCurrentVersion).click();

    cy.get(homePage.applicationName).click();
    cy.get(commonLocators.appNameDeployMenu).click();
    cy.get(commonLocators.appNameDeployMenuConnectToGit).should("not.exist");
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
