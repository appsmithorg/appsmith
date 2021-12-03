const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");

let datasourceName;

describe("Redshift datasource test cases", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create, test, save then delete a Redshift datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.Redshift).click();
    cy.getPluginFormsAndCreateDatasource();

    cy.fillRedshiftDatasourceForm();
    cy.generateUUID().then((UUID) => {
      datasourceName = `Redshift MOCKDS ${UUID}`;
      cy.renameDatasource(datasourceName);
    });

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.testSaveDatasource();
  });

  it("Create with trailing white spaces in host address and database name, test, save then delete a Redshift datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.Redshift).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillRedshiftDatasourceForm(true);
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.testSaveDatasource();
  });

  it("Create a new query from the datasource editor", function() {
    cy.saveDatasource();
    // cy.get(datasource.createQuerty).click();
    cy.get(`${datasourceEditor.datasourceCard} ${datasource.createQuerty}`)
      .last()
      .click();
    cy.wait("@createNewApi").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.get(queryEditor.queryMoreAction).click();
    cy.get(queryEditor.deleteUsingContext).click();
    cy.wait("@deleteAction").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.deleteDatasource(datasourceName);
  });
});
