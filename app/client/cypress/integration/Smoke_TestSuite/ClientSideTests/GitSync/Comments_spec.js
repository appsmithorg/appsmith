const commonLocators = require("../../../../locators/commonlocators.json");
const commentsLocators = require("../../../../locators/commentsLocators.json");
const { typeIntoDraftEditor } = require("../Comments/utils");

const newCommentText1 = "new comment text 1";

let repoName;
describe("Git sync connect to repo", function() {
  before(() => {
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
    });
  });

  // test comments across branches
  it("has branch specific comments", function() {
    // signing up with a new user for a predictable behaviour,so that even if the comments spec
    // is run along with this spec the onboarding is always triggered
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmith.com`, uid);
    });
    cy.NavigateToHome();
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      const newOrganizationName = interception.response.body.data.name;
      cy.CreateAppForOrg(newOrganizationName, newOrganizationName);
    });

    cy.connectToGitRepo(repoName);

    cy.skipCommentsOnboarding();
    // wait for comment mode to be set
    cy.wait(1000);

    cy.createGitBranch("ChildBranch");
    // Add a comment on the child branch
    cy.get(commonLocators.canvas).click(50, 50);
    typeIntoDraftEditor(commentsLocators.mentionsInput, newCommentText1);
    cy.get(commentsLocators.mentionsInput).type("{enter}");
    cy.switchGitBranch("master");
    cy.get(newCommentText1).should("not.exist");
  });

  it("post connection success", function() {
    cy.get(homePage.applicationName).click();
    cy.get(commonLocators.appNameDeployMenu).click();
    cy.get(commonLocators.appNameDeployMenuConnectToGit).click();
    cy.get(gitSyncLocators.gitSyncModal);
    cy.contains("Deploy")
      .parent()
      .should("have.class", "react-tabs__tab--selected");

    cy.window().then((window) => {
      cy.stub(window, "open").callsFake((url) => {
        expect(url.indexOf("branch=master")).to.be.at.least(0);
        const viewerPathMatch = matchViewerPath(trimQueryString(url));
        expect(!!viewerPathMatch).to.be.true;
      });
    });

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
