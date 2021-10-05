const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");

describe("Switch datasource", function() {
  let postgresDatasourceName;
  let mongoDatasourceName;

  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create postgres datasource", function() {
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

  it("Create mongo datasource", function() {
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

  it("By switching datasources execute a query with both the datasources", function() {
    cy.NavigateToQueryEditor();

    cy.contains(".t--datasource-name", postgresDatasourceName)
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from users limit 10");

    cy.get(queryLocators.runQuery).click();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(".t--switch-datasource").click();
    cy.contains(".t--datasource-option", mongoDatasourceName).click();

    cy.get(".CodeMirror")
      .first()
      .then((editor) => {
        editor[0].CodeMirror.setValue('{"find": "planets"}');
      });

    cy.get(queryLocators.runQuery).click();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Delete the query and datasources", function() {
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
