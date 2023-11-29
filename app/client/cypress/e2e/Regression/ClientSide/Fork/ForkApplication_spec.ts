import applicationLocators from "../../../../locators/Applications.json";
import signupPageLocators from "../../../../locators/SignupPage.json";
import loginPageLocators from "../../../../locators/LoginPage.json";
import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";
import homepagelocators from "../../../../locators/HomePage";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  appSettings,
  deployMode,
  embedSettings,
  fakerHelper,
  homePage,
  inviteModal,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let forkedApplicationDsl;
let parentApplicationDsl;
let forkableAppUrl;

describe("Fork application across workspaces", function () {
  before(() => {
    agHelper.AddDsl("basicDsl");
  });

  it("1. Check if the forked application has the same dsl as the original", function () {
    const appname = localStorage.getItem("workspaceName");
    EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);

    cy.intercept("PUT", "/api/v1/layouts/*/pages/*").as("inputUpdate");
    cy.testJsontext("defaultvalue", "A");
    cy.wait("@inputUpdate").then((response) => {
      parentApplicationDsl = response.response.body.data.dsl;
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    homePage.NavigateToHome();
    cy.get(homepagelocators.searchInput).type(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(homepagelocators.appMoreIcon).first().click({ force: true });
    cy.get(homepagelocators.forkAppFromMenu).click({ force: true });
    cy.get(homepagelocators.forkAppWorkspaceButton).click({ force: true });
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
    homePage.NavigateToHome();
    cy.get(homepagelocators.homeIcon).click();
    cy.get(homepagelocators.optionsIcon).first().click();
    cy.get(homepagelocators.workspaceImportAppOption).click({ force: true });
    cy.get(homepagelocators.workspaceImportAppModal).should("be.visible");
    cy.xpath(homepagelocators.uploadLogo).selectFile(
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
      deployMode.DeployApp();
      agHelper.Sleep(2000);
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
          cy.get(homepagelocators.forkAppWorkspaceButton).should("be.visible");
        });
      });
    });
  });

  it("3. Mark application as forkable", () => {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);
    homePage.CreateNewApplication();
    appSettings.OpenAppSettings();
    appSettings.GoToEmbedSettings();
    embedSettings.ToggleMarkForkable();
    embedSettings.TogglePublicAccess();

    inviteModal.OpenShareModal();
    homePage.InviteUserToApplication(
      fakerHelper.GetRandomText(5) + "@appsmith.com",
      "App Viewer",
    );

    inviteModal.CloseModal();
    deployMode.DeployApp();

    cy.url().then((url) => {
      forkableAppUrl = url;
      cy.LogOut();
      cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
      cy.visit(forkableAppUrl);

      agHelper.AssertElementVisibility(applicationLocators.forkButton);
    });
  });
});
