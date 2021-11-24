const dsl = require("../../../../fixtures/basicDsl.json");
const homePage = require("../../../../locators/HomePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");

let duplicateApplicationDsl;
let parentApplicationDsl;

describe("Duplicate application", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check whether the duplicate application has the same dsl as the original", function() {
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
    cy.get(homePage.duplicateApp).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(4000);
    cy.wait("@getPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get("@getPage").then((httpResponse) => {
      duplicateApplicationDsl = httpResponse.response.body.data.layouts[0].dsl;
      cy.log(JSON.stringify(duplicateApplicationDsl));
      cy.log(JSON.stringify(parentApplicationDsl));
      expect(JSON.stringify(duplicateApplicationDsl)).to.deep.equal(
        JSON.stringify(parentApplicationDsl),
      );
    });
  });
});
