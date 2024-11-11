import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
import homePageLocators from "../../../../locators/HomePage";
import {
  agHelper,
  homePage,
  adminSettings,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Export application as a JSON file",
  { tags: ["@tag.ImportExport", "@tag.Git"] },
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

          cy.LoginFromAPI(
            Cypress.env("TESTUSERNAME1"),
            Cypress.env("TESTPASSWORD1"),
          );
          homePage.SelectWorkspace(workspaceId);

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
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      if (CURRENT_REPO === REPO.EE) adminSettings.EnableGAC(false, true);
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

        cy.LoginFromAPI(
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
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      if (CURRENT_REPO === REPO.EE) adminSettings.EnableGAC(false, true);
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

        cy.LoginFromAPI(
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
