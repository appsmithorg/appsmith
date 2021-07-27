const pages = require("../../../../locators/Pages.json");
const generatePage = require("../../../../locators/GeneratePage.json");
import homePage from "../../../../locators/HomePage.json";
import datasource from "../../../../locators/DatasourcesEditor.json";

describe("Generate New CRUD Page Inside from entity explorer", function() {
  before(() => {
    cy.startRoutesForDatasource();
    cy.createPostgresDatasource();
    // TODO
    // 1. Add INVALID credential for a datasource and test the invalid datasource structure flow.
    // 2. Add 2 supported datasource and 1 not supported datasource with a fixed name to search.
  });

  it("Add new Page and generate CRUD template using existing supported datasource", function() {
    cy.get(pages.AddPage)
      .first()
      .click();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.get(generatePage.generateCRUDPageActionCard).click();

    cy.get(generatePage.selectDatasourceDropdown).click();

    cy.get(generatePage.datasourceDropdownOption)
      .first()
      .click();

    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(generatePage.selectTableDropdown).click();

    cy.get(generatePage.dropdownOption)
      .first()
      .click();
    //  skip optional search column selection.
    cy.get(generatePage.generatePageFormSubmitBtn).click();

    cy.wait("@replaceLayoutWithCRUDPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@getActions");
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
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
    // create New App and click on generate CURD page

    cy.get(generatePage.generateCRUDPageActionCard).click();

    cy.get(generatePage.selectDatasourceDropdown).click();

    cy.contains("Connect New Datasource").click();

    cy.get(datasource.PostgreSQL).click();

    cy.fillPostgresDatasourceForm();

    cy.generateUUID().then((UUID) => {
      cy.renameDatasource(`PostgresSQL CRUD Demo ${UUID}`);
    });

    cy.startRoutesForDatasource();
    cy.get(".t--save-datasource").click();
    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(generatePage.selectTableDropdown).click();

    cy.get(generatePage.dropdownOption)
      .first()
      .click();
    //  skip optional search column selection.
    cy.get(generatePage.generatePageFormSubmitBtn).click();

    cy.wait("@replaceLayoutWithCRUDPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@getActions");
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Generate CRUD page from datasource ACTIVE section", function() {
    cy.NavigateToQueryEditor();
    cy.get(pages.integrationActiveTab)
      .should("be.visible")
      .click({ force: true });

    cy.get(generatePage.datasourceCardGeneratePageBtn)
      .first()
      .click();

    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(generatePage.selectTableDropdown).click();

    cy.get(generatePage.dropdownOption)
      .first()
      .click();
    //  skip optional search column selection.
    cy.get(generatePage.generatePageFormSubmitBtn).click();

    cy.wait("@generateCRUDPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@getActions");
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
