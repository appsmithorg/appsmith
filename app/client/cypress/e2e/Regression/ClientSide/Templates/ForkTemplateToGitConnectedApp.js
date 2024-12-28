import template from "../../../../locators/TemplatesLocators.json";
import widgetLocators from "../../../../locators/Widgets.json";
let repoName;
let newWorkspaceName;
let branchName = "test/template";
const jsObject = "Utils";
import homePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Fork a template to the current app",
  { tags: ["@tag.Templates", "@tag.excludeForAirgap"] },
  () => {
    before(() => {
      _.homePage.NavigateToHome();
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
      });
      _.gitSync.CreateNConnectToGit(repoName);
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });
      _.agHelper.Sleep(2000);
    });

    it("1.Bug #17002 Forking a template into an existing app which is connected to git makes the application go into a bad state ", function () {
      PageList.AddNewPage("Add page from template");
      _.agHelper.AssertElementExist(template.templateDialogBox);
      _.agHelper.GetNClick(template.templateCard);
      _.agHelper.GetNClick(template.templateViewForkButton);
      cy.waitUntil(() => cy.xpath("//span[text()='Setting up the template']"), {
        errorMsg: "Setting Templates did not finish even after 75 seconds",
        timeout: 75000,
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
    // skipping this test as saving page is taking lot of time
    it("2. Bug #17262 On forking template to a child branch of git connected app is throwing Page not found error ", function () {
      _.gitSync.CreateGitBranch(branchName, true);
      cy.get("@gitbranchName").then((branName) => {
        branchName = branName;
        PageList.AddNewPage();
        PageList.AddNewPage("Add page from template");
        cy.get(template.templateDialogBox).should("be.visible");
        cy.xpath("//h1[text()='Marketing Dashboard']").click();
        cy.wait(10000); // for templates page to load fully
        cy.get(template.selectCheckbox).first().click();
        cy.wait(1000);
        cy.get(template.selectCheckbox).eq(1).click();
        // [Bug]: On forking selected pages from a template, resource not found error is shown #17270
        cy.get(template.templateViewForkButton).click();
        cy.wait(5000);
        cy.get(widgetLocators.toastAction, { timeout: 40000 }).should(
          "contain",
          "template added successfully",
        );
        // [Bug]: On forking a template the JS Objects are not cloned #17425
        PageLeftPane.switchSegment(PagePaneSegment.JS);
        PageLeftPane.assertPresence(jsObject);
        _.homePage.NavigateToHome();
        cy.get(homePage.searchInput).clear().type(newWorkspaceName);
        cy.wait(2000);
        cy.get(homePage.applicationCard).first().trigger("mouseover");
        cy.get(homePage.appEditIcon).first().click({ force: true });
        cy.wait(20000); // add wait for page to save
        cy.switchGitBranch(branchName);
        cy.get(homePage.publishButton).click({ force: true });
        _.agHelper.AssertElementExist(_.gitSync.locators.quickActionsPullBtn);
        cy.get(gitSync.locators.opsCommitInput).type("Initial Commit");
        cy.get(gitSync.locators.opsCommitBtn).click();
        _.agHelper.AssertElementExist(_.gitSync.locators.quickActionsPullBtn);
        _.gitSync.CloseOpsModal();
      });
    });

    after(() => {
      _.gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
