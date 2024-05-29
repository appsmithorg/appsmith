import homePageLocators from "../../../locators/HomePage";
import reconnectDatasourceModal from "../../../locators/ReconnectLocators";
import {
  homePage,
  agHelper,
  dataSources,
  assertHelper,
} from "../../../support/Objects/ObjectsCore";

describe("Import, Export and Fork application and validate data binding", { tags: ["@tag.ImportExport"] }, function () {
  let workspaceId;
  let newWorkspaceName;
  let appName;

  before(() => {
    agHelper.GenerateUUID().then((uid) => {
      workspaceId = uid;
    });
  });

  it("1. Import application from json and validate data on pageload", function () {
    homePage.NavigateToHome();
    agHelper.GetNClick(homePageLocators.createNew, 0);
    cy.get(homePageLocators.workspaceImportAppOption).click({ force: true });
    cy.get(homePageLocators.workspaceImportAppModal).should("be.visible");
    cy.xpath(homePageLocators.uploadLogo).selectFile("cypress/fixtures/forkedApp.json", { force: true });

    cy.get(homePageLocators.importAppProgressWrapper).should("be.visible");
    cy.wait("@importNewApplication").then((interception) => {
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        dataSources.ReconnectSingleDSNAssert("mockdata", "PostgreSQL");
        homePage.AssertNCloseImport();
      } else {
        cy.get(homePageLocators.toastMessage).should("contain", Cypress.env("MESSAGES").IMPORT_APP_SUCCESSFUL());
      }

      agHelper.GenerateUUID().then((uid) => {
        appName = `app${uid}`;
        renameApplication(appName);
        validateDataBinding();
      });
    });
  });

  it("2. Fork application and validate data binding for the widgets", function () {
    forkApplication(appName);
    validateDataBinding();
  });

  it("3. Export and import application and validate data binding for the widgets", function () {
    exportApplication(appName).then((filePath) => {
      importApplication(filePath);
      validateDataBinding();
    });
  });

  function renameApplication(newName) {
    cy.get(homePageLocators.applicationName).click({ force: true });
    cy.get(homePageLocators.portalMenuItem).contains("Rename", { matchCase: false }).click({ force: true });
    cy.get(`${homePageLocators.applicationName} input`).type(newName, { force: true });
    agHelper.ClickOutside();
    cy.wait("@updateApplication").its("response.body.responseMeta.status").should("eq", 200);
    cy.wrap(newName).as("appName");
  }

  function validateDataBinding() {
    cy.xpath("//input[@value='Submit']").should("be.visible");
    cy.xpath("//span[text()='schema_name']").should("be.visible");
    cy.xpath("//span[text()='id']").should("be.visible");
    cy.xpath("//span[text()='title']").should("be.visible");
    cy.xpath("//span[text()='due']").should("be.visible");
  }

  function forkApplication(appName) {
    homePage.NavigateToHome();
    cy.get(homePageLocators.searchInput).type(`${appName}`);
    cy.get(homePageLocators.appMoreIcon).first().click({ force: true });
    cy.get(homePageLocators.forkAppFromMenu).click({ force: true });
    cy.get(homePageLocators.forkAppWorkspaceButton).click({ force: true });
  }

  function exportApplication(appName) {
    homePage.NavigateToHome();
    cy.get(homePageLocators.searchInput).clear().type(`${appName}`);
    cy.get(homePageLocators.appMoreIcon).first().click({ force: true });
    cy.get(homePageLocators.exportAppFromMenu).click({ force: true });

    return cy.get('a[id=t--export-app-link]').then((anchor) => {
      const url = anchor.prop("href");
      return cy.request(url).then(({ body, headers }) => {
        expect(headers).to.have.property("content-type", "application/json");
        expect(headers).to.have.property("content-disposition").that.includes("attachment;").and.includes(`filename*=UTF-8''${appName}`).and.includes(".json");
        const filePath = "cypress/fixtures/exportedApp.json";
        cy.writeFile(filePath, body, "utf-8");
        agHelper.AssertContains("Successfully exported");
        agHelper.WaitUntilAllToastsDisappear();
        return filePath;
      });
    });
  }

  function importApplication(filePath) {
    agHelper.GenerateUUID().then((uid) => {
      newWorkspaceName = uid;
      homePage.CreateNewWorkspace(newWorkspaceName);
      agHelper.GetNClick(homePageLocators.createNew, 0, true);
      cy.get(homePageLocators.workspaceImportAppOption).click({ force: true });
      cy.get(homePageLocators.workspaceImportAppModal).should("be.visible");
      cy.xpath(homePageLocators.uploadLogo).selectFile(filePath, { force: true });
      if (!Cypress.env("AIRGAPPED")) assertHelper.AssertNetworkStatus("@getAllWorkspaces");

      cy.wait("@importNewApplication").then((interception) => {
        const { isPartialImport } = interception.response.body.data;
        if (isPartialImport) {
          agHelper.AssertElementVisibility(dataSources._testDs);
          cy.get(reconnectDatasourceModal.SkipToAppBtn).click({ force: true });
        } else {
          cy.get(homePageLocators.toastMessage).should("contain", Cypress.env("MESSAGES").IMPORT_APP_SUCCESSFUL());
        }

        const importedApp = interception.response.body.data.application;
        const appSlug = importedApp.slug;
        cy.wait("@getConsolidatedData").then((interception) => {
          const pages = interception.response.body.data.pages.data.pages;
          const defaultPage = pages.find((eachPage) => !!eachPage.isDefault);
          validateDataBinding();
          cy.url().should("include", `/${appSlug}/${defaultPage.slug}-${defaultPage.id}/edit`);
        });
      });
    });
  }
});
