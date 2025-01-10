import homePageLocators from "../../../../../locators/HomePage";
import reconnectDatasourceModal from "../../../../../locators/ReconnectLocators";
const datasourceEditor = require("../../../../../locators/DatasourcesEditor.json");
const jsObject = "JSObject1";
let newBranch = "feat/temp";
const mainBranch = "master";
let repoName, newWorkspaceName;
import {
  agHelper,
  dataSources,
  deployMode,
  gitSync,
  homePage,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";

describe(
  "Git import flow ",
  {
    tags: [
      "@tag.Git",
      "@tag.Sanity",
      "@tag.AccessControl",
      "@tag.Workflows",
      "@tag.Module",
      "@tag.Theme",
      "@tag.JS",
      "@tag.Container",
      "@tag.ImportExport",
    ],
  },
  function () {
    it("1. Import an app from JSON with Postgres, MySQL, Mongo db & then connect it to Git", () => {
      homePage.NavigateToHome();
      agHelper.GetNClick(homePageLocators.createNew, 0);
      cy.get(homePageLocators.workspaceImportAppOption).click({ force: true });
      cy.get(homePageLocators.workspaceImportAppModal).should("be.visible");
      cy.xpath(homePageLocators.uploadLogo).should("be.visible");
      cy.xpath(homePageLocators.uploadLogo).selectFile(
        "cypress/fixtures/gitImport.json",
        { force: true },
      );
      cy.wait(4000);
      cy.wait("@importNewApplication").then((interception) => {
        cy.log(interception.response.body.data);
        cy.get(reconnectDatasourceModal.Modal).should("be.visible");
        // should check reconnect modal opening
        cy.get(reconnectDatasourceModal.Modal).should("be.visible");
        cy.ReconnectDatasource("TEDPostgres");
        cy.wait(1000);
        dataSources.FillPostgresDSForm();
        cy.testDatasource(true);
        agHelper.GetNClick(dataSources._saveDs);
        cy.wait(1000);
        cy.ReconnectDatasource("TEDMySQL");
        cy.wait(500);
        dataSources.FillMySqlDSForm();
        cy.testDatasource(true);
        agHelper.GetNClick(dataSources._saveDs);
        cy.get(reconnectDatasourceModal.Modal).should("be.visible");
        cy.ReconnectDatasource("TEDMongo");
        cy.wait(1000);
        dataSources.FillMongoDSForm();
        cy.testDatasource(true);
        dataSources.SaveDatasource(true);
        cy.wait("@getWorkspace");
        cy.get(reconnectDatasourceModal.ImportSuccessModal).should(
          "be.visible",
        );
        cy.get(reconnectDatasourceModal.ImportSuccessModalCloseBtn).click({
          force: true,
        });
        cy.wait(1000);

        gitSync.CreateNConnectToGit();
        cy.get("@gitRepoName").then((repName) => {
          repoName = repName;
          gitSync.CreateGitBranch(repoName);
        });

        agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);
      });
    });

    it("2. Import the previous app connected to Git and reconnect Postgres, MySQL and Mongo db ", () => {
      homePage.NavigateToHome();
      cy.createWorkspace();
      let newWorkspaceName;
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.CreateAppForWorkspace(newWorkspaceName, "gitImport");
      });
      gitSync.ImportAppFromGit(newWorkspaceName, repoName);
      cy.wait(5000);
      cy.get(reconnectDatasourceModal.Modal).should("be.visible");
      cy.ReconnectDatasource("TEDPostgres");
      cy.wait(500);
      cy.fillPostgresDatasourceForm();
      cy.get(datasourceEditor.sectionAuthentication).click();
      cy.testDatasource(true);
      agHelper.GetNClick(dataSources._saveDs);
      cy.wait(500);
      cy.ReconnectDatasource("TEDMySQL");
      cy.wait(500);
      cy.fillMySQLDatasourceForm();
      cy.get(datasourceEditor.sectionAuthentication).click();
      cy.testDatasource(true);
      agHelper.GetNClick(dataSources._saveDs);
      cy.wait(500);
      cy.ReconnectDatasource("TEDMongo");
      cy.wait(500);
      dataSources.FillMongoDSForm();
      cy.get(datasourceEditor.sectionAuthentication).click();
      cy.testDatasource(true);
      agHelper.GetNClick(dataSources._saveDs);
      cy.wait(2000);
      cy.get(reconnectDatasourceModal.ImportSuccessModal).should("be.visible");
      cy.get(reconnectDatasourceModal.ImportSuccessModalCloseBtn).click({
        force: true,
      });
      cy.wait("@gitStatus").then((interception) => {
        cy.log(interception.response.body.data);
        cy.get(gitSync.locators.quickActionsPullBtn).should("be.visible");
      });
      agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);

      cy.get(gitSync.locators.quickActionsPullBtn).should("be.visible");
      cy.get("body").then(($body) => {
        if ($body.find(gitSync.locators.quickActionsCommitCount).length > 0) {
          gitSync.CommitAndPush();
        }
      });
    });

    it("3. Verfiy imported app should have all the data binding visible in view and edit mode", () => {
      // verify postgres data binded to table
      cy.get(".tbody").should("contain.text", "Test user 7");
      //verify MySQL data binded to table
      cy.get(".tbody").should("contain.text", "New Config");
      // verify api response binded to input widget
      cy.xpath("//input[@value='this is a test']").should("be.visible");
      // verify js object binded to input widget
      cy.xpath("//input[@value='Success']").should("be.visible");
    });

    it("4. Create a new branch, clone page and validate data on that branch in view and edit mode", () => {
      //cy.createGitBranch(newBranch);
      gitSync.CreateGitBranch(newBranch, true);

      cy.get("@gitbranchName").then((branName) => {
        newBranch = branName;
        cy.log("newBranch is " + newBranch);
      });
      cy.get(".tbody").should("contain.text", "Test user 7");
      // verify MySQL data binded to table
      cy.get(".tbody").should("contain.text", "New Config");
      // verify api response binded to input widget
      cy.xpath("//input[@value='this is a test']");
      // verify js object binded to input widget
      cy.xpath("//input[@value='Success']");

      PageList.ClonePage();

      // verify jsObject is not duplicated
      cy.get(".t--widget-tablewidget").should("be.visible");
      EditorNavigation.SelectEntityByName(jsObject, EntityType.JSObject); //Also checking jsobject exists after cloning the page
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
        "be.visible",
      );

      // deploy the app and validate data binding
      cy.wait(2000);
      cy.get(homePageLocators.publishButton).click();
      agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);
      cy.get(gitSync.locators.opsCommitInput).type("Initial Commit");
      cy.get(gitSync.locators.opsCommitBtn).click();
      cy.intercept("POST", "api/v1/git/commit/app/*").as("commit");
      agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);
      gitSync.CloseOpsModal();
      cy.get(gitSync.locators.quickActionsPullBtn).should("be.visible");
      gitSync.MergeToMaster();
      cy.wait(2000);
      cy.latestDeployPreview();
      table.AssertTableLoaded();
      // verify api response binded to input widget
      cy.xpath("//input[@value='this is a test']");
      // verify js object binded to input widget
      cy.xpath("//input[@value='Success']");
      // navigate to Page1 and verify data
      cy.get(".t--page-switch-tab").contains("Page1").click({ force: true });
      table.AssertTableLoaded();
      // verify api response binded to input widget
      cy.xpath("//input[@value='this is a test']");
      // verify js object binded to input widget
      cy.xpath("//input[@value='Success']");
      deployMode.NavigateBacktoEditor();
    });

    it("5. Switch to master and verify data in edit and view mode", () => {
      cy.switchGitBranch("master");
      cy.get(gitSync.locators.branchItem).should("be.visible");
      // validate data binding in edit and deploy mode
      cy.latestDeployPreview();
      cy.get(".tbody").should("have.length", 2);
      table.AssertTableLoaded(0, 1, "v1");
      cy.xpath("//input[@value='this is a test']");
      cy.xpath("//input[@value='Success']");
      // navigate to Page1 and verify data
      cy.get(".t--page-switch-tab")
        .contains("Page1 Copy")
        .click({ force: true });
      table.AssertTableLoaded(0, 1, "v1");
      cy.xpath("//input[@value='this is a test']");
      cy.xpath("//input[@value='Success']");
      deployMode.NavigateBacktoEditor();
    });

    it("6. Add widget to master, merge then checkout to child branch and verify data", () => {
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.get(".t--entity-name").should("be.visible");
      cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 600 });
      cy.get(gitSync.locators.commitButton).should("be.visible");
      gitSync.CommitAndPush();
      cy.merge(newBranch);
      gitSync.CloseOpsModal();
      cy.get(gitSync.locators.branchItem).should("be.visible");
      cy.switchGitBranch(newBranch);
      cy.get(".t--widget-buttonwidget").should("be.visible");
      // verify button widget is visible on child branch
      cy.get(".t--widget-buttonwidget").should("be.visible");
    });

    after(() => {
      gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
