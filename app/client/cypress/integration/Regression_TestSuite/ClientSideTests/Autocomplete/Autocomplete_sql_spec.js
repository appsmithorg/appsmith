const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const locator = ObjectsRegistry.CommonLocators;
let datasourceName;

describe("SQL Autocompletion", function () {
  it("Shows autocompletion hints", function () {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.fillPostgresDatasourceForm();

    cy.generateUUID().then((uid) => {
      datasourceName = `Postgres CRUD ds ${uid}`;
      cy.renameDatasource(datasourceName);
    });
    cy.testSaveDatasource();
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.get(queryLocators.templateMenu).click({ force: true });
    cy.get(".CodeMirror textarea").focus().type("S");
    cy.get(locator._hints).should("exist");
    cy.deleteQueryUsingContext();
  });
});
