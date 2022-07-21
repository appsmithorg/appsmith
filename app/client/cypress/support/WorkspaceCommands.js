/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */
/* Contains all methods related to Workspace features*/

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
import homePage from "../locators/HomePage";
const generatePage = require("../locators/GeneratePage.json");
import explorer from "../locators/explorerlocators";
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

Cypress.Commands.add("renameWorkspace", (workspaceName, newWorkspaceName) => {
  cy.get(".t--applications-container")
    .contains(workspaceName)
    .closest(homePage.workspaceCompleteSection)
    .find(homePage.workspaceNamePopover)
    .find(homePage.optionsIcon)
    .click({ force: true });
  cy.get(homePage.renameWorkspaceInput)
    .should("be.visible")
    .type(newWorkspaceName.concat("{enter}"));
  cy.wait(3000);
  //cy.get(commonlocators.homeIcon).click({ force: true });
  cy.wait("@updateWorkspace").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.contains(newWorkspaceName);
});

Cypress.Commands.add("navigateToWorkspaceSettings", (workspaceName) => {
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .closest(homePage.workspaceCompleteSection)
    .find(homePage.workspaceNamePopover)
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
    .scrollIntoView()
    .should("be.visible");
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .closest(homePage.workspaceCompleteSection)
    .find(homePage.workspaceNamePopover)
    .find(homePage.optionsIcon)
    .click({ force: true });
});

Cypress.Commands.add("inviteUserForWorkspace", (workspaceName, email, role) => {
  cy.stubPostHeaderReq();
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
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
  cy.xpath(homePage.email)
    .click({ force: true })
    .type(email);
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
    .scrollIntoView()
    .should("be.visible");
  cy.get(
    homePage.workspaceList
      .concat(workspaceName)
      .concat(") .workspace-share-user-icons"),
  ).should("have.length", count);
});

Cypress.Commands.add("shareApp", (email, role) => {
  cy.stubPostHeaderReq();
  cy.xpath(homePage.email)
    .click({ force: true })
    .type(email);
  cy.xpath(homePage.selectRole).click({ force: true });
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
  cy.xpath(homePage.email)
    .click({ force: true })
    .type(email);
  cy.xpath(homePage.selectRole).click({ force: true });
  cy.xpath(role).click({ force: true });
  cy.xpath(homePage.inviteBtn).click({ force: true });
  cy.wait("@mockPostInvite")
    .its("request.headers")
    .should("have.property", "origin", "Cypress");
  cy.contains(email, { matchCase: false });
  cy.enablePublicAccess();
});

Cypress.Commands.add("enablePublicAccess", () => {
  cy.get(homePage.enablePublicAccess)
    .first()
    .click({ force: true });
  cy.wait("@changeAccess").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.wait(10000);
  cy.get(homePage.closeBtn)
    .first()
    .click({ force: true });
});

Cypress.Commands.add("deleteUserFromWorkspace", (workspaceName) => {
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
    .closest(homePage.workspaceCompleteSection)
    .find(homePage.workspaceNamePopover)
    .find(homePage.optionsIcon)
    .click({ force: true });
  cy.xpath(homePage.MemberSettings).click({ force: true });
  cy.wait("@getRoles").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(homePage.DeleteBtn)
    .last()
    .click({ force: true });
  cy.get(homePage.leaveWorkspaceConfirmModal).should("be.visible");
  cy.get(homePage.leaveWorkspaceConfirmButton).click({ force: true });
  cy.xpath(homePage.appHome)
    .first()
    .should("be.visible")
    .click();
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
      .scrollIntoView()
      .should("be.visible");
    cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
      .closest(homePage.workspaceCompleteSection)
      .find(homePage.workspaceNamePopover)
      .find(homePage.optionsIcon)
      .click({ force: true });
    cy.xpath(homePage.MemberSettings).click({ force: true });
    cy.wait("@getMembers").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.inviteUserMembersPage).click({ force: true });
    cy.xpath(homePage.email)
      .click({ force: true })
      .type(email);
    cy.xpath(homePage.selectRole).click({ force: true });
    cy.xpath(role).click({ force: true });
    cy.xpath(homePage.inviteBtn).click({ force: true });
    cy.wait("@mockPostInvite")
      .its("request.headers")
      .should("have.property", "origin", "Cypress");
    cy.contains(email, { matchCase: false });
    cy.get(".bp3-icon-small-cross").click({ force: true });
    cy.xpath(homePage.appHome)
      .first()
      .should("be.visible")
      .click();
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  },
);

Cypress.Commands.add("launchApp", () => {
  cy.get(homePage.appView)
    .should("be.visible")
    .first()
    .click();
  cy.get("#loading").should("not.exist");
  cy.wait("@getPagesForViewApp").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("AppSetupForRename", () => {
  cy.get(homePage.applicationName).then(($appName) => {
    if (!$appName.hasClass(homePage.editingAppName)) {
      cy.get(homePage.applicationName).click({ force: true });
      cy.get(homePage.portalMenuItem)
        .contains("Edit Name", { matchCase: false })
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

  cy.get(generatePage.buildFromScratchActionCard).click();

  cy.wait("@updateApplication").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("CreateAppInFirstListedWorkspace", (appname) => {
  let applicationId;
  cy.get(homePage.createNew)
    .first()
    .click({ force: true });
  cy.wait("@createNewApplication").then((xhr) => {
    const response = xhr.response;
    expect(response.body.responseMeta.status).to.eq(201);
    applicationId = response.body.data.id;
    localStorage.setItem("applicationId", applicationId);
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
  // Remove tooltip on the Application Name element
  cy.get(homePage.applicationName).realHover();
  cy.get("body").realHover({ position: "topLeft" });

  cy.waitUntil(() => cy.get(generatePage.buildFromScratchActionCard), {
    errorMsg: "Build app from scratch not visible even aft 80 secs",
    timeout: 20000,
    interval: 1000,
  }).then(($ele) =>
    cy
      .wrap($ele)
      .should("be.visible")
      .click(),
  );

  //cy.get(generatePage.buildFromScratchActionCard).click();

  /* The server created app always has an old dsl so the layout will migrate
   * To avoid race conditions between that update layout and this one
   * we wait for that to finish before updating layout here
   */
  cy.wait("@updateLayout");
});

Cypress.Commands.add("renameEntity", (entityName, renamedEntity) => {
  cy.get(`.t--entity-item:contains(${entityName})`).within(() => {
    cy.get(".t--context-menu").click({ force: true });
  });
  cy.selectAction("Edit Name");
  cy.get(explorer.editEntity)
    .last()
    .type(`${renamedEntity}`, { force: true });
});
