const datasource = require("../../../../locators/DatasourcesEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let elasticSearchName;
let dataSource = ObjectsRegistry.DataSources;

describe("Elastic search datasource tests", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create elastic search datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.ElasticSearch).trigger("click", { force: true });
    cy.generateUUID().then((uid) => {
      elasticSearchName = uid;
      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(elasticSearchName, { force: true })
        .should("have.value", elasticSearchName)
        .blur();
    });
    cy.fillElasticDatasourceForm();

    //once we have test values for elastic search we can test and save the datasources.
    // cy.testSaveDatasource();

    dataSource.SaveDSFromDialog(false);
  });
});
