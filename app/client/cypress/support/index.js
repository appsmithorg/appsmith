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
import "cypress-real-events/support";
import "cypress-wait-until";
import "cypress-network-idle";
import "cypress-xpath";
import * as MESSAGES from "../../../client/src/ce/constants/messages.ts";
import "./ApiCommands";
// Import commands.js using ES2015 syntax:
import "./commands";
import "./OIDCCommands";
import "./SAMLCommands";
import { initLocalstorage } from "./commands";
import "./dataSourceCommands";
import "./gitSync";
import { initLocalstorageRegistry } from "./Objects/Registry";
import "./WorkspaceCommands";
import "./queryCommands";
import "./widgetCommands";
import "./themeCommands";
import "./AdminSettingsCommands";
import "./RBACCommands";
import "./LicenseCommands";
import { CURRENT_REPO, REPO } from "../fixtures/REPO";
import "cypress-plugin-tab";
/// <reference types="cypress-xpath" />

let rapidMode = {
  enabled: false, // Set to true to disable app creation
  appName: "cf023e29", // Replace it with your app name
  pageName: "page1", // Replace it with the page name
  pageID: "644d0ec870cec01248edfc9a", // Replace it with pageID

  url: function () {
    return `app/${this.appName}/${this.pageName}-${this.pageID}/edit`;
  },
};

Cypress.on("uncaught:exception", () => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});

Cypress.on("fail", (error) => {
  throw error; // throw error to have test still fail
});

Cypress.env("MESSAGES", MESSAGES);

before(function () {
  if (rapidMode.enabled) {
    cy.startServerAndRoutes();
    cy.getCookie("SESSION").then((cookie) => {
      if (!cookie) {
        cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      }
    });

    Cypress.Cookies.preserveOnce("SESSION", "remember_token");
    cy.visit(rapidMode.url());
    cy.wait("@getWorkspace");
  }
});

before(function () {
  if (rapidMode.enabled) {
    return;
  }
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
      cy.SignupFromAPI(
        Cypress.env("TESTUSERNAME3"),
        Cypress.env("TESTPASSWORD3"),
      );
      cy.LogOut();
      cy.SignupFromAPI(
        Cypress.env("TESTUSERNAME4"),
        Cypress.env("TESTPASSWORD4"),
      );
      cy.LogOut();
    }
  });
});

before(function () {
  if (rapidMode.enabled) {
    return;
  }
  //console.warn = () => {};
  Cypress.Cookies.preserveOnce("SESSION", "remember_token");
  const username = Cypress.env("USERNAME");
  const password = Cypress.env("PASSWORD");
  /* When first setting up the instance, we will be redirected to /applications which will then redirect to /license.
     This is because the license is not set up yet. Then call the validateLicense function to set up the license and test it.
     Then navigate to /applications again to continue with the tests.
  */
  cy.LoginFromAPI(username, password);
  cy.wait(2000);
  if (CURRENT_REPO === REPO.EE) {
    cy.url().then((url) => {
      if (url.indexOf("/license") > -1) {
        cy.validateLicense();
      }
    });
  }
  cy.wait(3000);
  cy.get(".t--applications-container .createnew")
    .should("be.visible")
    .should("be.enabled");
  cy.generateUUID().then((id) => {
    cy.CreateAppInFirstListedWorkspace(id);
    localStorage.setItem("AppName", id);
  });

  cy.fixture("example").then(function (data) {
    this.data = data;
  });
});

beforeEach(function () {
  //cy.window().then((win) => (win.onbeforeunload = undefined));
  if (!navigator.userAgent.includes("Cypress")) {
    window.addEventListener("beforeunload", this.beforeunloadFunction);
  }
  initLocalstorage();
  Cypress.Cookies.preserveOnce("SESSION", "remember_token");
  cy.startServerAndRoutes();
  //-- Delete local storage data of entity explorer
  cy.DeleteEntityStateLocalStorage();
  cy.intercept("api/v1/admin/env", (req) => {
    req.headers["origin"] = Cypress.config("baseUrl");
  });
});

after(function () {
  if (rapidMode.enabled) {
    return;
  }
  //-- Deleting the application by Api---//
  cy.DeleteAppByApi();
  //-- LogOut Application---//
  cy.LogOut();

  // Commenting until Upgrade Appsmith cases are fixed
  // const tedUrl = "http://localhost:5001/v1/parent/cmd";
  // cy.log("Start the appsmith container");
  // cy.StartContainer(tedUrl, "appsmith"); // start the old container
});
