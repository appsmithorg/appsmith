import applicationLocators from "../../../../locators/Applications.json";
import signupPageLocators from "../../../../locators/SignupPage.json";
import loginPageLocators from "../../../../locators/LoginPage.json";
import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";
import homepagelocators from "../../../../locators/HomePage";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
import {
  agHelper,
  appSettings,
  adminSettings,
  assertHelper,
  deployMode,
  embedSettings,
  fakerHelper,
  homePage,
  inviteModal,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  AppSidebar,
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let forkableAppUrl: any;

describe(
  "Fork application across workspaces",
  { tags: ["@tag.Fork"] },
  function () {
    it("1. Mark application as forkable", () => {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      if (CURRENT_REPO === REPO.EE) adminSettings.EnableGAC(false, true);

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
        cy.LoginFromAPI(
          Cypress.env("TESTUSERNAME1"),
          Cypress.env("TESTPASSWORD1"),
        );
        agHelper.VisitNAssert(forkableAppUrl);
        agHelper.AssertElementVisibility(applicationLocators.forkButton);
      });
    });

    it("2. Check if the forked application has the same dsl as the original", function () {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      const workspaceName = fakerHelper.GetRandomNumber() + "workspace";

      homePage.CreateNewWorkspace(workspaceName);
      homePage.CreateAppInWorkspace(workspaceName);
      agHelper.AddDsl("basicDsl");
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);

      let parentApplicationDsl: any;
      cy.intercept("PUT", "/api/v1/layouts/*/pages/*").as("inputUpdate");
      cy.testJsontext("defaultvalue", "A");
      cy.wait("@inputUpdate").then((response: any) => {
        parentApplicationDsl = response.response.body.data.dsl;
      });

      homePage.NavigateToHome();
      agHelper.WaitUntilEleAppear(homepagelocators.searchInput);
      agHelper.GetElement(homepagelocators.searchInput).type(workspaceName);
      agHelper.WaitUntilEleAppear(homepagelocators.appMoreIcon);
      agHelper.GetNClick(homepagelocators.appMoreIcon, 0, true);
      agHelper.GetNClick(homepagelocators.forkAppFromMenu, 0, true);
      agHelper.GetNClick(homepagelocators.forkAppWorkspaceButton, 0, true);
      assertHelper.AssertNetworkStatus("@postForkAppWorkspace", 200);
      assertHelper.WaitForNetworkCall("@getConsolidatedData");
      cy.get("@getConsolidatedData").then((httpResponse: any) => {
        const data = httpResponse.response.body.data?.pageWithMigratedDsl?.data;
        const forkedApplicationDsl = data.layouts[0].dsl;
        expect(forkedApplicationDsl).to.deep.eq(parentApplicationDsl);
      });
    });

    it("3. Non signed user should be able to fork a public forkable app", function () {
      homePage.NavigateToHome();
      agHelper.GetElement(homepagelocators.homeIcon).click();
      agHelper.GetNClick(homepagelocators.createNew, 0);
      agHelper
        .GetElement(homepagelocators.workspaceImportAppOption)
        .click({ force: true });
      agHelper
        .GetElement(homepagelocators.workspaceImportAppModal)
        .should("be.visible");
      agHelper
        .GetElement(homepagelocators.uploadLogo)
        .selectFile("cypress/fixtures/forkNonSignedInUser.json", {
          force: true,
        });
      assertHelper.WaitForNetworkCall("@importNewApplication");
      cy.get("@importNewApplication").then((interception: any) => {
        const { isPartialImport } = interception.response?.body.data;
        cy.log("isPartialImport : ", isPartialImport);
        if (isPartialImport) {
          agHelper.WaitUntilEleAppear(reconnectDatasourceModal.SkipToAppBtn);
          agHelper.WaitUntilEleAppear(dataSources._saveDs);
          agHelper.GetNClick(reconnectDatasourceModal.SkipToAppBtn, 0, true);
          agHelper.WaitUntilEleDisappear(reconnectDatasourceModal.SkipToAppBtn);
        }
        AppSidebar.assertVisible();
        deployMode.DeployApp();
        agHelper.GetNClick(appSettings.locators._shareButton, 0, true);
        cy.enablePublicAccess();

        cy.url().then((url) => {
          forkableAppUrl = url;
          homePage.LogOutviaAPI();
          agHelper.VisitNAssert(forkableAppUrl);
          agHelper.GetNClick(applicationLocators.forkButton, 0, true);
          agHelper.GetNClick(loginPageLocators.signupLink);
          agHelper.GenerateUUID();
          cy.get("@guid").then((uid: any) => {
            agHelper
              .GetElement(signupPageLocators.username)
              .type(`${uid}@appsmith.com`);
            agHelper.GetElement(signupPageLocators.password).type(uid);
            agHelper.GetNClick(signupPageLocators.submitBtn);
            agHelper.WaitUntilEleAppear(applicationLocators.forkButton);
            agHelper.GetNClick(applicationLocators.forkButton, 0, true);
            agHelper.AssertElementVisibility(
              homepagelocators.forkAppWorkspaceButton,
            );
          });
        });
      });
    });
  },
);
