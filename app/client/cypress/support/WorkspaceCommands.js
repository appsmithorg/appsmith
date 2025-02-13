/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */
/* Contains all methods related to Workspace features*/

import { AppSidebar } from "./Pages/EditorNavigation";

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
import homePage from "../locators/HomePage";
import { ObjectsRegistry } from "../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper;
const assertHelper = ObjectsRegistry.AssertHelper;
const homePageTS = ObjectsRegistry.HomePage;
const appSettings = ObjectsRegistry.AppSettings;

export const initLocalstorage = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
};

Cypress.Commands.add("createWorkspace", () => {
  cy.get(homePage.createWorkspace)
    .should("be.visible")
    .first()
    .click({ force: true });
});

Cypress.Commands.add("openWorkspaceOptionsPopup", (workspaceName) => {
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .first()
    .scrollIntoView()
    .should("be.visible");

  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .closest(homePage.workspaceCompleteSection)
    .find(homePage.optionsIcon)
    .first()
    .click({ force: true });
});

Cypress.Commands.add("enablePublicAccess", (editMode = false) => {
  cy.xpath(homePage.enablePublicAccess).first().click({ force: true });
  cy.wait("@changeAccess").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.wait(5000);
  const closeButtonLocator = editMode
    ? homePage.editModeInviteModalCloseBtn
    : homePage.closeBtn;
  cy.get(closeButtonLocator).first().click({ force: true });
});

Cypress.Commands.add("launchApp", () => {
  cy.get(homePage.appView).should("be.visible").first().click();
  cy.get("#loading").should("not.exist");
  cy.wait("@getConsolidatedData").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  agHelper.AssertElementVisibility(appSettings.locators._applicationName);
});

Cypress.Commands.add("AppSetupForRename", () => {
  cy.wait(2000); //wait a bit for app to load
  cy.get(homePage.applicationName).then(($appName) => {
    if (!$appName.hasClass(homePage.editingAppName)) {
      cy.get(homePage.applicationName).click({ force: true });
      cy.get(homePage.portalMenuItem)
        .contains("Rename", { matchCase: false })
        .click({ force: true });
    }
  });
});

Cypress.Commands.add("CreateAppForWorkspace", (workspaceName, appname) => {
  cy.get(
    homePage.workspaceList
      .concat(workspaceName)
      .concat(homePage.createAppFrWorkspace),
  )
    .first()
    .scrollIntoView()
    .should("be.visible")
    .click({ force: true });

  agHelper.GetNClick(homePage.newButtonCreateApplication, 0, true);

  cy.wait("@createNewApplication").then((xhr) => {
    const response = xhr.response;
    expect(response.body.responseMeta.status).to.eq(201);
    localStorage.setItem("applicationId", response.body.data.id);
    cy.wrap(response.body.data.id).as("currentApplicationId");
  });

  cy.get("#loading").should("not.exist");
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);

  homePageTS.RenameApplication(appname);
});

Cypress.Commands.add("CreateNewAppInNewWorkspace", () => {
  let applicationId, appName;
  let toNavigateToHome = false;
  cy.get("body").then(($ele) => {
    if ($ele.find(".t--appsmith-logo").length < 0) {
      toNavigateToHome = false;
    } else {
      toNavigateToHome = true;
    }
  });
  homePageTS.CreateNewWorkspace("", toNavigateToHome); //Creating a new workspace for every test, since we are deleting the workspace in the end of the test
  cy.get("@workspaceName").then((workspaceName) => {
    localStorage.setItem("workspaceName", workspaceName);
    homePageTS.CreateAppInWorkspace(localStorage.getItem("workspaceName"));
  });
  cy.get("@createNewApplication").then((xhr) => {
    const response = xhr.response;
    expect(response.body.responseMeta.status).to.eq(201);
    applicationId = response.body.data.id;
    appName = response.body.data.name;
    cy.log("appName", appName);
    localStorage.setItem("applicationId", applicationId);
    localStorage.setItem("appName", appName);

    agHelper.AssertElementAbsence("#loading", Cypress.config().pageLoadTimeout);

    cy.url().then((url) => {
      if (url.indexOf("/applications") > -1) {
        homePageTS.EditAppFromAppHover(appName);
      }
    });
  });
  AppSidebar.assertVisible();

  // If the intro modal is open, close it
  cy.skipSignposting();

  //Removing renaming of app from all tests, since its also verified in other separate tests
  // cy.AppSetupForRename();
  // cy.get(homePage.applicationName).type(appname + "{enter}");
  // assertHelper.AssertNetworkStatus("@updateApplication");
  // // Remove tooltip on the Application Name
  // agHelper.RemoveTooltip("Tooltip","Rename application");

  /* The server created app always has an old dsl so the layout will migrate
   * To avoid race conditions between that update layout and this one
   * we wait for that to finish before updating layout here
   */
  //cy.wait("@updateLayout");
});
