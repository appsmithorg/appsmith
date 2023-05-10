const dsl = require("../../../../fixtures/basicDsl.json");
import homePage from "../../../../locators/HomePage";

let forkedApplicationDsl;
let parentApplicationDsl;

describe("Fork application across workspaces", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Signed user should be able to fork a public forkable app & Check if the forked application has the same dsl as the original", function () {
    const appname = localStorage.getItem("AppName");
    cy.SearchEntityandOpen("Input1");
    cy.intercept("PUT", "/api/v1/layouts/*/pages/*").as("inputUpdate");
    cy.testJsontext("defaultvalue", "A");
    cy.wait("@inputUpdate").then((response) => {
      parentApplicationDsl = response.response.body.data.dsl;
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.NavigateToHome();
    cy.get(homePage.searchInput).type(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.applicationCard).first().trigger("mouseover");
    cy.get(homePage.appEditIcon).first().click({ force: true });

    cy.get(".t--application-name").click({ force: true });
    cy.contains("Fork Application").click({ force: true });

    cy.get(homePage.forkAppWorkspaceButton).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(4000);
    cy.wait("@postForkAppWorkspace").then((httpResponse) => {
      expect(httpResponse.status).to.equal(200);
    });
    // check that forked application has same dsl
    cy.get("@getPage").then((httpResponse) => {
      const data = httpResponse.response.body.data;
      forkedApplicationDsl = data.layouts[0].dsl;
      expect(JSON.stringify(forkedApplicationDsl)).to.contain(
        JSON.stringify(parentApplicationDsl),
      );
    });
  });
});
