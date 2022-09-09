const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../locators/QueryEditor.json");

describe("Switch datasource", function() {
  let postgresDatasourceName;
  let postgresDatasourceNameSecond;
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

  it("2. Create another postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.generateUUID().then((uid) => {
      postgresDatasourceNameSecond = uid;

      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(postgresDatasourceNameSecond, { force: true })
        .should("have.value", postgresDatasourceNameSecond)
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

  it("3. Create mongo datasource", function() {
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

  it("4. By switching datasources execute a query with both the datasources", function() {
    cy.NavigateToActiveDSQueryPane(postgresDatasourceName);
    cy.get(queryLocators.templateMenu).click({ force: true });
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from public.users limit 10");
    cy.wait(3000);
    cy.runQuery();
    cy.wait("@saveAction").should(
      "have.nested.property",
      "response.body.data.isValid",
      true,
    );

    cy.get(".t--switch-datasource").click();
    cy.contains(".t--datasource-option", postgresDatasourceNameSecond)
      .click()
      .wait(1000);
    cy.runQuery();
    cy.wait("@saveAction").should(
      "have.nested.property",
      "response.body.data.isValid",
      true,
    );
  });

  it("5. Confirm mongo datasource is not present in the switch datasources dropdown", function() {
    cy.get(".t--switch-datasource").click();
    cy.get(".t--datasource-option").should("not.have", mongoDatasourceName);
  });

  it("6. Delete the query and datasources", function() {
    cy.deleteQueryUsingContext();

    cy.deleteDatasource(postgresDatasourceName);
    cy.deleteDatasource(postgresDatasourceNameSecond);
    cy.deleteDatasource(mongoDatasourceName);
  });
});
