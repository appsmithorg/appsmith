import homePageLocators from "../../../locators/HomePage";
import { homePage, dataSources } from "../../../support/Objects/ObjectsCore";

describe("Reconnect Datasource Modal validation while importing application", function () {
  let workspaceId;
  let appid;
  let newWorkspaceName;
  let appName;
  it("1. Import application from json with one postgres and success modal", function () {
    homePage.NavigateToHome();
    // import application
    cy.generateUUID().then((uid) => {
      workspaceId = uid;
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((createWorkspaceInterception) => {
        newWorkspaceName = createWorkspaceInterception.response.body.data.name;
        homePage.RenameWorkspace(newWorkspaceName, workspaceId);
        cy.get(homePageLocators.workspaceImportAppOption).click({
          force: true,
        });
        cy.get(homePageLocators.workspaceImportAppModal).should("be.visible");
        cy.xpath(homePageLocators.uploadLogo)
          .first()
          .selectFile("cypress/fixtures/one_postgres.json", {
            force: true,
          });
        cy.wait("@importNewApplication").then((interception) => {
          cy.wait(100);
          // should check reconnect modal openning
          const { isPartialImport } = interception.response.body.data;
          if (isPartialImport) {
            dataSources.ReconnectSingleDSNAssert(
              "Untitled Datasource",
              "PostgreSQL",
            );
          } else {
            cy.get(homePageLocators.toastMessage).should(
              "contain",
              "Application imported successfully",
            );
          }
          // check datasource configured success modal
          cy.get(".t--import-app-success-modal").should("be.visible");
          cy.get(".t--import-app-success-modal").should(
            "contain",
            "All your datasources are configured and ready to use.",
          );
          cy.get(".t--import-success-modal-got-it").click({ force: true });
          cy.get(".t--import-app-success-modal").should("not.exist");
          cy.wait("@getWorkspace");

          const uuid = () => Cypress._.random(0, 1e4);
          const name = uuid();
          appName = `app${name}`;
          cy.get(homePageLocators.applicationName).click({ force: true });
          cy.get(homePageLocators.portalMenuItem)
            .contains("Rename", { matchCase: false })
            .click({ force: true });
          cy.wait(2000);
          cy.get(homePageLocators.applicationName).type(appName);
        });
      });
    });
  });
});
