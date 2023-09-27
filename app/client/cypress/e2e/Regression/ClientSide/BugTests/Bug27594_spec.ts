import homePageLocatores from "../../../../locators/HomePage";
import {
  homePage,
  agHelper,
  dataSources,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Bug 27594: Datasource test throws error even when credentials are correct", function () {
  let newWorkspaceName;
  it("1. Import application from json and validate data on pageload", function () {
    // Navigate to home page
    homePage.NavigateToHome();

    // Create a new workspace
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      newWorkspaceName = uid;
      homePage.CreateNewWorkspace(newWorkspaceName);
      agHelper.GetNClick(homePageLocatores.optionsIcon, 1);
      agHelper.GetNClick(homePageLocatores.workspaceImportAppOption, 0, true);

      agHelper.AssertElementVisibility(
        homePageLocatores.workspaceImportAppModal,
      );
      cy.xpath(homePageLocatores.uploadLogo).selectFile(
        "cypress/fixtures/forkedApp.json",
        { force: true },
      );
      if (!Cypress.env("AIRGAPPED")) {
        assertHelper.AssertNetworkStatus("@getReleaseItems");
      } else {
        agHelper.Sleep(2000);
      }

      // import exported application in new workspace
      cy.wait("@importNewApplication").then((interception) => {
        const { isPartialImport } = interception?.response?.body.data;
        if (isPartialImport) {
          // should reconnect button
          dataSources.ReconnectSingleDSNAssert("mockdata", "PostgreSQL", true);
          homePage.AssertNCloseImport();
          agHelper.Sleep(2000);
        } else {
          cy.get(homePageLocatores.toastMessage).should(
            "contain",
            "Application imported successfully",
          );
        }
        const importedApp = interception?.response?.body.data.application;
        const appSlug = importedApp.slug;
        cy.wait("@getPagesForCreateApp").then((interception) => {
          const pages = interception?.response?.body.data.pages;
          let defaultPage = pages.find((eachPage) => !!eachPage.isDefault);
          // validating data binding for imported application
          agHelper.AssertElementVisibility("//input[@value='Submit']");
          agHelper.AssertElementVisibility("//span[text()='schema_name']");
          agHelper.AssertElementVisibility("//span[text()='id']");
          agHelper.AssertElementVisibility("//span[text()='title']']");
          agHelper.AssertElementVisibility("//span[text()='due");

          cy.url().should(
            "include",
            `/${appSlug}/${defaultPage.slug}-${defaultPage.id}/edit`,
          );
        });
      });
    });
  });
});
