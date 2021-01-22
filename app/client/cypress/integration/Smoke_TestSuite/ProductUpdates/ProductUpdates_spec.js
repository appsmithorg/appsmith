const commonlocators = require("../../../locators/commonlocators.json");

describe("Check for product updates button and modal", function() {
  it("Check if we should show the product updates button and it opens the updates modal", function() {
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.wait(2000);

    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const { releaseItems, newReleasesCount } = state.ui.releases;
        if (Array.isArray(releaseItems) && releaseItems.length > 0) {
          cy.get("[data-cy=t--product-updates-btn]")
            .contains(newReleasesCount)
            .click({ force: true });
          cy.wait(500); // modal transition
          cy.get(".bp3-dialog-container").contains("Product Updates");
          cy.get("[data-cy=t--product-updates-close-btn]").click({
            force: true,
          });
          cy.wait(500); // modal transition
          cy.get(".bp3-dialog-container").should("not.exist");
        } else {
          cy.get("[data-cy=t--product-updates-btn]").should("not.exist");
        }
      });

    // cy.get(homePage.applicationCard)
    //   .first()
    //   .trigger("mouseover");
    // cy.get(homePage.appMoreIcon)
    //   .first()
    //   .click({ force: true });
    // cy.get(homePage.duplicateApp).click({ force: true });

    // cy.wait("@getPage").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );
    // cy.get("@getPage").then(httpResponse => {
    //   const data = httpResponse.response.body.data;
    //   duplicateApplicationDsl = data.layouts[0].dsl;

    //   expect(duplicateApplicationDsl).to.deep.equal(dsl.dsl);
    // });
  });
});
