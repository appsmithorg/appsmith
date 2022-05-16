/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */
/* Contains all methods related to Organisation features*/

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

Cypress.Commands.add("createOrg", () => {
  cy.get(homePage.createOrg)
    .should("be.visible")
    .first()
    .click({ force: true });
});

Cypress.Commands.add("renameOrg", (orgName, newOrgName) => {
  cy.contains(orgName)
    .closest(homePage.orgCompleteSection)
    .find(homePage.orgNamePopover)
    .find(homePage.optionsIcon)
    .click({ force: true });
  cy.get(homePage.renameOrgInput)
    .should("be.visible")
    .type(newOrgName.concat("{enter}"));
  cy.wait(3000);
  //cy.get(commonlocators.homeIcon).click({ force: true });
  cy.wait("@updateOrganization").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.contains(newOrgName);
});

Cypress.Commands.add("navigateToOrgSettings", (orgName) => {
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .closest(homePage.orgCompleteSection)
    .find(homePage.orgNamePopover)
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

Cypress.Commands.add("openOrgOptionsPopup", (orgName) => {
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .closest(homePage.orgCompleteSection)
    .find(homePage.orgNamePopover)
    .find(homePage.optionsIcon)
    .click({ force: true });
});

Cypress.Commands.add("inviteUserForOrg", (orgName, email, role) => {
  cy.stubPostHeaderReq();
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(homePage.orgList.concat(orgName).concat(homePage.shareOrg))
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

Cypress.Commands.add("CheckShareIcon", (orgName, count) => {
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(
    homePage.orgList.concat(orgName).concat(") .org-share-user-icons"),
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

Cypress.Commands.add("deleteUserFromOrg", (orgName) => {
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .closest(homePage.orgCompleteSection)
    .find(homePage.orgNamePopover)
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
  cy.get(homePage.leaveOrgConfirmModal).should("be.visible");
  cy.get(homePage.leaveOrgConfirmButton).click({ force: true });
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

Cypress.Commands.add("updateUserRoleForOrg", (orgName, email, role) => {
  cy.stubPostHeaderReq();
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .closest(homePage.orgCompleteSection)
    .find(homePage.orgNamePopover)
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
});

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

Cypress.Commands.add("CreateAppForOrg", (orgName, appname) => {
  cy.get(homePage.orgList.concat(orgName).concat(homePage.createAppFrOrg))
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

Cypress.Commands.add("CreateAppInFirstListedOrg", (appname) => {
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

  cy.waitUntil(() => cy.get(generatePage.buildFromScratchActionCard), {
    errorMsg: "Build app from scratch not visible even aft 80 secs",
    timeout: 20000,
    interval: 1000,
  }).then(($ele) => cy.wrap($ele).should("be.visible"));

  cy.get(generatePage.buildFromScratchActionCard).click();

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
