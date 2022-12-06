import homePage from "../../../../../locators/HomePage";
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const template = require("../../../../../locators/TemplatesLocators.json");
import widgetLocators from "../../../../../locators/Widgets.json";
const publishPage = require("../../../../../locators/publishWidgetspage.json");
let currentUrl;

describe("View Permission flow ", function() {
  let workspaceName;
  let appName;
  let newWorkspaceName;
  const PermissionWorkspaceLevel =
    "ViewPermissionWorkspaceLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionAppLevel =
    "ViewPermissionAppLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionPageLevel =
    "ViewPermissionPageLevel" + `${Math.floor(Math.random() * 1000)}`;
  let AppName2;

  beforeEach(() => {
    cy.AddIntercepts();
  });

  before(() => {
    cy.AddIntercepts();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));

    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceName = uid;
      appName = uid + "view";
      localStorage.setItem("WorkspaceName", workspaceName);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceName);

        cy.CreateAppForWorkspace(workspaceName, appName);
        cy.wait(2000);
        cy.get(template.startFromTemplateCard).click();
        cy.wait("@fetchTemplate").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(5000);
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
        cy.PublishtheApp();
        cy.get(publishPage.backToEditor).click({ force: true });
        cy.NavigateToHome();

        cy.generateUUID().then((uid) => {
          AppName2 = uid + "pg";

          cy.CreateAppForWorkspace(workspaceName, AppName2);
        });
        cy.wait(2000);
        cy.visit("settings/general");
        cy.ViewPermissionWorkspaceLevel(
          PermissionWorkspaceLevel,
          workspaceName,
        );
        // add make public permission as well
        cy.get(RBAC.roleRow)
          .first()
          .click();
        cy.wait("@fetchRoles").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        // check the create datasource role
        cy.contains("td", `${workspaceName}`)
          .next()
          .next()
          .next()
          .next()
          .next()
          .click();
        // save role
        cy.get(RBAC.saveButton).click();
        cy.wait("@saveRole").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(2000);
        cy.ViewPermissionAppLevel(PermissionAppLevel, workspaceName, appName);
        cy.ViewPermissionPageLevel(
          PermissionPageLevel,
          workspaceName,
          appName,
          "Dashboard",
        );
        cy.wait(2000);
        cy.AssignRoleToUser(
          PermissionWorkspaceLevel,
          Cypress.env("TESTUSERNAME1"),
        );
        cy.AssignRoleToUser(PermissionAppLevel, Cypress.env("TESTUSERNAME2"));
        cy.AssignRoleToUser(PermissionPageLevel, Cypress.env("TESTUSERNAME3"));
        cy.wait(2000);
        cy.LogOut();
      });
    });
  });
  it("1. View permission : Workspace level (View all apps in same workspace)", function() {
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    cy.get(homePage.searchInput).type(appName);
    cy.wait(2000);
    cy.get(homePage.appsContainer).contains(workspaceName);
    cy.get(homePage.applicationCard).trigger("mouseover");
    cy.get(homePage.appEditIcon).should("not.exist");
    cy.launchApp(appName);
    cy.get(homePage.backtoHome).click();
    cy.wait(2000);
    cy.get(homePage.searchInput)
      .clear()
      .type(AppName2);
    cy.wait(2000);
    cy.get(homePage.appsContainer).contains(workspaceName);
    cy.get(homePage.applicationCard).trigger("mouseover");
    cy.get(homePage.appEditIcon).should("not.exist");
    cy.launchApp(appName);
  });

  it("2.Verify user with make Public permission, is able to make app public", function() {
    cy.get("[data-cy=viewmode-share]").click();
    cy.enablePublicAccess();
    currentUrl = cy.url();
    cy.url().then((url) => {
      currentUrl = url;
      cy.log(currentUrl);
      cy.LogOut();
      cy.visit(currentUrl);
      cy.wait("@getPagesForViewApp").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.wait(3000);
      cy.get(publishPage.pageInfo)
        .invoke("text")
        .then((text) => {
          const someText = text;
          expect(someText).to.equal("This page seems to be blank");
        });
    });
  });
  it("3.View permission : App level (View that app only)", function() {
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.get(homePage.searchInput).type(AppName2);
    cy.wait(2000);
    cy.get(homePage.applicationCard).should("not.exist");
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    cy.wait(2000);
    cy.get(homePage.appsContainer).contains(workspaceName);
    cy.get(homePage.applicationCard).trigger("mouseover");
    cy.get(homePage.appEditIcon).should("not.exist");
    cy.launchApp(appName);
    cy.get(homePage.backtoHome).click();
  });
  it("4. View permission : Page level (View page is visible) ", function() {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME3"),
      Cypress.env("TESTPASSWORD3"),
    );
    cy.get(homePage.searchInput).type(appName);
    cy.wait(2000);
    cy.get(homePage.appsContainer).contains(workspaceName);
    cy.get(homePage.applicationCard).trigger("mouseover");
    cy.get(homePage.appEditIcon).should("not.exist");
    cy.launchApp(appName);
    cy.get(".t--page-switch-tab").should("not.contain", "Dashboard");
  });

  after(() => {
    cy.LogOut();
    cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/roles");
    cy.DeleteRole(PermissionWorkspaceLevel);
    cy.DeleteRole(PermissionAppLevel);
    cy.DeleteRole(PermissionPageLevel);
  });
});
