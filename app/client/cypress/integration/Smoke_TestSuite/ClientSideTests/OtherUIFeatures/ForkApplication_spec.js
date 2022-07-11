const dsl = require("../../../../fixtures/basicDsl.json");
import homePage from "../../../../locators/HomePage";
import applicationLocators from "../../../../locators/Applications.json";
import signupPageLocators from "../../../../locators/SignupPage.json";
import loginPageLocators from "../../../../locators/LoginPage.json";
import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";

let forkedApplicationDsl;
let parentApplicationDsl;
let forkableAppUrl;

describe("Fork application across workspaces", function() {
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
      cy.log(JSON.stringify(forkedApplicationDsl));
      cy.log(JSON.stringify(parentApplicationDsl));
      expect(JSON.stringify(forkedApplicationDsl)).to.contain(
        JSON.stringify(parentApplicationDsl),
      );
    });
  });

  it("Non signed user should be able to fork a public forkable app", function() {
    cy.NavigateToHome();
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    cy.get(homePage.workspaceImportAppOption).click({ force: true });
    cy.get(homePage.workspaceImportAppModal).should("be.visible");
    cy.xpath(homePage.uploadLogo).attachFile("forkNonSignedInUser.json");
    cy.wait("@importNewApplication").then((interception) => {
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
          force: true,
        });
        cy.wait(2000);
      }

      cy.PublishtheApp();
      cy.get("button:contains('Share')")
        .first()
        .click({ force: true });
      cy.enablePublicAccess();

      cy.url().then((url) => {
        forkableAppUrl = url;
        cy.get(homePage.profileMenu).click();
        cy.get(homePage.signOutIcon).click();

        cy.visit(forkableAppUrl);
        cy.wait(8000);
        cy.get(applicationLocators.forkButton)
          .first()
          .click({ force: true });
        cy.get(loginPageLocators.signupLink).click();

        cy.generateUUID().then((uid) => {
          cy.get(signupPageLocators.username).type(`${uid}@appsmith.com`);
          cy.get(signupPageLocators.password).type(uid);
          cy.get(signupPageLocators.submitBtn).click();
          cy.wait(10000);
          cy.get(applicationLocators.forkButton)
            .first()
            .click({ force: true });
          cy.get(homePage.forkAppWorkspaceButton).should("be.visible");
        });
      });
    });
  });
});
