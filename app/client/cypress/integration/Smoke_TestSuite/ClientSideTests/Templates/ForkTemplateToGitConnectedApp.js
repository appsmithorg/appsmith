import template from "../../../../locators/TemplatesLocators.json";
import gitSyncLocators from "../../../../locators/gitSyncLocators";
import widgetLocators from "../../../../locators/Widgets.json";
let repoName;
let appId;
const branchName = "test/template";
const mainBranch = "master";
const jsObject = "Utils";
const homePage = require("../../../../locators/HomePage");

describe("Fork a template to the current app", () => {
  before(() => {
    cy.NavigateToHome();
    cy.generateUUID().then((id) => {
      appId = id;
      cy.CreateAppInFirstListedWorkspace(id);
      localStorage.setItem("AppName", appId);
    });
    cy.generateUUID().then((uid) => {
      repoName = uid;

      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
  });

  it("1.Bug #17002 Forking a template into an existing app which is connected to git makes the application go into a bad state ", function() {
    cy.wait(5000);
    cy.get(template.startFromTemplateCard).click();
    cy.wait("@fetchTemplate").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(1000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath(
      "//div[text()='Customer Support Dashboard']/following-sibling::div//button[contains(@class, 'fork-button')]",
    ).click();
    cy.wait("@getTemplatePages").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
    cy.commitAndPush();
  });
  it("2. Bug #17262 On forking template to a child branch of git connected app is throwing Page not found error ", function() {
    cy.createGitBranch(branchName);
    cy.CreatePage();
    cy.get(template.startFromTemplateCard).click();

    cy.wait(5000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath("//div[text()='Customer Support Dashboard']").click();

    cy.xpath(template.selectAllPages)
      .next()
      .click();
    cy.wait(1000);
    cy.xpath("//span[text()='SEARCH']")
      .parent()
      .next()
      .click();
    // [Bug]: On forking selected pages from a template, resource not found error is shown #17270
    cy.get(template.templateViewForkButton).click();

    cy.wait(3000);
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
    // [Bug]: On forking a template the JS Objects are not cloned #17425
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.get(`.t--entity-name:contains(${jsObject})`).should("have.length", 1);
    cy.NavigateToHome();
    cy.get(homePage.searchInput)
      .clear()
      .type(appId);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon)
      .first()
      .click({ force: true });
    cy.wait(5000);
    cy.switchGitBranch(branchName);
    cy.get(homePage.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait(10000);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });
});
