/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");

const dayjs = require("dayjs");
const {
  addMatchImageSnapshotCommand,
} = require("cypress-image-snapshot/command");
const loginPage = require("../locators/LoginPage.json");
const signupPage = require("../locators/SignupPage.json");
import homePage from "../locators/HomePage";
const pages = require("../locators/Pages.json");
const datasourceEditor = require("../locators/DatasourcesEditor.json");
const datasourceFormData = require("../fixtures/datasources.json");
const commonlocators = require("../locators/commonlocators.json");
const queryEditor = require("../locators/QueryEditor.json");
const modalWidgetPage = require("../locators/ModalWidget.json");
const widgetsPage = require("../locators/Widgets.json");
const LayoutPage = require("../locators/Layout.json");
const formWidgetsPage = require("../locators/FormWidgets.json");
import ApiEditor from "../locators/ApiEditor";
const apiwidget = require("../locators/apiWidgetslocator.json");
const dynamicInputLocators = require("../locators/DynamicInput.json");
const explorer = require("../locators/explorerlocators.json");
const datasource = require("../locators/DatasourcesEditor.json");
const viewWidgetsPage = require("../locators/ViewWidgets.json");
const generatePage = require("../locators/GeneratePage.json");
const jsEditorLocators = require("../locators/JSEditor.json");
const commonLocators = require("../locators/commonlocators.json");
import commentsLocators from "../locators/CommentsLocators";
const queryLocators = require("../locators/QueryEditor.json");
const welcomePage = require("../locators/welcomePage.json");
const publishWidgetspage = require("../locators/publishWidgetspage.json");
import gitSyncLocators from "../locators/gitSyncLocators";

let pageidcopy = " ";
const GITHUB_API_BASE = "https://api.github.com";
const chainStart = Symbol();

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
  cy.get(homePage.enablePublicAccess).click();
  cy.wait("@changeAccess").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(homePage.closeBtn).click();
});

Cypress.Commands.add("deleteUserFromOrg", (orgName, email) => {
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

Cypress.Commands.add("launchApp", (appName) => {
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

  cy.get(generatePage.buildFromScratchActionCard).click();

  /* The server created app always has an old dsl so the layout will migrate
   * To avoid race conditions between that update layout and this one
   * we wait for that to finish before updating layout here
   */
  cy.wait("@updateLayout");
});
