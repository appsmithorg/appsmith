const dsl = require("../../../fixtures/displayWidgetDsl.json");
const homePage = require("../../../locators/HomePage.json");
const commonlocators = require("../../../locators/commonlocators.json");
const explorerlocators = require("../../../locators/explorerlocators.json");
let duplicateApplicationDsl;

describe("Duplicate application", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check whether the duplicate application has the same dsl as the original", function() {
    cy.get(commonlocators.homeIcon).click({ force: true });
    const appname = localStorage.getItem("AppName");
    cy.get(homePage.searchInput).type(appname);
    cy.wait(2000);

    cy.get(homePage.applicationCard).trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.deleteButton)
      .contains("Duplicate")
      .click({ force: true });

    cy.get(explorerlocators.entityExplorer).should("be.visible");
    cy.wait("@getPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get("@getPage").then(httpResponse => {
      const data = httpResponse.response.body.data;
      duplicateApplicationDsl = data.layouts[0].dsl;

      expect(duplicateApplicationDsl).to.deep.equal(dsl.dsl);
    });
  });
});
