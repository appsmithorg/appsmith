import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import homePage from "../../../../../locators/HomePage";
import reconnectDatasourceModal from "../../../../../locators/ReconnectLocators";
const commonlocators = require("../../../../../locators/commonlocators.json");
const datasourceEditor = require("../../../../../locators/DatasourcesEditor.json");
const jsObject = "JSObject1";
let newBranch = "feat/temp";
const mainBranch = "master";
let repoName, newWorkspaceName;
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Git import flow ", function () {
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });
  });
  it("1. Import an app from JSON with Postgres, MySQL, Mongo db & then connect it to Git", () => {
    cy.NavigateToHome();
    cy.get(homePage.optionsIcon).first().click();
    cy.get(homePage.workspaceImportAppOption).click({ force: true });
    cy.get(homePage.workspaceImportAppModal).should("be.visible");
    cy.wait(1000);
    cy.xpath(homePage.uploadLogo).attachFile("gitImport.json");
    cy.wait(4000);
    cy.wait("@importNewApplication").then((interception) => {
      cy.log(interception.response.body.data);
      cy.wait(1000);
      // should check reconnect modal opening
      cy.get(reconnectDatasourceModal.Modal).should("be.visible");
      cy.ReconnectDatasource("TEDPostgres");
      cy.wait(1000);
      cy.fillPostgresDatasourceForm();
      cy.get(datasourceEditor.sectionAuthentication).click();
      cy.testDatasource(true);
      cy.get(".t--save-datasource").click({ force: true });
      cy.wait(1000);
      cy.ReconnectDatasource("TEDMySQL");
      cy.wait(500);
      cy.fillMySQLDatasourceForm();
      cy.get(datasourceEditor.sectionAuthentication).click();
      cy.testDatasource(true);
      cy.get(".t--save-datasource").click({ force: true });
      cy.wait(1000);
      cy.ReconnectDatasource("TEDMongo");
      cy.wait(1000);
      cy.fillMongoDatasourceForm();
      cy.get(datasourceEditor.sectionAuthentication).click();
      cy.testDatasource(true);
      cy.get(".t--save-datasource").click({ force: true });
      cy.wait(2000);
      /*cy.get(homePage.toastMessage).should(
        "contain",
        "Application imported successfully",
      ); */
      cy.get(reconnectDatasourceModal.ImportSuccessModal).should("be.visible");
      cy.get(reconnectDatasourceModal.ImportSuccessModalCloseBtn).click({
        force: true,
      });
      cy.wait(1000);

      _.gitSync.CreateNConnectToGit();
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
        _.gitSync.CreateGitBranch(repoName);
      });

      _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);
    });
  });

  it("2. Import the previous app connected to Git and reconnect Postgres, MySQL and Mongo db ", () => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, "gitImport");
    });
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon).first().click();
    cy.get(homePage.workspaceImportAppOption).click({ force: true });
    cy.get(".t--import-json-card").next().click();
    cy.importAppFromGit(repoName);
    cy.wait(5000);
    cy.get(reconnectDatasourceModal.Modal).should("be.visible");
    cy.ReconnectDatasource("TEDPostgres");
    cy.wait(500);
    cy.fillPostgresDatasourceForm();
    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.testDatasource(true);
    cy.get(".t--save-datasource").click({ force: true });
    cy.wait(500);
    cy.ReconnectDatasource("TEDMySQL");
    cy.wait(500);
    cy.fillMySQLDatasourceForm();
    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.testDatasource(true);
    cy.get(".t--save-datasource").click({ force: true });
    cy.wait(500);
    cy.ReconnectDatasource("TEDMongo");
    cy.wait(500);
    cy.fillMongoDatasourceForm();
    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.testDatasource(true);
    cy.get(".t--save-datasource").click({ force: true });
    cy.wait(2000);
    cy.get(reconnectDatasourceModal.ImportSuccessModal).should("be.visible");
    cy.get(reconnectDatasourceModal.ImportSuccessModalCloseBtn).click({
      force: true,
    });
    /* cy.get(homePage.toastMessage).should(
      "contain",
     "Application imported successfully",
   ); */
    cy.wait("@gitStatus").then((interception) => {
      cy.log(interception.response.body.data);
      cy.wait(1000);
    });
    _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);

    cy.wait(3000); //for uncommited changes to appear if any!
    cy.get("body").then(($body) => {
      if ($body.find(gitSyncLocators.gitPullCount).length > 0) {
        cy.commitAndPush();
      }
    });
  });

  it("3. Verfiy imported app should have all the data binding visible in view and edit mode", () => {
    // verify postgres data binded to table
    cy.get(".tbody").first().should("contain.text", "Test user 7");
    //verify MySQL data binded to table
    cy.get(".tbody").last().should("contain.text", "New Config");
    // verify api response binded to input widget
    cy.xpath("//input[@value='this is a test']").should("be.visible");
    // verify js object binded to input widget
    cy.xpath("//input[@value='Success']").should("be.visible");
  });
  it("4. Create a new branch, clone page and validate data on that branch in view and edit mode", () => {
    //cy.createGitBranch(newBranch);
    _.gitSync.CreateGitBranch(newBranch, true);

    cy.get("@gitbranchName").then((branName) => {
      newBranch = branName;
      cy.log("newBranch is " + newBranch);
    });
    cy.get(".tbody").first().should("contain.text", "Test user 7");
    // verify MySQL data binded to table
    cy.get(".tbody").last().should("contain.text", "New Config");
    // verify api response binded to input widget
    cy.xpath("//input[@value='this is a test']");
    // verify js object binded to input widget
    cy.xpath("//input[@value='Success']");

    _.entityExplorer.ClonePage();

    // verify jsObject is not duplicated
    _.agHelper.Sleep(2000); //for cloning of table data to finish
    _.entityExplorer.SelectEntityByName(jsObject, "Queries/JS"); //Also checking jsobject exists after cloning the page
    _.entityExplorer.SelectEntityByName("Page1 Copy");
    cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
      "be.visible",
    );

    // deploy the app and validate data binding
    cy.wait(2000);
    cy.get(homePage.publishButton).click();
    _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.intercept("POST", "api/v1/git/commit/app/*").as("commit");
    _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.latestDeployPreview();
    _.table.AssertTableLoaded();
    // verify api response binded to input widget
    cy.xpath("//input[@value='this is a test']");
    // verify js object binded to input widget
    cy.xpath("//input[@value='Success']");
    // navigate to Page1 and verify data
    cy.get(".t--page-switch-tab").contains("Page1").click({ force: true });
    _.table.AssertTableLoaded();
    // verify api response binded to input widget
    cy.xpath("//input[@value='this is a test']");
    // verify js object binded to input widget
    cy.xpath("//input[@value='Success']");
    cy.get(commonlocators.backToEditor).click();
    cy.wait(2000);
  });

  it("5. Switch to master and verify data in edit and view mode", () => {
    cy.switchGitBranch("master");
    cy.wait(2000);
    // validate data binding in edit and deploy mode
    cy.latestDeployPreview();
    cy.get(".tbody").should("have.length", 2);
    cy.get(".tbody").first().should("contain.text", "Test user 7");
    cy.xpath("//input[@value='this is a test']");
    cy.xpath("//input[@value='Success']");
    // navigate to Page1 and verify data
    cy.get(".t--page-switch-tab").contains("Page1 Copy").click({ force: true });
    cy.get(".tbody").first().should("contain.text", "Test user 7");
    cy.xpath("//input[@value='this is a test']");
    cy.xpath("//input[@value='Success']");
    cy.get(commonlocators.backToEditor).click();
    cy.wait(2000);
  });

  it("6. Add widget to master, merge then checkout to child branch and verify data", () => {
    //_.canvasHelper.OpenWidgetPane();
    _.entityExplorer.NavigateToSwitcher("widgets");
    cy.wait(2000); // wait for transition
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 600 });
    cy.wait(3000);
    cy.commitAndPush();
    cy.merge(newBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.switchGitBranch(newBranch);
    cy.wait(4000);
    // verify button widget is visible on child branch
    cy.get(".t--widget-buttonwidget").should("be.visible");
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
