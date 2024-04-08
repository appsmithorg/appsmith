const { default: HomePage } = require("../../../../locators/HomePage");
const commonlocators = require("../../../../locators/commonlocators.json");
const { agHelper } = require("../../../../support/Objects/ObjectsCore");

describe("Check for product updates button and modal", function () {
  it("1. Check if we should show the product updates button and it opens the updates modal", function () {
    cy.get(commonlocators.homeIcon).click({ force: true });
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const { newReleasesCount, releaseItems } = state.ui.releases;
        if (Array.isArray(releaseItems) && releaseItems.length > 0) {
          agHelper.GetNClick(HomePage.helpButton, 0);
          cy.get(".t--product-updates-btn")
            .contains("What's new?")
            .click({ force: true });
          //eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(500); // modal transition
          cy.get("div[role='dialog']").contains("Product updates");
          cy.get("div[role=dialog] button[aria-label='Close']").click();
          //eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(500); // modal transition
          cy.get(".ads-v2-modal__content").should("not.exist");
        } else {
          cy.get("span.t--product-updates-btn").should("not.exist");
        }
      });
  });
});
