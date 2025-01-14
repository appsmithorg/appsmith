import * as _ from "../../../../../support/Objects/ObjectsCore";
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

describe(
  "Git with Theming:",
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
    const backgroudColorMaster = "rgb(22, 163, 74)";
    const backgroudColorChildBranch = "rgb(100, 116, 139)";
    const tempBranch = "tempBranch";
    let repoName;
    let applicationId = null;
    let applicationName = null;
    before(() => {
      _.homePage.NavigateToHome();
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        const newWorkspaceName = interception.response.body.data.name;
        cy.generateUUID().then((uid) => {
          cy.CreateAppForWorkspace(newWorkspaceName, uid);
          applicationName = uid;
          cy.get("@currentApplicationId").then(
            (currentAppId) => (applicationId = currentAppId),
          );
        });
      });

      _.gitSync.CreateNConnectToGit();
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
        _.gitSync.CreateGitBranch(repoName);
      });
    });
    it("1. Bug #13860 Theming is not getting applied on view mode when the app is connected to Git", function () {
      _.appSettings.OpenAppSettings();
      _.appSettings.GoToThemeSettings();
      // apply theme on master branch and deploy
      cy.get(commonlocators.changeThemeBtn).click({ force: true });

      cy.get(commonlocators.themeCard).eq(1).click({ force: true });

      // check for alert
      cy.get(`${commonlocators.themeCard}`)
        .eq(1)
        .siblings("div")
        .first()
        .invoke("text")
        .then((text) => {
          cy.get(commonlocators.toastmsg).contains(`Theme ${text} applied`);
        });
      _.appSettings.ClosePane();
      // drag a widget and assert theme is applied
      cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 700 });
      //cy.get('.t--draggable-buttonwidget').closest("div").should('have.css' , 'background-color', backgroudColorChildBranch)
      cy.get(widgetsPage.widgetBtn).should(
        "have.css",
        "background-color",
        backgroudColorMaster,
      ); //Widget Color
      cy.commitAndPush();
      cy.get(_.gitSync.locators.branchButton).should("be.visible");
      _.gitSync.CreateGitBranch(tempBranch);
      //cy.createGitBranch(tempBranch);
      cy.get(".canvas").should("be.visible");
      cy.get(".canvas").click(0, 0, { force: true });
      // change theme on tempBranch
      _.appSettings.OpenAppSettings();
      _.appSettings.GoToThemeSettings();
      cy.get(commonlocators.changeThemeBtn).click({ force: true });

      // select a theme
      cy.get(commonlocators.themeCard).last().click({ force: true });

      // check for alert
      cy.get(`${commonlocators.themeCard}`)
        .last()
        .siblings("div")
        .first()
        .invoke("text")
        .then((text) => {
          cy.get(commonlocators.toastmsg).contains(`Theme ${text} applied`);
        });
      _.appSettings.ClosePane();

      cy.get(widgetsPage.widgetBtn).should(
        "have.css",
        "background-color",
        backgroudColorChildBranch,
      ); //Widget Color
      cy.commitAndPush();
      //assert theme is applied in view mode
      cy.latestDeployPreview();
      cy.get(widgetsPage.widgetBtn).should(
        "have.css",
        "background-color",
        backgroudColorChildBranch,
      ); //Widget Color
      cy.get(commonlocators.backToEditor).click();
      cy.get(".t--canvas-artboard").should("be.visible");
    });

    after(() => {
      //clean up
      _.gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
