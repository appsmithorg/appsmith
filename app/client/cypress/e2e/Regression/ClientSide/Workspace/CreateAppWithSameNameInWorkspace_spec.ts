/// <reference types="Cypress" />
import homePage from "../../../../locators/HomePage";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
const application = require("../../../../locators/Applications.json");
import * as _ from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(
  "Create workspace and a new app / delete and recreate app",
  { tags: ["@tag.Workspace", "@tag.AccessControl"] },
  function () {
    let workspaceId;
    let appid;
    it("1. Create app within an workspace and delete and re-create another app with same name", function () {
      _.homePage.NavigateToHome();
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceId = uid;
        appid = uid;
        featureFlagIntercept({ license_gac_enabled: true });
        cy.wait(2000);
        _.homePage.CreateNewWorkspace(uid);
        //Automated as part of Bug19506
        cy.get(application.shareButton).first().click({ force: true });
        if (CURRENT_REPO === REPO.CE) {
          cy.xpath(application.placeholderTxt).should("be.visible");
        } else {
          cy.xpath(application.placeholderTxtEE).should("be.visible");
        }
        cy.get(application.closeModalPopupMember).click({ force: true });
        _.homePage.CreateAppInWorkspace(uid, uid);
        cy.get(homePage.shareApp).click({ force: true });
        if (CURRENT_REPO === REPO.CE) {
          cy.xpath(application.placeholderTxt).should("be.visible");
        } else {
          cy.xpath(application.placeholderTxtEE).should("be.visible");
        }
        cy.get(application.closeModalPopupMember).click({ force: true });
        cy.DeleteAppByApi();
        _.homePage.NavigateToHome();
        _.homePage.CreateAppInWorkspace(uid, uid);
      });
    });
  },
);
