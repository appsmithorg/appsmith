const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");

describe("Google Sheet datasource test cases", function() {
  let datasourceName;

  it("Create a Google Sheet datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasourceEditor.googleSheets).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillGoogleSheetsDatasourceForm();
    cy.testSaveDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("Create a new query from the datasource editor", function() {
    cy.NavigateToQueriesInExplorer();
    cy.get(
      `${datasourceEditor.datasourceCard} ${datasourceEditor.createQuerty}`,
    )
      .last()
      .click();
    cy.wait("@createNewApi").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.get(".t--queries-for-SAAS").each((el) => {
      el.invoke("text").should("match", "/on this page/");
    });

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
