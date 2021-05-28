const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const homePage = require("../../../../locators/HomePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
let forkedApplicationDsl;

describe("Fork application across orgs", function() {
  before(() => {
    dsl.dsl.version = 21; // latest migrated version
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
    // select a different org here
    cy.get(homePage.forkAppOrgList)
      .children()
      .last()
      .click({ force: true });
    cy.get(homePage.forkAppOrgButton).click({ force: true });
    cy.wait("@postForkAppOrg").then((httpResponse) => {
      expect(httpResponse.status).to.equal(200);
    });
    // check that forked application has same dsl
    cy.get("@getPage").then((httpResponse) => {
      const data = httpResponse.response.body.data;
      forkedApplicationDsl = data.layouts[0].dsl;

      expect(forkedApplicationDsl).to.deep.equal(dsl.dsl);
    });
  });
});
