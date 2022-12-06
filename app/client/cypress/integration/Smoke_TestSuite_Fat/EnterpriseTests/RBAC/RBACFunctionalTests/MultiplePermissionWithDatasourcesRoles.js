import homePage from "../../../../../locators/HomePage";
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");

describe("Multiple Permission flow ", function() {
  let workspaceId;
  let appid;
  let newWorkspaceName;
  let workspaceName;
  let appName;
  const datasource = "users";
  const permissionWorkspaceLevel = "CreatePermissionWorkspaceLevel";
  const permissionAppLevel = "CreatePermissionAppLevel";
  const permissionPageLevel = "CreatePermissionPageLevel";
  const createAndViewPermission = "CreateandEditPermission";
  const createAndDeletePermission = "CreateandDeletePermission";

  beforeEach(() => {
    cy.startServerAndIntercepts();
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
      cy.CreateAppForWorkspace(workspaceId, appName);
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
    });
  });
  it("1. Multiple orgs and multiple permission(datasource Access )", () => {
    /*Login as Admin@appsmith.com
        Add Delete access for workspace in others tab
        Remove create access for work spaace in Application resource page
        Add edit access for the App1 in org 1
        Add edit access for Query 1 in app 1
        remove execute access for org1 from datasource & queries page
        */
    // Login as user1@appsmith.com now the user can Delete the workspaces
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    cy.wait(2000);
    cy.get(homePage.searchInput).type(appid);
    // verify create new app button is not visible to user
    cy.xpath(homePage.createNewAppButton).should("not.exist");
    //user can edit app1 insdie the org1

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.get(homePage.appsContainer).contains(workspaceId);
    cy.xpath(homePage.ShareBtn)
      .first()
      .should("be.visible");
    cy.get(homePage.applicationCard).trigger("mouseover");
    cy.get(homePage.appEditIcon);
    //user can edit query 1 in app 1
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();

    cy.get(datasource.datasourceCard)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .closest(datasource.datasourceCard)
      .within(() => {
        cy.get(queryLocators.createQuery).click();
      });
    //But the user cant execute any query/js in the org 1
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    // verify app doesnt have execute query access
    cy.get(".t--entity-item:contains(SelectQuery)").click();
    cy.xpath(queryEditor.runQuery)
      .last()
      .click({ force: true });
    // assert error toast msg here
  });
  it("2. Multiple orgs and multiple permission(datasource Access )", () => {
    /*Login as Admin@appsmith.com
        Add Delete access for workspace in others tab
        Remove create access for work spaace in Application resource page
        Add edit access for the App1 in org 1
        Add edit access for Query 1 in app 1
        remove execute access for datasource in datasource query page
        */
    // Login as user1@appsmith.com now the user can Delete the workspaces
    //user cant create new apps in org 1
    //user can edit app1 insdie the org1
    //user can edit query 1 in app 1
    //But the user cant execute any query in Org 1
  });
  it("3. Multiple orgs and multiple permission(datasource Access )", () => {
    /*Login as Admin@appsmith.com
        Add View access for workspace in others tab
        Remove create access for work spaace in Application resource page
        Add edit access for the App1 in org 1
        Add edit access for Query 1 in app 1 associated to db 1
        Add edit access for query 2 in app 1 associated to db 2
        remove execute access for db1 in datasource query page
        */
    // Login as user1@appsmith.com now the user can only view the workspaces
    //user cant create new apps in org 1
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.get(homePage.searchInput).type(appid);
    cy.wait(2000);
    // verify create new app button is not visible to user
    cy.xpath(homePage.createNewAppButton).should("not.exist");
    //user can edit app1 insdie the org1
    cy.get(homePage.searchInput).type(appid);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    // verify user should be able to edit the app
    cy.get('.t--entity-name:contains("Page1")').click();
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 600 });
    //user can edit query 1 in app 1
    //user can edit query 2 in app 1
    //But the user cant execute query 1 in app 1 but can execute query 2 in app1
  });
  it.skip("4. Multiple orgs and multiple permission(datasource Access )", () => {
    /*Login as Admin@appsmith.com
        Add View access for workspace in others tab
        Remove create access for work spaace in Application resource page
        Add edit access for the App1 in org 1
        Add edit access for Query 1 in app 1 associated to db 1
        Add edit access for JS 1 in app 1 associated to db 1
        remove execute access for db1 in datasource query page
        */
    // Login as user1@appsmith.com now the user can only view the workspaces
    //user cant create new apps in org 1
    //user can edit app1 insdie the org1
    //user can edit query 1 in app 1
    //user can edit js 1 in app 1
    //But the user cant execute query 1 and js 1 in app 1
  });
  it.skip("5. Multiple orgs and multiple permission(datasource Access )", () => {
    /*Login as Admin@appsmith.com
        Add View access for workspace in others tab
        Remove create access for work spaace in Application resource page
        Add edit access for the App1 in org 1
        Add edit access for Query 1 in app 1 associated to db 1
        Add edit access for JS 1 in app 1 associated to db 1
        remove create access for database in datasource query page
        */
    // Login as user1@appsmith.com now the user can only view the workspaces
    //user cant create new apps in org 1
    //user can edit app1 insdie the org1
    //user can edit query 1 in app 1
    //user can edit js 1 in app 1
    //But the user cant create new database in org 1
  });
  it.skip("6. Multiple orgs and multiple permission(datasource Access )", () => {
    /*Login as Admin@appsmith.com
        Add View access for workspace in others tab
        Remove create access for work spaace in Application resource page
        Add edit access for the App1 in org 1
        Add edit access for Query 1 in app 1 associated to db 1
        Add edit access for JS 1 in app 1 associated to db 1
        remove edit access for database in datasource query page
        */
    // Login as user1@appsmith.com now the user can only view the workspaces
    //user cant create new apps in org 1
    //user can edit app1 insdie the org1
    //user can edit query 1 in app 1
    //user can edit js 1 in app 1
    //But the user cant edit new database in org 1
  });

  it.skip("3. Multiple orgs and multiple permission(datasource Access )", () => {
    /*Login as Admin@appsmith.com
        Add View access for workspace in others tab
        Remove create access for work spaace in Application resource page
        Add edit access for the App1 in org 1
        Add edit access for Query 1 in app 1 associated to db 1
        Add edit access for query 2 in app 1 associated to db 2
        remove execute access for db1 in datasource query page
        */
    // Login as user1@appsmith.com now the user can only view the workspaces
    //user cant create new apps in org 1
    //user can edit app1 insdie the org1
    //user can edit query 1 in app 1
    //user can edit query 2 in app 1
  });
});
