// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
require("cypress-xpath");
const loginData = require("../fixtures/user.json");
const inputData = require("../fixtures/inputdata.json");
let pageid;
let appId;

// Import commands.js using ES2015 syntax:
import "./commands";
before(function() {
  console.log("**** Got Cypress base URL as: ", process.env.CYPRESS_BASE_URL);

  cy.server();
  cy.route("GET", "/api/v1/applications").as("applications");
  cy.route("GET", "/api/v1/users/profile").as("getUser");
  cy.route("GET", "/api/v1/plugins").as("getPlugins");
  cy.route("POST", "/api/v1/logout").as("postLogout");

  cy.route("GET", "/api/v1/configs/name/propertyPane").as("getPropertyPane");
  cy.route("GET", "/api/v1/datasources").as("getDataSources");
  cy.route("GET", "/api/v1/pages/application/*").as("getPagesForApp");
  cy.route("GET", "/api/v1/pages/*").as("getPage");
  cy.route("GET", "/api/v1/actions*").as("getActions");
  cy.route("GET", "api/v1/providers/categories").as("getCategories");
  cy.route("GET", "api/v1/import/templateCollections").as(
    "getTemplateCollections",
  );
  cy.route("DELETE", "/api/v1/actions/*").as("deleteAPI");
  cy.route("DELETE", "/api/v1/applications/*").as("deleteApp");
  cy.route("DELETE", "/api/v1/actions/*").as("deleteAction");

  cy.route("GET", "/api/v1/plugins/*/form").as("getPluginForm");
  cy.route("POST", "/api/v1/datasources").as("createDatasource");
  cy.route("POST", "/api/v1/datasources/test").as("testDatasource");
  cy.route("PUT", "/api/v1/datasources/*").as("saveDatasource");
  cy.route("DELETE", "/api/v1/datasources/*").as("deleteDatasource");

  cy.route("GET", "/api/v1/organizations").as("organizations");
  cy.route("POST", "/api/v1/actions/execute").as("executeAction");
  cy.route("POST", "/api/v1/applications/publish/*").as("publishApp");
  cy.route("PUT", "/api/v1/layouts/*/pages/*").as("updateLayout");

  cy.route("POST", "/v1/t").as("postSave");
  cy.route("PUT", "/api/v1/actions/*").as("putActions");
  cy.route("POST", "/track/*").as("postTrack");
  cy.route("POST", "/v1/m").as("postexe");
  cy.route("POST", "/api/v1/actions/execute").as("postExecute");
  cy.route("POST", "/api/v1/actions").as("postaction");

  cy.route("POST", "/api/v1/actions").as("createNewApi");
  cy.route("POST", "/api/v1/import?type=CURL&pageId=*&name=*").as("curlImport");
  cy.route("DELETE", "/api/v1/actions/*").as("deleteAction");
  cy.route("GET", "/api/v1/marketplace/providers?category=*&page=*&size=*").as(
    "get3PProviders",
  );
  cy.route("GET", "/api/v1/marketplace/templates?providerId=*").as(
    "get3PProviderTemplates",
  );
  cy.route("POST", "/api/v1/items/addToPage").as("add3PApiToPage");

  cy.route("GET", "/api/v1/plugins/*/form").as("getPluginForm");
  cy.route("POST", "/api/v1/datasources").as("createDatasource");
  cy.route("POST", "/api/v1/datasources/test").as("testDatasource");
  cy.route("PUT", "/api/v1/datasources/*").as("saveDatasource");
  cy.route("DELETE", "/api/v1/datasources/*").as("deleteDatasource");

  cy.route("PUT", "/api/v1/actions/*").as("saveQuery");

  cy.LogintoApp(loginData.username, loginData.password);
  // cy.SearchApp(inputData.appname)
  cy.generateUUID().then(id => {
    appId = id;
    cy.CreateApp(id);
  });

  cy.generateUUID().then(uid => {
    pageid = uid;
    cy.Createpage(pageid);
    cy.NavigateToWidgets(pageid);
  });

  cy.fixture("example").then(function(data) {
    this.data = data;
  });
});

beforeEach(function() {
  Cypress.Cookies.preserveOnce("SESSION", "remember_token");
});

after(function() {
  // ---commenting Publish app and Delete page as of now--- //
  //cy.Deletepage(pageid);
  //cy.PublishtheApp();
  //-- Deleting the application by Api---//
  cy.DeleteAppByApi();
});
