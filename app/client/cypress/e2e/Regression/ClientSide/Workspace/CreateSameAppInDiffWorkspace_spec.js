/// <reference types="Cypress" />
import homePage from "../../../../locators/HomePage";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
const application = require("../../../../locators/Applications.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Create app same name in different workspace",
  { tags: ["@tag.Workspace", "@tag.AccessControl"] },
  function () {
    let workspaceId;
    let appid;
    before(() => {
      cy.get("@workspaceName").then((workspaceName) => {
        workspaceId = workspaceName;
      });
      cy.generateUUID().then((uid) => {
        appid = uid;
        _.homePage.RenameApplication(appid);
      });
      _.homePage.LogOutviaAPI();
    });

    it("1. create app with same name in a different workspace", function () {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      if (CURRENT_REPO === REPO.EE) _.adminSettings.EnableGAC(false, true);
      const newWSName = workspaceId + "1";
      //Automated as part of Bug19506
      cy.get(".t--applications-container")
        .contains(workspaceId)
        .closest(homePage.workspaceCompleteSection)
        .find(homePage.optionsIcon)
        .find(homePage.workspaceNamePopover)
        .click({ force: true });
      cy.xpath(homePage.members).click({ force: true });
      cy.get(homePage.inviteUserMembersPage).click({ force: true });
      if (CURRENT_REPO === REPO.CE) {
        cy.xpath(application.placeholderTxt).should("be.visible");
      } else {
        cy.xpath(application.placeholderTxtEE).should("be.visible");
      }
      cy.get(application.closeModalPopup).click({ force: true });
      _.homePage.NavigateToHome();
      _.homePage.CreateNewWorkspace(newWSName);
      _.homePage.CreateAppInWorkspace(newWSName, appid);
    });
  },
);
