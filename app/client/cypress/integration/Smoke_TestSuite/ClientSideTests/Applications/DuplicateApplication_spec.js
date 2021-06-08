const dsl = require("../../../../fixtures/basicDsl.json");
const homePage = require("../../../../locators/HomePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorerlocators = require("../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const testdata = require("../../../../fixtures/testdata.json");

let duplicateApplicationDsl;
let parentApplicationDsl;

describe("Duplicate application", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check whether the duplicate application has the same dsl as the original", function() {
    const appname = localStorage.getItem("AppName");
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.SearchApp(appname);
    cy.get("@getPage");
    cy.SearchEntityandOpen("Input1");
    cy.get(widgetsPage.defaultInput).type("A");
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.wait("@updateLayout").then((httpResponse) => {
      const data = httpResponse.response.body.data;
      parentApplicationDsl = data.dsl;
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.NavigateToHome();
    cy.get(homePage.searchInput).type(appname);
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
      const data = httpResponse.response.body.data;
      duplicateApplicationDsl = data.layouts[0].dsl;
      cy.log(JSON.stringify(duplicateApplicationDsl));
      cy.log(JSON.stringify(parentApplicationDsl));
      expect(JSON.stringify(duplicateApplicationDsl)).to.deep.equal(
        JSON.stringify(parentApplicationDsl),
      );
    });
  });
});
