import homePage from "../../../../../locators/HomePage";
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");

describe("Multiple Permission flow ", function() {
  let workspaceId;
  let appid;
  let newWorkspaceName;
  const appName2 = "testView";
  const PermissionWorkspaceLevel = "CreatePermissionWorkspaceLevel";
  const PermissionAppLevel = "CreatePermissionAppLevel";
  const PermissionPageLevel = "CreatePermissionPageLevel";

  beforeEach(() => {
    cy.AddIntercepts();
  });

  before(() => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceName = uid;
      appName = uid;
      localStorage.setItem("WorkspaceName", workspaceId);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceId);
      });
      cy.CreateAppForWorkspace(workspaceId, appid);
      cy.get(generatePage.generateCRUDPageActionCard).click();

      cy.get(generatePage.selectDatasourceDropdown).click();

      cy.contains("Connect New Datasource").click();

      cy.createMockDatasource("users");
      cy.get(generatePage.selectTableDropdown).click();

      cy.get(generatePage.dropdownOption)
        .contains("public.users")
        .click();
      cy.get(generatePage.generatePageFormSubmitBtn).click();

      cy.wait("@replaceLayoutWithCRUDPage").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
      cy.wait("@getActions");
      cy.wait("@postExecute").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      cy.ClickGotIt();
      cy.CheckAndUnfoldEntityItem("QUERIES/JS");
      // verify app has execute query access
      cy.get(".t--entity-item:contains(SelectQuery)").click();
      cy.runQuery();
      cy.NavigateToHome();
      cy.CreateAppForWorkspace(newWorkspaceName, appName2);
      cy.visit("settings/general");
      // cy.CreatePermission(role, workspaceName, appName, "Page1");
      cy.get(RBAC.rolesTab).click();
      cy.wait("@fetchRoles").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(RBAC.addButton).click();
      cy.wait("@createRole").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
      // create workspace level role and verify all permissions are checked
      cy.get(`#${newWorkspaceName}-create`).should("be.checked");
      cy.get(`#${newWorkspaceName}-edit`).should("be.checked");
      cy.get(`#${newWorkspaceName}-delete`).should("be.checked");
      cy.get(`#${newWorkspaceName}-view`).should("be.checked");
      // uncheck the create datasource permission
      cy.get(RBAC.dataSourcesandQueriesTab).click();
      // add locator once frontend is ready
      cy.get(RBAC.backButton).click();
      // assert new role is showing in roles table
      // assign it to user1
      cy.AddUsers(Cypress.env("TESTUSERNAME1"), Role);
      // create new role; create app level
      cy.CreatePermissionAppLevel(PermissionAppLevel, newWorkspaceName, appid);
      // uncheck the execute query permission
      cy.get(RBAC.dataSourcesandQueriesTab).click();
      // add locator once frontend is ready
      cy.get(RBAC.backButton).click();
      // assign it to user2
      cy.CreatePermissionPageLevel(
        PermissionPageLevel,
        newWorkspaceName,
        "Page2",
      );
      // assign it to user3
      cy.LogOut();
    });
  });
  it("1. Multiple orgs and multiple permission(create new workspace: & edit exisitng apps )", () => {
    // login as user1@appsmith.com now the user can create new workspaces
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    cy.wait(2000);
    cy.get(homePage.searchInput).type(appid);
    // verify create new app button is not visible to user
    cy.xpath(homePage.createNewAppButton).should("not.exist");
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    cy.wait(2000);
    //user can edit app1 inside the org1
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 600 });
  });
  it("2. Multiple orgs and multiple permission(edit: workspace  & create new app and make app public )", () => {
    /*Login as Admin@appsmith.com
        Add edit access for workspace in others tab
        add create access for workspaace in Application resource page
        Add view access for aap1 in org 1
        add public access for workspace
        */
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.wait(2000);
    // verify user can edit workspace settings
    cy.renameWorkspace(newWorkspaceName, workspaceId);
    //user can create new apps
    cy.xpath(homePage.createNewAppButton).should("be.visible");
    //user can only have launch (view access for app1)
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).should("not.exist");
    cy.xpath(homePage.launchBtn).click();
    //By default the user can make any app public in org1
    cy.get(homePage.shareApp).click();
    cy.enablePublicAccess();
  });

  it("3. Multiple orgs and multiple permission(edit/view: application resources)", () => {
    /* Login as Admin@appsmith.com
            create access for org1 in application resource page
            create access for app 1
            no create access for app 2
            edit access for org 1
            edit access for app1
            only view access for app2
             */
    //Login as user1@appsmith.com now the user can create a new app in org 1
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME3"),
      Cypress.env("TESTPASSWORD3"),
    );
    cy.wait(2000);
    // Can edit the app1 and add pages/query/js
    cy.get(homePage.searchInput).type(appid);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    // verify user should be able to edit the app
    cy.get('.t--entity-name:contains("Page1")').click();
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 600 });
    // verify user should be able to create new query/page in app
    cy.createJSObject('return "Success";');
    // can just view the app2 in the view mode
    cy.NavigateToHome();
    cy.get(homePage.searchInput).type(appName2);
    cy.wait(2000);
    cy.get(homePage.appEditIcon).should("not.exist");
    cy.launchApp(appName2);
  });

  it.skip("4. Multiple orgs and multiple permission(edit/public access: application resources)", () => {
    /*Login as Admin@appsmith.com
              Add edit access for workspace in others tab
              add create access for workspace in Application resource page
              Add view access for aap1 in org 1
              add public access for app1 in org1 
              Add edit acess for app 2 in org 1
              Remove public access for app2 in org 1
        */
    // Login as user1@appsmith.com now the user can edit old workspaces detailes
    //user can create new apps
    //user can only have launch (view access for app1)
    //The user can make app1 as public and share for the users
    //The public toggle button should be hidden in the app2
  });
});
