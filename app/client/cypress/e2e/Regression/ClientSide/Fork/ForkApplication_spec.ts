import homePage from "../../../../locators/HomePage";
import applicationLocators from "../../../../locators/Applications.json";
import signupPageLocators from "../../../../locators/SignupPage.json";
import loginPageLocators from "../../../../locators/LoginPage.json";
import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";
import * as _ from "../../../../support/Objects/ObjectsCore";

let forkedApplicationDsl;
let parentApplicationDsl;
let forkableAppUrl;

describe("Fork application across workspaces", function () {
  before(() => {
    _.agHelper.AddDsl("basicDsl");
  });

  it("1. Check if the forked application has the same dsl as the original", function () {
    const appname = localStorage.getItem("AppName");
    _.entityExplorer.SelectEntityByName("Input1");

    cy.intercept("PUT", "/api/v1/layouts/*/pages/*").as("inputUpdate");
    cy.testJsontext("defaultvalue", "A");
    cy.wait("@inputUpdate").then((response) => {
      parentApplicationDsl = response.response.body.data.dsl;
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    _.homePage.NavigateToHome();
    cy.get(homePage.searchInput).type(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homePage.appMoreIcon).first().click({ force: true });
    cy.get(homePage.forkAppFromMenu).click({ force: true });
    cy.get(homePage.forkAppWorkspaceButton).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(4000);
    cy.wait("@postForkAppWorkspace")
      .its("response.body.responseMeta.status")
      .should("eq", 200);
    cy.wait("@getWorkspace");
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

  it("2. Non signed user should be able to fork a public forkable app", function () {
    _.homePage.NavigateToHome();
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon).first().click();
    cy.get(homePage.workspaceImportAppOption).click({ force: true });
    cy.get(homePage.workspaceImportAppModal).should("be.visible");
    cy.xpath(homePage.uploadLogo).selectFile(
      "cypress/fixtures/forkNonSignedInUser.json",
      { force: true },
    );
    cy.wait("@importNewApplication").then((interception) => {
      const { isPartialImport } = interception.response.body.data;
      cy.log("isPartialImport : ", isPartialImport);
      if (isPartialImport) {
        cy.wait(2000);
        cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
          force: true,
        });
        cy.wait(2000);
      }
      cy.get("#sidebar").should("be.visible");
      _.deployMode.DeployApp();
      _.agHelper.Sleep(2000);
      cy.get("button:contains('Share')").first().click({ force: true });
      // _.agHelper.Sleep(1000);
      // cy.get("body").then(($ele) => {
      //   if ($ele.find(homePage.enablePublicAccess).length <= 0) {
      //     cy.contains("Retry").click();
      //     cy.get("button:contains('Share')")
      //       .first()
      //       .click({ force: true });
      //   }
      // });
      cy.enablePublicAccess();

      cy.url().then((url) => {
        forkableAppUrl = url;
        cy.LogOut();

        cy.visit(forkableAppUrl);
        //cy.reload();
        //cy.visit(forkableAppUrl);
        cy.wait(4000);
        cy.get(applicationLocators.forkButton).first().click({ force: true });
        cy.get(loginPageLocators.signupLink).click();

        cy.generateUUID().then((uid) => {
          cy.get(signupPageLocators.username).type(`${uid}@appsmith.com`);
          cy.get(signupPageLocators.password).type(uid);
          cy.get(signupPageLocators.submitBtn).click();
          cy.wait(10000);
          cy.get(applicationLocators.forkButton).first().click({ force: true });
          cy.get(homePage.forkAppWorkspaceButton).should("be.visible");
          _.agHelper.GetNClick(_.locators._dialogCloseButton);
          cy.LogOut();
          cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
          _.homePage.CreateNewApplication();
        });
      });
    });
  });

  it.skip("Mark application as forkable", () => {
    _.appSettings.OpenAppSettings();
    _.appSettings.GoToEmbedSettings();
    _.embedSettings.ToggleMarkForkable();

    _.inviteModal.OpenShareModal();
    _.homePage.InviteUserToApplication(
      Cypress.env("TESTUSERNAME1"),
      "App Viewer",
      false,
    );
    _.inviteModal.CloseModal();

    _.deployMode.DeployApp();
    cy.url().then((url) => {
      forkableAppUrl = url;
      cy.LogOut();
      cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
      cy.visit(forkableAppUrl);

      _.agHelper.AssertElementVisible(applicationLocators.forkButton);
    });
  });
});
