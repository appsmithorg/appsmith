/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */
/* Contains all methods related to Workspace features*/

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
import homePage from "../locators/HomePage";
import { ObjectsRegistry } from "../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper;
const assertHelper = ObjectsRegistry.AssertHelper;
const homePageTS = ObjectsRegistry.HomePage;

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

Cypress.Commands.add("navigateToWorkspaceSettings", (workspaceName) => {
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .first()
    .scrollIntoView()
    .should("be.visible");
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .closest(homePage.workspaceCompleteSection)
    .find(homePage.optionsIcon)
    .click({ force: true });
  cy.xpath(homePage.MemberSettings).click({ force: true });
  cy.wait("@getMembers").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(homePage.inviteUserMembersPage).should("be.visible");
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

Cypress.Commands.add("inviteUserForWorkspace", (workspaceName, email, role) => {
  cy.stubPostHeaderReq();
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .first()
    .scrollIntoView()
    .should("be.visible");

  cy.get(
    homePage.workspaceList
      .concat(workspaceName)
      .concat(homePage.shareWorkspace),
  )
    .first()
    .should("be.visible")
    .click({ force: true });
  cy.xpath(homePage.email).click({ force: true }).type(email);
  cy.xpath(homePage.selectRole).click({ force: true });
  cy.wait(500);
  cy.xpath(role).click({ force: true });
  cy.xpath(homePage.inviteBtn).click({ force: true });
  cy.wait("@mockPostInvite")
    .its("request.headers")
    .should("have.property", "origin", "Cypress");
  cy.contains(email, { matchCase: false });
});

Cypress.Commands.add("CheckShareIcon", (workspaceName, count) => {
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .first()
    .scrollIntoView()
    .should("be.visible");

  cy.get(
    homePage.workspaceList
      .concat(workspaceName)
      .concat(") .t--workspace-share-user-icons"),
  ).should("have.length", count);
});

Cypress.Commands.add("shareApp", (email, role) => {
  cy.stubPostHeaderReq();
  cy.xpath(homePage.email).click({ force: true }).type(email);
  cy.xpath(homePage.selectRole).should("be.visible");
  cy.xpath("//span[@name='expand-more']").last().click();
  cy.xpath(role).click({ force: true });
  cy.xpath(homePage.inviteBtn).click({ force: true });
  cy.wait("@mockPostInvite")
    .its("request.headers")
    .should("have.property", "origin", "Cypress");
  cy.contains(email, { matchCase: false });
  cy.get(homePage.closeBtn).click();
});

Cypress.Commands.add("shareAndPublic", (email, role) => {
  cy.stubPostHeaderReq();
  cy.xpath(homePage.email).click({ force: true }).type(email);
  cy.xpath(homePage.selectRole).click({ force: true });
  cy.xpath(role).click({ force: true });
  cy.xpath(homePage.inviteBtn).click({ force: true });
  cy.wait("@mockPostInvite")
    .its("request.headers")
    .should("have.property", "origin", "Cypress");
  cy.contains(email, { matchCase: false });
  cy.enablePublicAccess();
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

Cypress.Commands.add("deleteUserFromWorkspace", (workspaceName) => {
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .first()
    .scrollIntoView()
    .should("be.visible");

  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .closest(homePage.workspaceCompleteSection)
    .scrollIntoView()
    .find(homePage.optionsIcon)
    .click({ force: true });
  cy.xpath(homePage.MemberSettings).click({ force: true });
  cy.wait("@getRoles").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(homePage.DeleteBtn).last().click({ force: true });
  cy.get(homePage.leaveWorkspaceConfirmModal).should("be.visible");
  cy.get(homePage.leaveWorkspaceConfirmButton).click({ force: true });
  cy.xpath(homePage.appHome).first().should("be.visible").click();
  cy.wait("@applications").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add(
  "updateUserRoleForWorkspace",
  (workspaceName, email, role) => {
    cy.stubPostHeaderReq();
    cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
      .first()
      .scrollIntoView()
      .should("be.visible");

    cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
      .closest(homePage.workspaceCompleteSection)
      .scrollIntoView()
      .find(homePage.optionsIcon)
      .click({ force: true });
    cy.xpath(homePage.MemberSettings).click({ force: true });
    cy.wait("@getMembers").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.inviteUserMembersPage).click({ force: true });
    cy.xpath(homePage.email).click({ force: true }).type(email);
    cy.xpath(homePage.selectRole).click({ force: true });
    cy.xpath(role).click({ force: true });
    cy.xpath(homePage.inviteBtn).click({ force: true });
    cy.wait("@mockPostInvite")
      .its("request.headers")
      .should("have.property", "origin", "Cypress");
    cy.contains(email, { matchCase: false });
    cy.get(".bp3-icon-small-cross").click({ force: true });
    cy.xpath(homePage.appHome).first().should("be.visible").click();
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  },
);

Cypress.Commands.add("launchApp", () => {
  cy.get(homePage.appView).should("be.visible").first().click();
  cy.get("#loading").should("not.exist");
  cy.wait("@getPagesForViewApp").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
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
    .scrollIntoView()
    .should("be.visible")
    .click({ force: true });
  cy.wait("@createNewApplication").then((xhr) => {
    const response = xhr.response;
    expect(response.body.responseMeta.status).to.eq(201);
    localStorage.setItem("applicationId", response.body.data.id);
    cy.wrap(response.body.data.id).as("currentApplicationId");
  });

  cy.get("#loading").should("not.exist");
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);

  cy.AppSetupForRename();
  cy.get(homePage.applicationName).type(appname + "{enter}");

  cy.wait("@updateApplication").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  agHelper.RemoveUIElement("Tooltip", "Rename application");
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
  //agHelper.Sleep(2000); //for workspace to open
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

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(4000);
    cy.get("#loading").should("not.exist");

    cy.url().then((url) => {
      if (url.indexOf("/applications") > -1) {
        homePageTS.EditAppFromAppHover(appName);
        agHelper.Sleep(2000); //for app to open
      }
    });
  });
  cy.get("#sidebar").should("be.visible");
  assertHelper.AssertNetworkResponseData("@getPluginForm"); //for auth rest api
  assertHelper.AssertNetworkResponseData("@getPluginForm"); //for graphql

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
Cypress.Commands.add("leaveWorkspace", (newWorkspaceName) => {
  cy.openWorkspaceOptionsPopup(newWorkspaceName);
  cy.get(homePage.workspaceNamePopoverContent)
    .find("a")
    .should("have.length", 1)
    .first()
    .contains("Leave Workspace")
    .click();
  cy.contains("Are you sure").click();
  cy.wait("@leaveWorkspaceApiCall")
    .its("response.body.responseMeta.status")
    .should("eq", 200);
  cy.get(homePage.toastMessage).should(
    "contain",
    "You have successfully left the workspace",
  );
});
