import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
import homePageLocators from "../../../../locators/HomePage";
import { agHelper, homePage } from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(
  "Export application as a JSON file",
  { tags: ["@tag.ExportApplication"] },
  function () {
    let workspaceId, appid;

    before(() => {
      agHelper.AddDsl("displayWidgetDsl");
    });

    it("1. User with admin access,should be able to export the app", function () {
      if (CURRENT_REPO === REPO.CE) {
        agHelper.GenerateUUID();
        cy.get("@guid").then((uid) => {
          homePage.CreateNewWorkspace("exportApp" + uid, true);
          homePage.CreateAppInWorkspace("exportApp" + uid, "App" + uid);
          appid = "App" + uid;
          workspaceId = "exportApp" + uid;
          cy.get(homePageLocators.shareApp).click({ force: true });
          homePage.InviteUserToApplication(
            Cypress.env("TESTUSERNAME1"),
            "Administrator",
          );
          cy.LogOut();

          cy.LogintoApp(
            Cypress.env("TESTUSERNAME1"),
            Cypress.env("TESTPASSWORD1"),
          );
          agHelper.WaitUntilEleAppear(homePageLocators.searchInput);
          agHelper.TypeText(homePageLocators.searchInput, workspaceId);
          agHelper.WaitUntilEleAppear(
            homePage._searchWorkspaceLocator(workspaceId),
          );
          agHelper.GetNClick(
            homePage._searchWorkspaceLocator(workspaceId),
            0,
            true,
          );
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(2000);

          cy.get(homePageLocators.appMoreIcon).first().click({ force: true });
          cy.get(homePageLocators.exportAppFromMenu).should("be.visible");
          cy.xpath(homePageLocators.workspaceHeading)
            .first()
            .click({ force: true });
          cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
          cy.get(homePageLocators.appEditIcon).first().click({ force: true });
          cy.get(homePageLocators.applicationName).click({ force: true });
          cy.contains("Export application").should("be.visible");
        });
        cy.LogOut();
      }
    });

    it("2. User with developer access,should not be able to export the app", function () {
      cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      agHelper.Sleep(2000);

      homePage.NavigateToHome();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        homePage.CreateNewWorkspace("exportApp" + uid);
        homePage.CreateAppInWorkspace("exportApp" + uid, "App" + uid);
        appid = "App" + uid;
        workspaceId = "exportApp" + uid;
        cy.get(homePageLocators.shareApp).click({ force: true });
        homePage.InviteUserToApplication(
          Cypress.env("TESTUSERNAME1"),
          "Developer",
        );

        cy.LogOut();

        cy.LogintoApp(
          Cypress.env("TESTUSERNAME1"),
          Cypress.env("TESTPASSWORD1"),
        );
        cy.log({ appid });

        homePage.SelectWorkspace(workspaceId);

        cy.get(homePageLocators.appMoreIcon).first().click({ force: true });
        cy.get(homePageLocators.exportAppFromMenu).should("not.exist");
        cy.xpath(homePageLocators.workspaceHeading)
          .first()
          .click({ force: true });
        cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
        cy.get(homePageLocators.appEditIcon).first().click({ force: true });
        cy.get(homePageLocators.applicationName).click({ force: true });
        cy.contains("Export application").should("not.exist");
      });
      cy.LogOut();
    });

    it("3. User with viewer access,should not be able to export the app", function () {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      agHelper.Sleep(2000);

      homePage.NavigateToHome();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        homePage.CreateNewWorkspace("exportApp" + uid);
        homePage.CreateAppInWorkspace("exportApp" + uid, "App" + uid);
        appid = "App" + uid;
        workspaceId = "exportApp" + uid;
        cy.get(homePageLocators.shareApp).click({ force: true });

        homePage.InviteUserToApplication(
          Cypress.env("TESTUSERNAME1"),
          "App Viewer",
        );
        cy.LogOut();

        cy.LogintoApp(
          Cypress.env("TESTUSERNAME1"),
          Cypress.env("TESTPASSWORD1"),
        );
        cy.log({ appid });

        homePage.SelectWorkspace(workspaceId);

        cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
        cy.get(homePageLocators.appEditIcon).should("not.exist");
      });
      cy.LogOut();
    });
  },
);
