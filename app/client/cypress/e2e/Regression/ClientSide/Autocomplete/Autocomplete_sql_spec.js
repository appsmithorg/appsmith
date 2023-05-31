const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

let datasourceName;

describe("SQL Autocompletion", function () {
  it("Shows autocompletion hints", function () {
    _.dataSources.CreateDataSource("Postgres");
    cy.generateUUID().then((uid) => {
      datasourceName = `Postgres CRUD ds ${uid}`;
      cy.renameDatasource(datasourceName);
      cy.NavigateToActiveDSQueryPane(datasourceName);
    });
    cy.get(queryLocators.templateMenu).click({ force: true });
    cy.get(".CodeMirror textarea").focus().type("select");
    // Hints should exist
    cy.get(locator._hints).should("exist");
    // select should be parsed as a keyword and should not be capitalised
    cy.get(locator._sqlKeyword).contains("select");
    cy.deleteQueryUsingContext();
  });
});
