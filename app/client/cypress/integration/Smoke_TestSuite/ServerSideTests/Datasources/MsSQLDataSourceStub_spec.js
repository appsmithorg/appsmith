const datasource = require("../../../../locators/DatasourcesEditor.json");
const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");

let datasourceName;

describe("MsSQL datasource test cases", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create, test, save then delete a MsSQL datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MsSQL).click();
    cy.getPluginFormsAndCreateDatasource();

    cy.fillMsSQLDatasourceForm();
    cy.generateUUID().then((UUID) => {
      datasourceName = `MsSQL MOCKDS ${UUID}`;
      cy.renameDatasource(datasourceName);
    });

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.testSaveDatasource(false);
  });

  it("2. Create with trailing white spaces in host address and database name, test, save then delete a MsSQL datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MsSQL).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillMsSQLDatasourceForm(true);
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.testSaveDatasource(false);
  });

  it("3. Create a new query from the datasource editor", function() {
    // cy.get(datasource.createQuery).click();
    cy.get(`${datasourceEditor.datasourceCard} ${datasource.createQuery}`)
      .last()
      .click();
    cy.wait("@createNewApi").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.deleteQueryUsingContext();

    cy.deleteDatasource(datasourceName);
  });
});
