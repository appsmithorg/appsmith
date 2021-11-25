const dsl = require("../../../../fixtures/basicDsl.json");
const homePage = require("../../../../locators/HomePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");

let forkedApplicationDsl;
let parentApplicationDsl;

describe("Fork application across orgs", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check if the forked application has the same dsl as the original", function() {
    const appname = localStorage.getItem("AppName");
    cy.SearchEntityandOpen("Input1");
    cy.intercept("PUT", "/api/v1/layouts/*/pages/*").as("inputUpdate");
    cy.testJsontext("defaulttext", "A");
    cy.wait("@inputUpdate").then((response) => {
      parentApplicationDsl = response.response.body.data.dsl;
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.NavigateToHome();
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
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(4000);
    cy.wait("@postForkAppOrg").then((httpResponse) => {
      expect(httpResponse.status).to.equal(200);
    });
    // check that forked application has same dsl
    cy.get("@getPage").then((httpResponse) => {
      const data = httpResponse.response.body.data;
      forkedApplicationDsl = data.layouts[0].dsl;
      cy.log(JSON.stringify(forkedApplicationDsl));
      cy.log(JSON.stringify(parentApplicationDsl));
      expect(JSON.stringify(forkedApplicationDsl)).to.contain(
        JSON.stringify(parentApplicationDsl),
      );
    });
  });
});
