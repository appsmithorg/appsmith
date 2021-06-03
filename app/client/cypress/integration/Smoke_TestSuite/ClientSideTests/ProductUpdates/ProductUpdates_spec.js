const commonlocators = require("../../../../locators/commonlocators.json");

describe("Check for product updates button and modal", function() {
  it("Check if we should show the product updates button and it opens the updates modal", function() {
    cy.get(commonlocators.homeIcon).click({ force: true });
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const { newReleasesCount, releaseItems } = state.ui.releases;
        if (Array.isArray(releaseItems) && releaseItems.length > 0) {
          cy.get("[data-cy=t--product-updates-btn]")
            .contains("What's New?")
            .click({ force: true });
          //eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(500); // modal transition
          cy.get(".bp3-dialog-container").contains("Product Updates");
          cy.get("[data-cy=t--product-updates-close-btn]").click({
            force: true,
          });
          //eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(500); // modal transition
          cy.get(".bp3-dialog-container").should("not.exist");
        } else {
          cy.get("[data-cy=t--product-updates-btn]").should("not.exist");
        }
      });
  });
});
