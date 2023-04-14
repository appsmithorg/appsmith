/// <reference types="Cypress" />
import homePage from "../../../../locators/HomePage";
const application = require("../../../../locators/Applications.json");

describe("Create app same name in different workspace", function () {
  let workspaceId;
  let appid;
  let newWorkspaceName;
  before(() => {
    //create app within a new workspace
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceId = uid;
      appid = uid;
      localStorage.setItem("WorkspaceName", workspaceId);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceId);
        cy.CreateAppForWorkspace(workspaceId, appid);
        cy.NavigateToHome();
        cy.LogOut();
      });
    });
  });
  it("1. create app with same name in a different workspace", function () {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/applications");
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    const newWSName = workspaceId + "1";
    //Automated as part of Bug19506
    cy.get(".t--applications-container")
      .contains(workspaceId)
      .closest(homePage.workspaceCompleteSection)
      .find(homePage.workspaceNamePopover)
      .find(homePage.optionsIcon)
      .click({ force: true });
    cy.xpath(homePage.members).click({ force: true });
    cy.get(homePage.inviteUserMembersPage).click({ force: true });
    cy.xpath(application.placeholderTxt).should("be.visible");
    cy.reload();
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      console.log("createWorkspace response: ", interception);
      newWorkspaceName = interception.response.body.data.name;
      cy.renameWorkspace(newWorkspaceName, newWSName);
      cy.CreateAppForWorkspace(newWSName, appid);
    });
  });
});
