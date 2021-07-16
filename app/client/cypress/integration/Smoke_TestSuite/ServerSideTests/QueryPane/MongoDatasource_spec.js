const queryLocators = require("../../../../locators/QueryEditor.json");
const plugins = require("../../../../fixtures/plugins.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");

let datasourceName;

describe("Create a query with a mongo datasource, run, save and then delete the query", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create a query with a mongo datasource, run, save and then delete the query", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillMongoDatasourceForm();

    cy.testSaveDatasource();

    cy.NavigateToQueryEditor();

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;

      cy.contains(".t--datasource-name", datasourceName)
        .find(queryLocators.createQuery)
        .click();
    });

    cy.get("@getPluginForm").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.xpath('//div[contains(text(),"Find Document(s)")]').click({
      force: true,
    });
    cy.xpath('//div[contains(text(),"Raw")]').click({ force: true });
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(`{"find": "listingsAndReviews","limit": 10}`, {
        parseSpecialCharSequences: false,
      });

    cy.EvaluateCurrentValue(`{"find": "listingsAndReviews","limit": 10}`);
    cy.runAndDeleteQuery();

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;

      cy.deleteDatasource(datasourceName);
    });
  });
});
