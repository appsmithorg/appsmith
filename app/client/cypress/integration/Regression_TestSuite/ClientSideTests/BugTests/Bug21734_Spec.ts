import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer;

describe("Bug 21734: On exiting from the Datasources page without saving changes, an error is thrown and the app becomes unresponsive.", function () {
  it("1. Navigating from intermediary datasource to new page", function () {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Mongo");

    ee.AddNewPage();

    agHelper.AssertContains(
      "DON'T SAVE",
      "exist",
      dataSources._datasourceModalDoNotSave,
    );
    cy.get(dataSources._datasourceModalDoNotSave).click();

    ee.SelectEntityByName("Page1");
    agHelper.ValidateURL("page1");

    ee.SelectEntityByName("Page2");
    agHelper.ValidateURL("page2");
  });
  it("2. Navigating from intermediary datasource to an existing page", function () {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");

    ee.SelectEntityByName("Page1");
    agHelper.AssertContains(
      "DON'T SAVE",
      "exist",
      dataSources._datasourceModalDoNotSave,
    );
    cy.get(dataSources._datasourceModalDoNotSave).click();
    agHelper.ValidateURL("page1");

    ee.SelectEntityByName("Page2");
    agHelper.ValidateURL("page2");
  });
});
