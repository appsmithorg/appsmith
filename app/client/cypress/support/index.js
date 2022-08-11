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
/// <reference types="Cypress" />

import "cypress-real-events/support";
import "cypress-wait-until";
import "cypress-xpath";
import * as MESSAGES from "../../../client/src/ce/constants/messages.ts";
import "./ApiCommands";
// Import commands.js using ES2015 syntax:
import "./commands";
import { initLocalstorage } from "./commands";
import "./dataSourceCommands";
import "./gitSync";
import { initLocalstorageRegistry } from "./Objects/Registry";
import "./WorkspaceCommands";
import "./queryCommands";
import "./widgetCommands";
import "./themeCommands";
import "./AdminSettingsCommands";
/// <reference types="cypress-xpath" />

Cypress.on("uncaught:exception", () => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});

Cypress.on("fail", (error) => {
  throw error; // throw error to have test still fail
});

Cypress.env("MESSAGES", MESSAGES);

before(function() {
  //console.warn = () => {}; //to remove all warnings in cypress console
  initLocalstorage();
  initLocalstorageRegistry();
  cy.startServerAndRoutes();
  // Clear indexedDB
  cy.window().then((window) => {
    window.indexedDB.deleteDatabase("Appsmith");
  });
  cy.visit("/setup/welcome");
  cy.wait("@getMe");
  cy.wait(2000);
  cy.url().then((url) => {
    if (url.indexOf("setup/welcome") > -1) {
      cy.createSuperUser();
      cy.LogOut();
      cy.SignupFromAPI(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      cy.LogOut();
      cy.SignupFromAPI(
        Cypress.env("TESTUSERNAME2"),
        Cypress.env("TESTPASSWORD2"),
      );
      cy.LogOut();
    }
  });
});

before(function() {
  //console.warn = () => {};
  Cypress.Cookies.preserveOnce("SESSION", "remember_token");
  const username = Cypress.env("USERNAME");
  const password = Cypress.env("PASSWORD");
  cy.LoginFromAPI(username, password);
  cy.visit("/applications");
  cy.wait("@getMe");
  cy.wait(3000);
  cy.get(".t--applications-container .createnew")
    .should("be.visible")
    .should("be.enabled");
  cy.generateUUID().then((id) => {
    cy.CreateAppInFirstListedWorkspace(id);
    localStorage.setItem("AppName", id);
  });

  cy.fixture("example").then(function(data) {
    this.data = data;
  });
});

beforeEach(function() {
  //cy.window().then((win) => (win.onbeforeunload = undefined));
  if (!navigator.userAgent.includes("Cypress")) {
    window.addEventListener("beforeunload", this.beforeunloadFunction);
  }
  initLocalstorage();
  Cypress.Cookies.preserveOnce("SESSION", "remember_token");
  cy.startServerAndRoutes();
  //-- Delete local storage data of entity explorer
  cy.DeleteEntityStateLocalStorage();
});

after(function() {
  //-- Deleting the application by Api---//
  cy.DeleteAppByApi();
  //-- LogOut Application---//
  cy.LogOut();
});
