const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const homePage = require("../../../../locators/HomePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorerlocators = require("../../../../locators/explorerlocators.json");
let duplicateApplicationDsl;

describe("Duplicate application", function() {
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
    cy.get(homePage.forkAppFromMenu).click({ force: true });
    cy.get(homePage.forkAppOrgButton).click({ force: true });
    cy.wait("@postForkAppOrg").then((httpResponse) => {
      console.log("response: ", httpResponse);
      const { id, organizationId, name } = httpResponse.response.body.data;
      expect(httpResponse.status).to.equal(200);
    });
  });
});
