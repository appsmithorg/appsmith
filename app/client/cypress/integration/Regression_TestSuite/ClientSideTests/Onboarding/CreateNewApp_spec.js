const explorerLocators = require("../../../../locators/explorerlocators.json");
const guidedTourLocators = require("../../../../locators/GuidedTour.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const homePage = require("../../../../locators/HomePage");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let datasources = ObjectsRegistry.DataSources;

describe("Creating new app after discontinuing guided tour should not start the same", function() {
  it("1. Creating new app after discontinuing guided tour should not start the same", function() {
    // Start guided tour
    cy.get(commonlocators.homeIcon).click({ force: true });
    datasources.CloseReconnectDataSourceModal(); // Check if reconnect data source modal is visible and close it
    cy.get(guidedTourLocators.welcomeTour)
      .click()
      .wait(2000);
    datasources.CloseReconnectDataSourceModal(); // Check if reconnect data source modal is visible and close it
    cy.get("body").then(($ele) => {
      if ($ele.find(guidedTourLocators.welcomeTour).length) {
        cy.get(guidedTourLocators.welcomeTour)
          .click()
          .wait(2000);
      }
    });
    datasources.CloseReconnectDataSourceModal(); // Check if reconnect data source modal is visible and close it
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
