/// <reference types="Cypress" />
import homePage from "../../../../locators/HomePage";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
const application = require("../../../../locators/Applications.json");
import * as _ from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe("Create app same name in different workspace", function () {
  let workspaceId;
  let appid;
  let newWorkspaceName;
  before(() => {
    //create app within a new workspace
    _.homePage.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceId = uid;
      appid = uid;
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        _.homePage.RenameWorkspace(newWorkspaceName, workspaceId);
        cy.CreateAppForWorkspace(workspaceId, appid);
        _.homePage.NavigateToHome();
        cy.LogOut();
      });
    });
  });
  it("1. create app with same name in a different workspace", function () {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);
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
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      console.log("createWorkspace response: ", interception);
      newWorkspaceName = interception.response.body.data.name;
      _.homePage.RenameWorkspace(newWorkspaceName, newWSName);
      cy.CreateAppForWorkspace(newWSName, appid);
    });
  });
});
