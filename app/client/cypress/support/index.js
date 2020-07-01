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

Cypress.on("uncaught:exception", (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});

before(function() {
  console.log("**** Got Cypress base URL as: ", process.env.CYPRESS_BASE_URL);
  cy.startServerAndRoutes();
  //cy.LogintoApp(loginData.username, loginData.password);
  cy.LoginFromAPI(loginData.username, loginData.password);
  cy.visit("/applications");
  cy.wait("@applications").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );

  cy.generateUUID().then(id => {
    appId = id;
    cy.CreateApp(id);
    localStorage.setItem("AppName", appId);
  });

  /*
  cy.generateUUID().then(uid => {
    pageid = uid;
    cy.Createpage(pageid);
    cy.NavigateToWidgets(pageid);
    localStorage.setItem("PageName", pageid);
  });
*/
  cy.fixture("example").then(function(data) {
    this.data = data;
  });
});

beforeEach(function() {
  Cypress.Cookies.preserveOnce("SESSION", "remember_token");
  cy.startServerAndRoutes();
});

after(function() {
  // ---commenting Publish app and Delete page as of now--- //
  //cy.Deletepage(pageid);
  //cy.PublishtheApp();
  //-- Deleting the application by Api---//
  cy.DeleteAppByApi();
  //-- LogOut Application---//
  cy.LogOut();
});
