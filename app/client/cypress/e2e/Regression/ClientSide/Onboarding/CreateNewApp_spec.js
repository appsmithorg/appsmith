const explorerLocators = require("../../../../locators/explorerlocators.json");
const guidedTourLocators = require("../../../../locators/GuidedTour.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import homePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Creating new app after discontinuing guided tour should not start the same",
  { tags: ["@tag.excludeForAirgap"] },
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

      _.agHelper.GetNClick(_.homePage._helpButton);
      _.agHelper.GetNClick(guidedTourLocators.welcomeTour, 0)
      cy.get(guidedTourLocators.startBuilding).should("be.visible");
      // Go back to applications page
      _.agHelper.GetNClick(commonlocators.homeIcon, 0, true)
      _.agHelper.GetNClick(homePage.createNewAppButton)
      _.agHelper.GetNClick(homePage.newButtonCreateApplication)
      _.agHelper.WaitUntilEleAppear(commonlocators.globalSearchTrigger);
      // Check if explorer is visible, explorer is collapsed initialy in guided tour
      cy.get(explorerLocators.entityExplorer).should("be.visible");
    });
  },
);
