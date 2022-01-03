const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");

describe("Switch datasource", function() {
  let postgresDatasourceName;
  let mongoDatasourceName;

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

  it("2. Create mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.generateUUID().then((uid) => {
      mongoDatasourceName = uid;

      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(mongoDatasourceName, { force: true })
        .should("have.value", mongoDatasourceName)
        .blur();
    });
    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.fillMongoDatasourceForm();
    cy.testSaveDatasource();
  });

  it("3. By switching datasources execute a query with both the datasources", function() {
    cy.NavigateToActiveDSQueryPane(postgresDatasourceName);
    cy.get(queryLocators.templateMenu).click({ force: true });
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from public.users limit 10");
    cy.wait(3000);
    cy.runQuery();

    cy.get(".t--switch-datasource").click();
    cy.contains(".t--datasource-option", mongoDatasourceName)
      .click()
      .wait(1000);

    cy.wait("@saveAction").should(
      "have.nested.property",
      "response.body.data.isValid",
      true,
    );
  });

  it("4. Delete the query and datasources", function() {
    cy.get(queryEditor.queryMoreAction).click();
    cy.get(queryEditor.deleteUsingContext).click();
    cy.wait("@deleteAction").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.deleteDatasource(postgresDatasourceName);
    cy.deleteDatasource(mongoDatasourceName);
  });
});
