/// <reference types="Cypress" />
import homePage from "../../../../locators/HomePage";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
const application = require("../../../../locators/Applications.json");

describe("Create workspace and a new app / delete and recreate app", function () {
  let workspaceId;
  let appid;
  let newWorkspaceName;

  it("1. Create app within an workspace and delete and re-create another app with same name", function () {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceId = uid;
      appid = uid;
      localStorage.setItem("WorkspaceName", workspaceId);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceId);
      });
      //Automated as part of Bug19506
      cy.get(application.shareButton).first().click({ force: true });
      if (CURRENT_REPO === REPO.CE) {
        cy.xpath(application.placeholderTxt).should("be.visible");
      } else {
        cy.xpath(application.placeholderTxtEE).should("be.visible");
      }
      cy.get(application.closeModalPopup).click({ force: true });
      cy.CreateAppForWorkspace(workspaceId, appid);
      cy.get(homePage.shareApp).click({ force: true });
      if (CURRENT_REPO === REPO.CE) {
        cy.xpath(application.placeholderTxt).should("be.visible");
      } else {
        cy.xpath(application.placeholderTxtEE).should("be.visible");
      }
      cy.get(application.closeModalPopupMember).click({ force: true });
      cy.DeleteAppByApi();
      cy.NavigateToHome();
      cy.CreateAppForWorkspace(workspaceId, appid);
    });
  });
});
