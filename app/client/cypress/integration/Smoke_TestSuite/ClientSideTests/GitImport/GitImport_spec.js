import gitSyncLocators from "../../../../locators/gitSyncLocators";
const homePage = require("../../../../locators/HomePage");
const reconnectDatasourceModal = require("../../../../locators/ReconnectLocators");
let repoName;
let appName;

describe("Git import flow", function() {
  before(() => {
    cy.NavigateToHome();
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      const newOrganizationName = interception.response.body.data.name;
      cy.CreateAppForOrg(newOrganizationName, newOrganizationName);
    });
  });
  it("Import an app from JSON with Postgres, MySQL, Mongo db", () => {
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    cy.get(homePage.orgImportAppOption).click({ force: true });
    cy.get(homePage.orgImportAppModal).should("be.visible");
    cy.xpath(homePage.uploadLogo).attachFile("gitImport.json");
    cy.wait("@importNewApplication").then((interception) => {
      cy.wait(100);
      // should check reconnect modal opening
      // const { isPartialImport } = interception.response.body.data;
      // if (isPartialImport) {
      // should reconnect button
      cy.get(reconnectDatasourceModal.Modal).should("be.visible");
      cy.ReconnectDatasource("TEDPostgres");
      cy.wait(1000);
      cy.fillPostgresDatasourceForm();
      cy.testSaveDatasource();
      cy.wait(2000);
      // commenting until bug12535 is closed
      /*  cy.ReconnectDatasource("TEDMySQL");
        cy.wait(2000);
        cy.fillMySQLDatasourceForm();
        cy.testSaveDatasource();
        cy.wait(2000);
        cy.ReconnectDatasource("TEDMongo");
        cy.wait(2000);
        cy.fillMongoDatasourceForm();
        cy.testSaveDatasource();
        cy.wait(2000);
    //  } else {
        cy.get(homePage.toastMessage).should(
          "contain",
          "Application imported successfully",
      ); */
      cy.get(reconnectDatasourceModal.SkipToAppBtn).click({ force: true });
      cy.wait(2000);
      cy.get(".tbody")
        .first()
        .should("contain.text", "Test user 7");
      cy.generateUUID().then((uid) => {
        repoName = uid;
        cy.createTestGithubRepo(repoName);
        cy.connectToGitRepo(repoName);
      });
    });
  });
  it("Import an app from Git and reconnect Postgres, MySQL and Mongo db ", () => {
    cy.NavigateToHome();
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      const newOrganizationName = interception.response.body.data.name;
      cy.CreateAppForOrg(newOrganizationName, "gitImport");
    });
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    cy.get(homePage.orgImportAppOption).click({ force: true });
    cy.get(".t--import-json-card")
      .next()
      .click();
    cy.importAppFromGit(repoName);
    //  cy.wait("@importNewApplication").then((interception) => {
    cy.wait(100);
    // should check reconnect modal opening
    // const { isPartialImport } = interception.response.body.data;
    // if (isPartialImport) {
    // should reconnect button
    cy.get(reconnectDatasourceModal.Modal).should("be.visible");
    cy.ReconnectDatasource("TEDPostgres");
    cy.wait(1000);
    cy.fillPostgresDatasourceForm();
    cy.testSaveDatasource();
    cy.wait(1000);
    /*  cy.ReconnectDatasource("TEDMySQL");
        cy.wait(1000);
        cy.fillMySQLDatasourceForm();
        cy.testSaveDatasource();
        cy.wait(1000);
        cy.ReconnectDatasource("TEDMongo");
        cy.wait(1000);
        cy.fillMongoDatasourceForm();
        cy.testSaveDatasource();
        cy.wait(2000);
    } else {
      cy.get(homePage.toastMessage).should(
        "contain",
        "Application imported successfully",
      ); 
    } */
    cy.get(reconnectDatasourceModal.SkipToAppBtn).click({ force: true });
  });
  it("Verfiy imported app should have all the data binding visible", () => {
    // verify postgres data binded to table
    cy.get(".tbody")
      .first()
      .should("contain.text", "Test user 7");
    // verify MySQL data binded to table
    // cy.get(".tbody").last().should("contain.text", "New Config")
    // verify api response binded to input widget
    cy.xpath("//input[@value='this is a test']");
    // verify js object binded to input widget
    cy.xpath("//input[@value='Success']");
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
