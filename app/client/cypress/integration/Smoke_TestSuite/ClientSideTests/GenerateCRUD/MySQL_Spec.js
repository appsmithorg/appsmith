const pages = require("../../../../locators/Pages.json");
const generatePage = require("../../../../locators/GeneratePage.json");
import homePage from "../../../../locators/HomePage.json";
const datasource = require("../../../../locators/DatasourcesEditor.json");

describe("Generate New CRUD Page Inside from My SQL as Data Source", function() {
  let datasourceName;

  before(() => {
    cy.startRoutesForDatasource();
    //cy.startInterceptRoutesForMySQL(); //if used in before - 2nd testcase failing with no aliasing found error
  });

  beforeEach(function() {
    if (Cypress.env("MySQL") === 0) {
      cy.log("MySQL DB is not found. Using intercept");
      cy.startInterceptRoutesForMySQL();
    } else cy.log("MySQL DB is found, hence using actual DB");
  });

  it("Add new Page and generate CRUD template using existing supported datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MySQL).click();
    cy.fillMySQLDatasourceForm();

    cy.generateUUID().then((uid) => {
      datasourceName = `MySQL MOCKDS ${uid}`;
      cy.renameDatasource(datasourceName);
      cy.wrap(datasourceName).as("dSName");
    });

    //TestData source

    cy.get(".t--test-datasource").click();
    cy.wait("@testDatasource");

    //Save source
    cy.get(".t--save-datasource").click();

    //Not using hence commented
    // cy.intercept("PUT", "/api/v1/datasources/*", {
    //   fixture: "mySQL_PUT_saveDataSource1.json",
    // }).as("saveDataSourceStub");

    //If uncommented - then tc fails
    // cy.wait("@saveDataSourceStub").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );

    //Verify page after save clicked
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });

    //Create New page
    cy.get(pages.AddPage)
      .first()
      .click();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    //Generate New CRUD in new page

    cy.get("@dSName").then((dbName) => {
      cy.get(generatePage.generateCRUDPageActionCard).click();
      cy.get(generatePage.selectDatasourceDropdown).click();
      cy.get(generatePage.datasourceDropdownOption)
        .contains(dbName)
        .click();
    });

    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(generatePage.selectTableDropdown).click();
    cy.get(generatePage.dropdownOption)
      .first()
      .click();
    cy.get(generatePage.generatePageFormSubmitBtn).click();

    cy.wait("@replaceLayoutWithCRUDPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@getActions").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get("span:contains('GOT IT')").click();
  });

  it("Create new app and Generate CRUD page using a new datasource", function() {
    cy.NavigateToHome();

    cy.get(homePage.createNew)
      .first()
      .click({ force: true });

    cy.wait("@createNewApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.get(generatePage.generateCRUDPageActionCard).click();
    cy.get(generatePage.selectDatasourceDropdown).click();

    cy.contains("Connect New Datasource").click();

    cy.get(datasource.MySQL).click();
    cy.fillMySQLDatasourceForm();

    cy.generateUUID().then((uid) => {
      datasourceName = `MySQL MOCKDS ${uid}`;
      cy.renameDatasource(datasourceName);
      cy.wrap(datasourceName).as("dSName");
    });

    //TestData source
    cy.get(".t--test-datasource").click();
    cy.wait("@testDatasource");

    //Save source
    cy.get(".t--save-datasource").click();

    //Since not being used - commenting it
    // cy.intercept("PUT", "/api/v1/datasources/*", {
    //   fixture: "mySQL_PUT_saveDataSource1.json",
    // }).as("saveDataSourceStub");

    //This below stub is for populating actual dropdown values - hence not needed in intercept cases
    // cy.wait("@getDatasourceStructure").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );

    //Generate Stub for tables dropdown values also
    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(generatePage.selectTableDropdown).click();
    cy.get(generatePage.dropdownOption)
      .first()
      .click();
    cy.get(generatePage.generatePageFormSubmitBtn).click();

    cy.wait("@replaceLayoutWithCRUDPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@getActions").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get("span:contains('GOT IT')").click();
  });

  it("Generate CRUD page from datasource ACTIVE section", function() {
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.wait(1000);

    cy.get(datasource.datasourceCard)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .closest(datasource.datasourceCard)
      .within(() => {
        cy.get(datasource.datasourceCardGeneratePageBtn).click();
      });

    //Generate Stub for tables dropdown values also
    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(generatePage.selectTableDropdown).click();
    cy.get(generatePage.dropdownOption)
      .first()
      .click();
    cy.get(generatePage.generatePageFormSubmitBtn).click();

    cy.wait("@replaceLayoutWithCRUDPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@getActions").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get("span:contains('GOT IT')").click();
  });
});
