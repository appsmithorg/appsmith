const pages = require("../../../../locators/Pages.json");
// const jsActions = require("../../../../locators/jsActionLocators.json");
const commonLocators = require("../../../../locators/commonLocators.json");
import gitSyncLocators from "../../../../locators/gitSyncLocators";

describe("Git sync connect to repo", function() {
  before(() => {
    cy.createTestGithubRepo();
  });

  it("connects successfully", function() {
    cy.connectToGitRepo();
  });

  it("creates a new branch", function() {
    cy.get(commonLocators.canvas).click({ force: true });
    cy.createGitBranch("ParentBranch");
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

    cy.createGitBranch("ChildBranch");

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

    cy.switchGitBranch("ParentBranch");

    cy.get(`.t--entity-name:contains("ChildPage1")`).should("not.exist");
    cy.get(`.t--entity-name:contains("ChildApi1")`).should("not.exist");
    cy.get(`.t--entity-name:contains("ChildJsAction1")`).should("not.exist");
  });

  // rename entities
  it("makes branch specific resource updates", function() {
    cy.switchGitBranch("ChildBranch");

    cy.GlobalSearchEntity("ParentPage1");
    cy.RenameEntity("ParentPageRenamed", true);
    cy.GlobalSearchEntity("ParentApi1");
    cy.RenameEntity("ParentApiRenamed");
    // cy.GlobalSearchEntity("ChildJsAction1");
    // cy.RenameEntity("ParentJsActionRenamed");

    cy.switchGitBranch("ParentBranch");

    cy.GlobalSearchEntity("ParentPageRenamed", true);
    cy.get(`.t--entity-name:contains("ParentPageRenamed")`).should("not.exist");
    cy.GlobalSearchEntity("ParentApiRenamed", true);
    cy.get(`.t--entity-name:contains("ParentApiRenamed")`).should("not.exist");
    // cy.get(`.t--entity-name:contains("ParentJsActionRenamed")`).should(
    //   "not.exist",
    // );
  });

  after(() => {
    cy.deleteTestGithubRepo();
  });
});
