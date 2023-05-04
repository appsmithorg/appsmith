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
let myCookie, originalCookie;
//import "cypress-localstorage-commands"

import { ObjectsRegistry } from "./Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;

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
  //cy.clearLocalStorageSnapshot();

  //console.warn = () => {};
  //Cypress.Cookies.preserveOnce("SESSION", "remember_token");
  //cy.setCookie("SESSION", "remember_token");

  // cy.session("unique_identifier", {
  //   validate() {
  //     cy.getCookies().should("have.length", 2);
  //   }, cacheAcrossSpecs: true
  // });

  const username = Cypress.env("USERNAME");
  const password = Cypress.env("PASSWORD");

  // cy.session("preservingCookies", cy.LoginFromAPI(username, password), {
  //   validate() {
  //     cy.url().should("contain", "/applications")
  //     //expect(loc.href).to.equal(loc.origin + "/applications");

  //     //cy.getCookies().should("have.length", 2);
  //   },
  //   cacheAcrossSpecs: true,
  // });
  //cy.restoreLocalStorage();

  cy.LoginFromAPI(username, password);
  cy.wait(3000);
  //cy.loadCookies();

  // cy.getCookies().then((cookies) => {
  //   myCookie = cookies;
  // });

  // cy.window().then((win) => {
  //   myCookie.forEach((cookie) => {
  //     win.document.cookie = `${cookie.name}=${cookie.value}`;
  //   });
  // });

  // cy.getCookies().then((cookies) => {
  //   myCookie = cookies.find((c) => c.name === 'myCookie')
  // })

  //cy.setCookie("SESSION", "remember_token");
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

  // cy.session('my_cookies_session', () => {
  //   cy.loadCookies();
  // });
});

beforeEach(function () {
  // const username = Cypress.env("USERNAME");
  // const password = Cypress.env("PASSWORD");
  //cy.window().then((win) => (win.onbeforeunload = undefined));
  if (!navigator.userAgent.includes("Cypress")) {
    window.addEventListener("beforeunload", this.beforeunloadFunction);
  }
  initLocalstorage();
  agHelper.RestoreSessionStorage();

  //cy.session("SESSION", "remember_token");
  //cy.setCookie("SESSION", "remember_token");
  //cy.getCookie("SESSION");

  //cy.getCookie("SESSION");
  // cy.session('my_cookies_session', () => {
  //   cy.loadCookies();
  // });

  //cy.saveCookies();
  //cy.loadCookies();
  //cy.restoreLocalStorage();

  // cy.getCookies().then((cookies) => {
  //   myCookie = cookies;
  // });
  //onBeforeLoad(win) {
  // cy.window().then((win) => {
  //   myCookie.forEach((cookie) => {
  //     win.document.cookie = `${cookie.name}=${cookie.value}`;
  //   });
  // });

  //Cypress.Cookies.preserveOnce("SESSION", "remember_token");
  // cy.session("SESSION", {
  //   validate() {
  //     //cy.getCookies().should("have.length", 2);},
  //   },
  //    cacheAcrossSpecs: true
  // });

  // cy.session("preservingCookies", cy.LoginFromAPI(username, password), {
  //   validate() {
  //     cy.url().should("contain", "/applications")
  //     //expect(loc.href).to.equal(loc.origin + "/applications");

  //     //cy.getCookies().should("have.length", 2);
  //   },
  //   cacheAcrossSpecs: true,
  // });

  cy.startServerAndRoutes();
  //-- Delete local storage data of entity explorer
  cy.DeleteEntityStateLocalStorage();
  cy.intercept("api/v1/admin/env", (req) => {
    req.headers["origin"] = Cypress.config("baseUrl");
  });
});

// afterEach(() => {
//   // Set the "myCookie" cookie back to its original value
//   //cy.setCookie(myCookie, myCookie);
//   //cy.loadCookies();

//   cy.saveCookies();
//   //cy.saveLocalStorage();

//   // cy.session('my_cookies_session', () => {
//   //   cy.saveCookies();
//   // }, cacheAcrossSpecs: true);

// });

afterEach(() => {
  agHelper.SaveSessionStorage();
});

after(function () {
  //-- Deleting the application by Api---//
  cy.DeleteAppByApi();
  //-- LogOut Application---//
  cy.LogOut();

  // Commenting until Upgrade Appsmith cases are fixed
  // const tedUrl = "http://localhost:5001/v1/parent/cmd";
  // cy.log("Start the appsmith container");
  // cy.StartContainer(tedUrl, "appsmith"); // start the old container
});
