const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");

let elasticSearchName;

describe("Elastic search datasource tests", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create elastic search datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.ElasticSearch).click();
    cy.generateUUID().then((uid) => {
      elasticSearchName = uid;

      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(elasticSearchName, { force: true })
        .should("have.value", elasticSearchName)
        .blur();
    });
    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.fillElasticDatasourceForm();

    //once we have test values for elastic search we can test and save the datasources.
    // cy.testSaveDatasource();
  });
});
