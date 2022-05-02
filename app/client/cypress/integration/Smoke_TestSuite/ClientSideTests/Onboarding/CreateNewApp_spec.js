const explorerLocators = require("../../../../locators/explorerlocators.json");
const guidedTourLocators = require("../../../../locators/GuidedTour.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const homePage = require("../../../../locators/HomePage");

describe("Creating new app after discontinuing guided tour should not start the same", function() {
  it("Creating new app after discontinuing guided tour should not start the same", function() {
    // Start guided tour
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.get(guidedTourLocators.welcomeTour).click();
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
