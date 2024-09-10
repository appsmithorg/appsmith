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
/// <reference types='cypress-tags' />
import "cypress-real-events";
import "cypress-real-events/support";
import "cypress-wait-until";
import "cypress-network-idle";
import "cypress-xpath";
import * as MESSAGES from "../../src/ce/constants/messages.ts";
import "./ApiCommands";
// Import commands.js using ES2015 syntax:
import "./commands";
import { initLocalstorage, addIndexedDBKey } from "./commands";
import "./dataSourceCommands";
import "./gitSync";
import { initLocalstorageRegistry } from "./Objects/Registry";
import RapidMode from "./RapidMode.ts";
import "cypress-mochawesome-reporter/register";
import installLogsCollector from "cypress-terminal-report/src/installLogsCollector";
import { CURRENT_REPO, REPO } from "../fixtures/REPO";

import "./WorkspaceCommands";
import "./queryCommands";
import "./widgetCommands";
import "./themeCommands";
import "./AdminSettingsCommands";
import "cypress-plugin-tab";
import {
  FEATURE_WALKTHROUGH_INDEX_KEY,
  WALKTHROUGH_TEST_PAGE,
} from "./Constants.js";
const registerCypressGrep = require("@cypress/grep");
/// <reference types="cypress-xpath" />

registerCypressGrep();
installLogsCollector();

Cypress.on("uncaught:exception", (error) => {
  //cy.log(error.message);
  return false; // returning false here prevents Cypress from failing the test
});

Cypress.on("fail", (error) => {
  cy.log(error.message);
  throw error; // throw error to have test fail
});

Cypress.env("MESSAGES", MESSAGES);
let dataSet; // Declare a variable to hold the test data

// before(function () {
//   if (RapidMode.config.enabled) {
//     cy.startServerAndRoutes();
//     cy.getCookie("SESSION").then((cookie) => {
//       if (!cookie) {
//         cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
//       }
//     });

//     //Cypress.Cookies.preserveOnce("SESSION", "remember_token");
//     if (!RapidMode.config.usesDSL) {
//       cy.visit(RapidMode.url());
//       cy.wait("@getWorkspace");
//     }
//   }
// });

// before(function () {
//   if (RapidMode.config.enabled) {
//     return;
//   }
//   //console.warn = () => {}; //to remove all warnings in cypress console
//   initLocalstorage();
//   initLocalstorageRegistry();
//   cy.startServerAndRoutes();
//   // Clear indexedDB
//   cy.window().then((window) => {
//     window.indexedDB.deleteDatabase("Appsmith");
//   });
//   cy.visit("/setup/welcome", { timeout: 60000 });
//   cy.wait("@getConsolidatedData");

//   cy.wait(2000);
//   const username = Cypress.env("USERNAME");
//   const password = Cypress.env("PASSWORD");
//   cy.url().then((url) => {
//     if (url.indexOf("setup/welcome") > -1) {
//       cy.createSuperUser();
//       cy.SignupFromAPI(
//         Cypress.env("TESTUSERNAME1"),
//         Cypress.env("TESTPASSWORD1"),
//       );
//       cy.LogOut();
//       cy.SignupFromAPI(
//         Cypress.env("TESTUSERNAME2"),
//         Cypress.env("TESTPASSWORD2"),
//       );
//       cy.LogOut();
//       cy.SignupFromAPI(
//         Cypress.env("TESTUSERNAME3"),
//         Cypress.env("TESTPASSWORD3"),
//       );
//       cy.LogOut();
//       cy.SignupFromAPI(
//         Cypress.env("TESTUSERNAME4"),
//         Cypress.env("TESTPASSWORD4"),
//       );
//       cy.LogOut();
//       cy.LoginFromAPI(username, password);
//     } else if (url.indexOf("user/login") > -1) {
//       //Cypress.Cookies.preserveOnce("SESSION", "remember_token");
//       cy.LoginFromAPI(username, password);
//       cy.wait(3000);
//     }
//   });

//   if (CURRENT_REPO === REPO.EE) {
//     cy.wait(2000);
//     cy.url().then((url) => {
//       if (url.indexOf("/license") > -1) {
//         cy.validateLicense();
//       }
//     });
//   }

//   if (!Cypress.currentTest.titlePath[0].includes(WALKTHROUGH_TEST_PAGE)) {
//     // Adding key FEATURE_WALKTHROUGH (which is used to check if the walkthrough is already shown to the user or not) for non walkthrough cypress tests (to not show walkthrough)
//     addIndexedDBKey(FEATURE_WALKTHROUGH_INDEX_KEY, {
//       ab_ds_binding_enabled: true,
//       ab_ds_schema_enabled: true,
//       binding_widget: true,
//     });
//   }
//   //console.warn = () => {};

//   cy.CreateNewAppInNewWorkspace(); //Creating new workspace and app
//   cy.fixture("TestDataSet1").then(function (data) {
//     this.dataSet = data;
//   });
// });

// beforeEach(function () {
//   //cy.window().then((win) => (win.onbeforeunload = undefined));
//   if (!navigator.userAgent.includes("Cypress")) {
//     window.addEventListener("beforeunload", this.beforeunloadFunction);
//   }
//   initLocalstorage();
//   //Cypress.Cookies.preserveOnce("SESSION", "remember_token");
//   cy.startServerAndRoutes();
//   //-- Delete local storage data of entity explorer
//   cy.DeleteEntityStateLocalStorage();
//   cy.intercept("api/v1/admin/env", (req) => {
//     req.headers["origin"] = Cypress.config("baseUrl");
//   });
// });

// after(function () {
//   if (RapidMode.config.enabled) {
//     return;
//   }
//   //-- Deleting the application by Api---//
//   cy.DeleteAppByApi();
//   cy.DeleteWorkspaceByApi();
//   //-- LogOut Application---//
//   //cy.LogOut(false);
//   // Commenting until Upgrade Appsmith cases are fixed
//   // const tedUrl = "http://localhost:5001/v1/parent/cmd";
//   // cy.log("Start the appsmith container");
//   // cy.StartContainer(tedUrl, "appsmith"); // start the old container
// });
