/// <reference types="Cypress" />
import homePage from "../../../../locators/HomePage";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
const application = require("../../../../locators/Applications.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Create workspace and a new app / delete and recreate app", function () {
  it("1. Create app within an workspace and delete and re-create another app with same name", function () {
    cy.NavigateToHome();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
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
      cy.NavigateToHome();
      _.homePage.CreateAppInWorkspace(uid, uid);
    });
  });
});
