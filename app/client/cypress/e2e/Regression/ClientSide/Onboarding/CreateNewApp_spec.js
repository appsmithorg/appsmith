const explorerLocators = require("../../../../locators/explorerlocators.json");
const guidedTourLocators = require("../../../../locators/GuidedTour.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import homePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "excludeForAirgap",
  "Creating new app after discontinuing guided tour should not start the same",
  function () {
    it("1. Creating new app after discontinuing guided tour should not start the same", function () {
      // Start guided tour
      _.homePage.NavigateToHome();

      // Temporary workaround until https://github.com/appsmithorg/appsmith/issues/24665 is fixed
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        _.homePage.CreateNewWorkspace("GuidedtourWorkspace" + uid);
        _.homePage.CreateAppInWorkspace(
          "GuidedtourWorkspace" + uid,
          `GuidedtourApp${uid}`,
        );
        _.homePage.NavigateToHome();
      });

      cy.get(guidedTourLocators.welcomeTour).click();
      cy.get(guidedTourLocators.startBuilding).should("be.visible");
      // Go back to applications page
      cy.get(commonlocators.homeIcon).click({ force: true });
      cy.get(homePage.createNewAppButton).first().click();
      // Check if explorer is visible, explorer is collapsed initialy in guided tour
      cy.get(explorerLocators.entityExplorer).should("be.visible");
    });
  },
);
