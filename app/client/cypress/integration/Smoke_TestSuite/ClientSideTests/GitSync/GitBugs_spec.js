import gitSyncLocators from "../../../../locators/gitSyncLocators";
const pagename = "ChildPage";
const tempBranch = "tempBranch";
const tempBranch0 = "tempBranch0";
const mainBranch = "master";
let repoName;

describe("Git sync Bugs", function() {
  before(() => {
    cy.NavigateToHome();
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      const newOrganizationName = interception.response.body.data.name;
      cy.CreateAppForOrg(newOrganizationName, newOrganizationName);
    });

    cy.generateUUID().then((uid) => {
      repoName = uid;

      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
  });

  it("Bug:10773 When user delete a resource form the child branch and merge it back to parent branch, still the deleted resource will show up in the newly created branch", () => {
    // adding a new page "ChildPage" to master
    cy.Createpage(pagename);
    cy.get(".t--entity-name:contains('Page1')").click();
    cy.commitAndPush();
    cy.wait(2000);
    cy.createGitBranch(tempBranch);
    cy.CheckAndUnfoldEntityItem("PAGES");
    // verify tempBranch should contain this page
    cy.get(`.t--entity-name:contains("${pagename}")`).should("be.visible");
    cy.get(`.t--entity-name:contains("${pagename}")`).click();
    // delete page from tempBranch and merge to master
    cy.Deletepage(pagename);
    cy.commitAndPush();
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(8000);
    // verify ChildPage is not on master
    cy.switchGitBranch(mainBranch);
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains("${pagename}")`).should("not.exist");
    // create another branch and verify deleted page doesn't exist on it
    cy.createGitBranch(tempBranch0);
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains("${pagename}")`).should("not.exist");
  });
  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
