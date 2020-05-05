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
  cy.server();
  cy.route("GET", "/api/v1/applications").as("applications");
  cy.route("GET", "/api/v1/users/profile").as("getUser");
  cy.route("GET", "/api/v1/plugins").as("getPlugins");

  cy.route("GET", "/api/v1/configs/name/propertyPane").as("getPropertyPane");
  cy.route("GET", "/api/v1/datasources").as("getDataSources");
  cy.route("GET", "/api/v1/pages/application/*").as("getPagesForApp");
  cy.route("GET", "/api/v1/pages/*").as("getPage");
  cy.route("GET", "/api/v1/actions*").as("getActions");

  cy.route("GET", "/api/v1/organizations").as("organizations");
  cy.route("POST", "/api/v1/actions/execute").as("executeAction");
  cy.route("POST", "/api/v1/applications/publish/*").as("publishApp");
  cy.route("PUT", "/api/v1/layouts/*/pages/*").as("updateLayout");

  cy.LogintoApp(loginData.username, loginData.password);
  cy.generateUUID().then(id => {
    appId = id;
    cy.CreateApp(id);
  });
  cy.generateUUID().then(uid => {
    pageid = uid;
    cy.Createpage(pageid);
    cy.NavigateToWidgets(pageid);
  });

  beforeEach(function() {
    Cypress.Cookies.preserveOnce("session_id", "remember_token");
  });

  after(function() {
    // ---commenting Publish app and Delete page as of now--- //
    //cy.Deletepage(pageid);
    //cy.PublishtheApp();
    cy.DeleteApp(appId);
  });
});
