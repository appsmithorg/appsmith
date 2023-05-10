const explorerLocators = require("../../../../locators/explorerlocators.json");
const guidedTourLocators = require("../../../../locators/GuidedTour.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import homePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";

/* TODO: Skipping this test because there is an issue with Datasource.ts referencing the CloseReconectDatasourceModal method
QA will fix it */
describe(
  "excludeForAirgap",
  "Creating new app after discontinuing guided tour should not start the same",
  function () {
    it.skip("1. Creating new app after discontinuing guided tour should not start the same", function () {
      // Start guided tour
      _.homePage.NavigateToHome();
      cy.get(guidedTourLocators.welcomeTour).click();
      _.dataSources.CloseReconnectDataSourceModal(); // Check if reconnect data source modal is visible and close it

      cy.get(guidedTourLocators.startBuilding).should("be.visible");
      // Go back to applications page
      cy.get(commonlocators.homeIcon).click({ force: true });
      cy.get(homePage.createNewAppButton).first().click();
      // Check if explorer is visible, explorer is collapsed initialy in guided tour
      cy.get(explorerLocators.entityExplorer).should("be.visible");
    });
  },
);
