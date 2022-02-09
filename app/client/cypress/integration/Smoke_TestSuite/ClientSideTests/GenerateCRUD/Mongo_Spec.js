const pages = require("../../../../locators/Pages.json");
const generatePage = require("../../../../locators/GeneratePage.json");
import homePage from "../../../../locators/HomePage.json";
const datasource = require("../../../../locators/DatasourcesEditor.json");

describe("Generate New CRUD Page Inside from Mongo as Data Source", function() {
  let datasourceName;

  before(() => {
    cy.startRoutesForDatasource();
    //cy.startInterceptRoutesForMongo(); //if used in before - 2nd testcase failing with no aliasing found error
  });

  beforeEach(function() {
    if (Cypress.env("Mongo") === 0) {
      cy.log("Mongo DB is not found. Using intercept");
      cy.startInterceptRoutesForMongo();
    } else cy.log("Mongo DB is found, hence using actual DB");
  });

  it("1. Add new Page and generate CRUD template using existing supported datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click({ force: true });

    if (Cypress.env("Mongo") === 0) cy.fillMongoDatasourceFormWithURI();
    else cy.fillMongoDatasourceForm();

    cy.generateUUID().then((uid) => {
      datasourceName = `Mongo MOCKDS ${uid}`;
      cy.renameDatasource(datasourceName);
      cy.wrap(datasourceName).as("dSName");
    });

    //TestData source

    cy.get(".t--test-datasource").click();
    cy.wait("@testDatasource");

    //Save source
    cy.get(".t--save-datasource").click();

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

  it("2. Create new app and Generate CRUD page using a new datasource", function() {
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

    cy.get(datasource.MongoDB).click();

    if (Cypress.env("Mongo") === 0) cy.fillMongoDatasourceFormWithURI();
    else cy.fillMongoDatasourceForm();

    cy.generateUUID().then((uid) => {
      datasourceName = `Mongo MOCKDS ${uid}`;
      cy.renameDatasource(datasourceName);
      cy.wrap(datasourceName).as("dSName");
    });

    //TestData source
    cy.get(".t--test-datasource").click();
    cy.wait("@testDatasource");

    //Save source
    cy.get(".t--save-datasource").click();

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

  it("3. Generate CRUD page from datasource ACTIVE section", function() {
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
