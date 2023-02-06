import template from "../../../../locators/TemplatesLocators.json";
import gitSyncLocators from "../../../../locators/gitSyncLocators";
import widgetLocators from "../../../../locators/Widgets.json";
let repoName;
let appId;
let branchName = "test/template";
const jsObject = "JSObject1";
const homePage = require("../../../../locators/HomePage");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Fork a template to the current app", () => {
  before(() => {
    cy.NavigateToHome();
    cy.generateUUID().then((id) => {
      appId = id;
      cy.CreateAppInFirstListedWorkspace(id);
      localStorage.setItem("AppName", appId);
    });
    _.gitSync.CreateNConnectToGit(repoName);
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
    _.agHelper.Sleep(2000);
  });

  it("1.Bug #17002 Forking a template into an existing app which is connected to git makes the application go into a bad state ", function() {
    cy.get(template.startFromTemplateCard).click();
    cy.wait("@fetchTemplate", { timeout: 30000 }).should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(1000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.wait("@getTemplatePages").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(
      "//div[text()='Meeting Scheduler']/following-sibling::div//button[contains(@class, 'fork-button')]//span[contains(@class, 't--left-icon')]",
    )
      .scrollIntoView()
      .click();
    cy.waitUntil(() => cy.xpath("//span[text()='Setting up the template']"), {
      errorMsg: "Setting Templates did not finish even after 75 seconds",
      timeout: 950000,
      interval: 5000,
    }).then(($ele) => {
      cy.wrap($ele).should("have.length", 0);
    });
    cy.wait(10000);
    cy.get("body").then(($ele) => {
      if ($ele.find(widgetLocators.toastAction).length <= 0) {
        if ($ele.find(template.templateViewForkButton).length > 0) {
          cy.get(template.templateViewForkButton).click();
        }
      }
    });
    // cy.get(widgetLocators.toastAction, { timeout: 40000 }).should(
    //   "contain",
    //   "template added successfully",
    // );
    cy.commitAndPush();
  });

  it("2. Bug #17262 On forking template to a child branch of git connected app is throwing Page not found error ", function() {
    _.gitSync.CreateGitBranch(branchName, true);
    cy.get("@gitbranchName").then((branName) => {
      branchName = branName;
      _.ee.AddNewPage();
      _.ee.AddNewPage("add-page-from-template");
      cy.get(template.templateDialogBox).should("be.visible");
      cy.xpath("//div[text()='Slack Bot']").click();
      cy.wait(10000); // for templates page to load fully
      // cy.xpath(template.selectAllPages)
      //   .next()
      //   .click();
      // cy.wait(1000);
      // cy.xpath("//span[text()='SEARCH']")
      //   .parent()
      //   .next()
      //   .click();
      // [Bug]: On forking selected pages from a template, resource not found error is shown #17270
      cy.get(template.templateViewForkButton).click();
      cy.wait(5000);
      cy.get(widgetLocators.toastAction, { timeout: 40000 }).should(
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
      cy.get(homePage.publishButton).click({ force: true });
      _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);
      cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
      cy.get(gitSyncLocators.commitButton).click();
      cy.wait(10000);
      cy.get(gitSyncLocators.closeGitSyncModal).click();
    });
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
