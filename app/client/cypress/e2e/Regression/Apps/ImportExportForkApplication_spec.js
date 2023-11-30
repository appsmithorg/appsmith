import homePageLocatores from "../../../locators/HomePage";
import reconnectDatasourceModal from "../../../locators/ReconnectLocators";
import {
  homePage,
  agHelper,
  dataSources,
  assertHelper,
} from "../../../support/Objects/ObjectsCore";

describe("Import, Export and Fork application and validate data binding", function () {
  let workspaceId;
  let newWorkspaceName;
  let appName;
  it("1. Import application from json and validate data on pageload", function () {
    // import application
    homePage.NavigateToHome();
    cy.get(homePageLocatores.optionsIcon).first().click();
    cy.get(homePageLocatores.workspaceImportAppOption).click({ force: true });
    cy.get(homePageLocatores.workspaceImportAppModal).should("be.visible");
    cy.xpath(homePageLocatores.uploadLogo).selectFile(
      "cypress/fixtures/forkedApp.json",
      { force: true },
    );

    cy.get(homePageLocatores.importAppProgressWrapper).should("be.visible");
    cy.wait("@importNewApplication").then((interception) => {
      cy.wait(100);
      // should check reconnect modal openning
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        // should reconnect button
        dataSources.ReconnectSingleDSNAssert("mockdata", "PostgreSQL");
        homePage.AssertNCloseImport();
        cy.wait(2000);
      } else {
        cy.get(homePageLocatores.toastMessage).should(
          "contain",
          "Application imported successfully",
        );
      }
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        appName = `app${uid}`;
        cy.get(homePageLocatores.applicationName).click({ force: true });
        cy.get(homePageLocatores.portalMenuItem)
          .contains("Rename", { matchCase: false })
          .click({ force: true });
        cy.wait(2000);
        cy.get(homePageLocatores.applicationName + " input").type(appName, {
          force: true,
        });
        agHelper.ClickOutside();
        cy.wait("@updateApplication")
          .its("response.body.responseMeta.status")
          .should("eq", 200);
        cy.wait(2000);
        cy.wrap(appName).as("appname");
      });
      cy.wait(3000);
      // validating data binding for the imported application
      cy.xpath("//input[@value='Submit']").should("be.visible");
      cy.xpath("//span[text()='schema_name']").should("be.visible");
      cy.xpath("//span[text()='id']").should("be.visible");
      cy.xpath("//span[text()='title']").should("be.visible");
      cy.xpath("//span[text()='due']").should("be.visible");
    });
  });

  it("2. Fork application and validate data binding for the widgets", function () {
    // fork application
    homePage.NavigateToHome();
    cy.get(homePageLocatores.searchInput).type(`${appName}`);
    cy.wait(3000);
    // cy.get(homePage.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocatores.appMoreIcon).first().click({ force: true });
    cy.get(homePageLocatores.forkAppFromMenu).click({ force: true });
    cy.get(homePageLocatores.forkAppWorkspaceButton).click({ force: true });
    cy.wait(4000);
    // validating data binding for the forked application
    cy.xpath("//input[@value='Submit']").should("be.visible");
    cy.xpath("//span[text()='schema_name']").should("be.visible");
    cy.xpath("//span[text()='id']").should("be.visible");
    cy.xpath("//span[text()='title']").should("be.visible");
    cy.xpath("//span[text()='due']").should("be.visible");
  });

  it("3. Export and import application and validate data binding for the widgets", function () {
    homePage.NavigateToHome();
    cy.get(homePageLocatores.searchInput).clear().type(`${appName}`);
    cy.wait(2000);
    //cy.get(homePageLocatores.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocatores.appMoreIcon).first().click({ force: true });
    // export application
    cy.get(homePageLocatores.exportAppFromMenu).click({ force: true });
    cy.get(homePageLocatores.searchInput).clear();
    cy.get(`a[id=t--export-app-link]`).then((anchor) => {
      const url = anchor.prop("href");
      cy.request(url).then(({ body, headers }) => {
        expect(headers).to.have.property("content-type", "application/json");
        expect(headers)
          .to.have.property("content-disposition")
          .that.includes("attachment;")
          .and.includes(`filename*=UTF-8''${appName}.json`);
        cy.writeFile("cypress/fixtures/exportedApp.json", body, "utf-8");
        agHelper.AssertContains("Successfully exported");
        agHelper.WaitUntilAllToastsDisappear();
        agHelper.GenerateUUID();
        cy.get("@guid").then((uid) => {
          newWorkspaceName = uid;
          homePage.CreateNewWorkspace(newWorkspaceName);
          cy.get(homePageLocatores.workspaceImportAppOption).click({
            force: true,
          });

          cy.get(homePageLocatores.workspaceImportAppModal).should(
            "be.visible",
          );
          cy.xpath(homePageLocatores.uploadLogo).selectFile(
            "cypress/fixtures/exportedApp.json",
            { force: true },
          );
          if (!Cypress.env("AIRGAPPED")) {
            assertHelper.AssertNetworkStatus("@getReleaseItems");
          } else {
            agHelper.Sleep(2000);
          }

          // import exported application in new workspace
          // cy.get(homePageLocatores.workspaceImportAppButton).click({ force: true });
          cy.wait("@importNewApplication").then((interception) => {
            const { isPartialImport } = interception.response.body.data;
            if (isPartialImport) {
              // should reconnect button
              agHelper.AssertElementVisibility(dataSources._testDs); //Making sure modal is fully loaded
              cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
                force: true,
              });
              cy.wait(2000);
            } else {
              cy.get(homePageLocatores.toastMessage).should(
                "contain",
                "Application imported successfully",
              );
            }
            const importedApp = interception.response.body.data.application;
            const appSlug = importedApp.slug;
            cy.wait("@getPagesForCreateApp").then((interception) => {
              const pages = interception.response.body.data.pages;
              let defaultPage = pages.find((eachPage) => !!eachPage.isDefault);
              // validating data binding for imported application
              cy.xpath("//input[@value='Submit']").should("be.visible");
              cy.xpath("//span[text()='schema_name']").should("be.visible");
              // cy.xpath("//span[text()='information_schema']").should(
              //   "be.visible",
              // );
              cy.xpath("//span[text()='id']").should("be.visible");
              cy.xpath("//span[text()='title']").should("be.visible");
              cy.xpath("//span[text()='due']").should("be.visible");

              cy.url().should(
                "include",
                `/${appSlug}/${defaultPage.slug}-${defaultPage.id}/edit`,
              );
            });
          });
        });
      });
    });
  });
});
