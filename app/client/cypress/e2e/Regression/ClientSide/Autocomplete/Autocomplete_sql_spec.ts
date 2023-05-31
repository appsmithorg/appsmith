import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any;

const agHelper = ObjectsRegistry.AggregateHelper,
  locator = ObjectsRegistry.CommonLocators,
  dataSources = ObjectsRegistry.DataSources;

describe("SQL Autocompletion", () => {
  it("Create DS for SQL autocompletion testing", () => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("Shows autocompletion hints in SQL", () => {
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.FocusElement(locator._codeMirrorTextArea);
    dataSources.EnterQuery("select");
    // Hints should exist
    cy.get(locator._hints).should("exist");
    // "select" should be parsed as a keyword and should not be capitalised
    cy.get(locator._sqlKeyword).contains("select");
  });
  it("Deletes datasource", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200);
  });
});
