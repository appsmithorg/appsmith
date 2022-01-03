const datasource = require("../../../../locators/DatasourcesEditor.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const queryEditor = require("../../../../locators/QueryEditor.json");

describe("Check datasource doc links", function() {
  let postgresDatasourceName;

  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.generateUUID().then((uid) => {
      postgresDatasourceName = uid;

      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(postgresDatasourceName, { force: true })
        .should("have.value", postgresDatasourceName)
        .blur();
    });
    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.fillPostgresDatasourceForm();
    cy.testSaveDatasource();
  });

  it("2. Check that documentation opens global modal", function() {
    cy.NavigateToActiveDSQueryPane(postgresDatasourceName);
    cy.get(".t--datasource-documentation-link").click();
    cy.get(commonlocators.globalSearchModal);
    cy.get("body").click(0, 0);
  });

  it("3. Delete the query and datasources", function() {
    cy.get(queryEditor.queryMoreAction).click();
    cy.get(queryEditor.deleteUsingContext).click();
    cy.wait("@deleteAction").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.deleteDatasource(postgresDatasourceName);
  });
});
