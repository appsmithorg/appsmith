import gitSyncLocators from "../../../../locators/gitSyncLocators";
const homePage = require("../../../../locators/HomePage");
const reconnectDatasourceModal = require("../../../../locators/ReconnectLocators");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const pages = require("../../../../locators/Pages.json");
const commonlocators = require("../../../../locators/commonlocators.json")
let repoName;
let appName;
const jsObject = "JSObject1"
const commonLocators = require("../../../../locators/commonlocators.json");
const newBranch = "feat/temp";

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
      cy.get(reconnectDatasourceModal.Modal).should("be.visible");
      cy.ReconnectDatasource("TEDPostgres");
      cy.wait(1000);
      cy.fillPostgresDatasourceForm();
      cy.testSaveDatasource();
      cy.wait(2000);
      // commenting until bug 12535 is closed
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
      // cy.get(".tbody")
      //   .first()
      //   .should("contain.text", "Test user 7");
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
    cy.wait(100);
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
  it("Verfiy imported app should have all the data binding visible in deploy and edit mode", () => {
    // verify postgres data binded to table
    // cy.get(".tbody")
    //  .first()
    // .should("contain.text", "Test user 7");
    // verify MySQL data binded to table
    // cy.get(".tbody").last().should("contain.text", "New Config")
    // verify api response binded to input widget
    cy.xpath("//input[@value='this is a test']");
    // verify js object binded to input widget
    cy.xpath("//input[@value='Success']");
  });
  it("Create a new branch, clone page and validate data on that branch in deploy and edit mode", () => {
    cy.createGitBranch(newBranch);
    cy.get(".tbody")
      .first()
      .should("contain.text", "Test user 7");
    // verify MySQL data binded to table
    // cy.get(".tbody").last().should("contain.text", "New Config")
    // verify api response binded to input widget
    cy.xpath("//input[@value='this is a test']");
    // verify js object binded to input widget
    cy.xpath("//input[@value='Success']");
    cy.CheckAndUnfoldEntityItem("PAGES");
     // clone the page1 and validate data binding
     cy.get(".t--entity-name:contains(Page1)")
     .trigger("mouseover")
     .click({ force: true });
   cy.xpath(apiwidget.popover)
     .first()
     .should("be.hidden")
     .invoke("show")
     .click({ force: true });
   cy.get(pages.clonePage).click({ force: true });
   cy.wait("@clonePage").should(
     "have.nested.property",
     "response.body.responseMeta.status",
     201,
   );
   cy.CheckAndUnfoldEntityItem("QUERIES/JS");
   // verify jsObject is not duplicated
 // cy.get(`.t--entity-name:contains(${jsObject})`).should("have.length", 1);
 //  cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
 //    "be.visible",
 //  );
   // deploy the app and validate data binding
    cy.wait(2000);
    cy.commitAndPush();
    cy.merge()
    cy.wait(2000);
    cy.latestDeployPreview();
    cy.get(".tbody")
      .first()
      .should("contain.text", "Test user 7");
    // verify api response binded to input widget
    cy.xpath("//input[@value='this is a test']");
    // verify js object binded to input widget
  ///  cy.xpath("//input[@value='Success']");
    // navigate to Page1 and verify data
    cy.get(".tbody")
      .first()
      .should("contain.text", "Test user 7");
    // verify api response binded to input widget
    cy.xpath("//input[@value='this is a test']");
    // verify js object binded to input widget
   // cy.xpath("//input[@value='Success']");
    cy.get(commonlocators.backToEditor).click();
    cy.wait(2000);
  });
  it("Switch to master and verify data in edit and deploy mode", () => {
    cy.switchGitBranch("master");
    cy.wait(5000)
    // validate data binding in edit and deploy mode
    cy.latestDeployPreview();
    cy.get(".tbody")
      .first()
      .should("contain.text", "Test user 7");
    // verify api response binded to input widget
    cy.xpath("//input[@value='this is a test']");
    // verify js object binded to input widget
  ///  cy.xpath("//input[@value='Success']");
    // navigate to Page1 and verify data
    cy.get(".tbody")
      .first()
      .should("contain.text", "Test user 7");
    // verify api response binded to input widget
    cy.xpath("//input[@value='this is a test']");
    // verify js object binded to input widget
   // cy.xpath("//input[@value='Success']");
   cy.get(commonlocators.backToEditor).click();
   cy.wait(2000);
  });

});
after(() => {
  cy.deleteTestGithubRepo(repoName);
});

