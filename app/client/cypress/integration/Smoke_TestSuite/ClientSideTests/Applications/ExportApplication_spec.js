const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const homePage = require("../../../../locators/HomePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Export application as a JSON file", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check if the forked application has the same dsl as the original", function() {
    cy.get(commonlocators.homeIcon).click({ force: true });
    const appname = localStorage.getItem("AppName");
    cy.get(homePage.searchInput).type(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.exportAppFromMenu).click({ force: true });
    cy.get(homePage.exportAppModal).should("be.visible");
    cy.get(homePage.exportAppConfirmationCheckbox).click({ force: true });
    cy.get(homePage.exportAppButton).click({ force: true });

    cy.wait("@exportApplication").then((interception) => {
      const { status, success } = interception.response.body.responseMeta;
      assert.equal(status, 200);
      assert.isTrue(success);
    });
  });
});
