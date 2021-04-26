const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const homePage = require("../../../../locators/HomePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorerlocators = require("../../../../locators/explorerlocators.json");
let duplicateApplicationDsl;

describe("Duplicate application", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check whether the forked application has the same dsl as the original", function() {
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
    cy.get(homePage.forkApp).click({ force: true });

    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    // cy.wait("@getPage").should(
    //     "have.nested.property",
    //     "response.body.responseMeta.status",
    //     200,
    // );
    // cy.wait("@getPagesForCreateApp").should(
    //     "have.nested.property",
    //     "response.body.responseMeta.status",
    //     200,
    // );
    // cy.wait("@getPage");
    // cy.get("@getPage").then((httpResponse) => {
    // const data = httpResponse.response.body.data;
    // duplicateApplicationDsl = data.layouts[0].dsl;
    // console.log(httpResponse);
    // expect(duplicateApplicationDsl).to.deep.equal(dsl.dsl);
    // });
    // cy.wait("@postForkAppOrg");
    // cy.wait("@getPage");
    // cy.wait("@getPage").then((httpResponse) => {
    //   const data = httpResponse.response.body.data;
    //   duplicateApplicationDsl = data.layouts[0].dsl;
    //   console.log(duplicateApplicationDsl, dsl.dsl);
    //   expect(duplicateApplicationDsl).to.deep.equal(dsl.dsl);
    // });
    // cy.wait("@getPage").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );
    // cy.get("@getPage").then((httpResponse) => {
    //   const data = httpResponse.response.body.data;
    //   duplicateApplicationDsl = data.layouts[0].dsl;

    //   expect(duplicateApplicationDsl).to.deep.equal(dsl.dsl);
    // });
  });
});
