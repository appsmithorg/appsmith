const explorerLocators = require("../../../../locators/explorerlocators.json");
const guidedTourLocators = require("../../../../locators/GuidedTour.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const homePage = require("../../../../locators/HomePage");
import * as _ from "../../../../support/Objects/ObjectsCore";
let workspaceName;

describe("Creating new app after discontinuing guided tour should not start the same", function() {
  it("1. Creating new app after discontinuing guided tour should not start the same", function() {
    // Start guided tour
    _.homePage.NavigateToHome();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceName = "CNAppWorspace" + uid;
      _.homePage.CreateNewWorkspace(workspaceName);
      _.homePage.CreateAppInWorkspace(workspaceName); //Since welcome tour always creates app in 1st workspace available
      _.homePage.NavigateToHome();
    });
    _.agHelper.Sleep(4000); //Adding only because of the CI failure
    _.dataSources.CloseReconnectDataSourceModal(); // Check if reconnect data source modal is visible and close it
    cy.get(guidedTourLocators.welcomeTour)
      .click()
      .wait(2000);
    _.dataSources.CloseReconnectDataSourceModal(); // Check if reconnect data source modal is visible and close it
    cy.get("body").then(($ele) => {
      if ($ele.find(guidedTourLocators.welcomeTour).length) {
        cy.get(guidedTourLocators.welcomeTour)
          .click()
          .wait(2000);
      }
    });
    _.dataSources.CloseReconnectDataSourceModal(); // Check if reconnect data source modal is visible and close it

    cy.get("body").then(($ele) => {
      if ($ele.find(guidedTourLocators.startBuilding).length == 0) {
        cy.get(commonlocators.homeIcon).click({ force: true });
        cy.get(guidedTourLocators.welcomeTour)
          .click()
          .wait(4000);
      }
    });

    cy.get(guidedTourLocators.startBuilding).should("be.visible");
    // Go back to applications page
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.get(homePage.createNewAppButton)
      .first()
      .click();
    // Check if explorer is visible, explorer is collapsed initialy in guided tour
    cy.get(explorerLocators.entityExplorer).should("be.visible");
  });
});
