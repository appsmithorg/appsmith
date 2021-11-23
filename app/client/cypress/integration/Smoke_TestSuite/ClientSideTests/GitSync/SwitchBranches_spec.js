const pages = require("../../../../locators/Pages.json");
// const jsActions = require("../../../../locators/jsActionLocators.json");
const commonLocators = require("../../../../locators/commonLocators.json");
const explorer = require("../../../../locators/explorerlocators.json");
import gitSyncLocators from "../../../../locators/gitSyncLocators";
import homePage from "../../../../locators/HomePage";

const parentBranchKey = "ParentBranch";
const childBranchKey = "ChildBranch";
const branchQueryKey = "branch";

let repoName;
describe("Git sync connect to repo", function() {
  before(() => {
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo();
    });
  });

  it("connects successfully", function() {
    cy.connectToGitRepo();
  });

  it("creates a new branch", function() {
    cy.get(commonLocators.canvas).click({ force: true });
    cy.createGitBranch(parentBranchKey);
  });

  it("creates branch specific resources", function() {
    cy.Createpage("ParentPage1");
    cy.get(pages.addEntityAPI)
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.CreateAPI("ParentApi1");
    // cy.get(jsActions.addJsActionButton)
    //   .last()
    //   .click({ force: true });
    // cy.wait("@createNewJSCollection");
    // cy.get(jsActions.name).click({ force: true });
    // cy.get(jsActions.nameInput)
    //   .type("{selectall}ParentJsAction1", { force: true })
    //   .should("have.value", "ParentJsAction1")
    //   .blur();
    // cy.wait("@renameJsAction");
    // Added because api name edit takes some time to
    // reflect in api sidebar after the call passes.
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    // cy.wait(2000);

    cy.createGitBranch(childBranchKey);

    cy.Createpage("ChildPage1");
    cy.get(pages.addEntityAPI)
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.CreateAPI("ChildApi1");
    // cy.get(jsActions.addJsActionButton)
    //   .last()
    //   .click({ force: true });
    // cy.wait("@createNewJSCollection");
    // cy.get(jsActions.name).click({ force: true });
    // cy.get(jsActions.nameInput)
    //   .type("{selectall}ChildJsAction1", { force: true })
    //   .should("have.value", "ChildJsAction1")
    //   .blur();
    // cy.wait("@renameJsAction");
    // Added because api name edit takes some time to
    // reflect in api sidebar after the call passes.
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.GlobalSearchEntity("ParentPage1");
    cy.contains("ParentPage1").click();
    cy.get(commonLocators.canvas);

    cy.switchGitBranch(parentBranchKey);

    cy.get(`.t--entity-name:contains("ChildPage1")`).should("not.exist");
    cy.get(`.t--entity-name:contains("ChildApi1")`).should("not.exist");
    cy.get(`.t--entity-name:contains("ChildJsAction1")`).should("not.exist");
  });

  // rename entities
  it("makes branch specific resource updates", function() {
    cy.switchGitBranch(childBranchKey);

    cy.GlobalSearchEntity("ParentPage1");
    cy.RenameEntity("ParentPageRenamed", true);
    cy.GlobalSearchEntity("ParentApi1");
    cy.RenameEntity("ParentApiRenamed");
    // cy.GlobalSearchEntity("ChildJsAction1");
    // cy.RenameEntity("ParentJsActionRenamed");

    cy.switchGitBranch(parentBranchKey);

    cy.GlobalSearchEntity("ParentPageRenamed", true);
    cy.get(`.t--entity-name:contains("ParentPageRenamed")`).should("not.exist");
    cy.GlobalSearchEntity("ParentApiRenamed", true);
    cy.get(`.t--entity-name:contains("ParentApiRenamed")`).should("not.exist");
    // cy.get(`.t--entity-name:contains("ParentJsActionRenamed")`).should(
    //   "not.exist",
    // );
  });

  it("enables switching branch from the URL", () => {
    cy.url().then((url) => {
      cy.GlobalSearchEntity("ParentPage1");
      cy.contains("ParentPage1").click();
      cy.contains("ParentPage1").click(); // to unfurl
      cy.get(explorer.addWidget).click();
      cy.dragAndDropToCanvas("tablewidget", { x: 200, y: 200 });
      cy.get(".t--widget-tablewidget").should("exist");
      cy.commitAndPush();

      const urlObject = new URL(url);
      urlObject.searchParams.set(branchQueryKey, childBranchKey);
      cy.visit(urlObject.toString());

      cy.get(".bp3-spinner").should("exist");
      cy.get(".bp3-spinner").should("not.exist");

      cy.get(".t--widget-tablewidget").should("not.exist");

      cy.commitAndPush();

      cy.get(homePage.deployPopupOptionTrigger).click();

      cy.get(homePage.currentDeployedPreviewBtn)
        .invoke("removeAttr", "target")
        .click();

      cy.wait("@viewPage");

      cy.get(".t--widget-tablewidget").should("not.exist");

      cy.url().then((url) => {
        const urlObject = new URL(url);
        urlObject.searchParams.set(branchQueryKey, parentBranchKey);
        cy.visit(urlObject.toString());
        cy.wait("@viewPage");

        cy.get(".t--widget-tablewidget").should("exist");
      });
    });
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
