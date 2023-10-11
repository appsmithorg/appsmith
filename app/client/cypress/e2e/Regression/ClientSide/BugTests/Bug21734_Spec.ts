import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer;

describe("Bug 21734: On exiting from the Datasources page without saving changes, an error is thrown and the app becomes unresponsive.", function () {
  it("1. Navigating from intermediary datasource to new page", function () {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Mongo");
    // Have to fill form since modal won't show for empty ds
    dataSources.FillMongoDSForm();

    ee.AddNewPage();

    agHelper.AssertContains(
      "Don't save",
      "exist",
      dataSources._datasourceModalDoNotSave,
    );
    cy.get(dataSources._datasourceModalDoNotSave).click();

    ee.SelectEntityByName("Page1");
    agHelper.AssertURL("page1");

    ee.SelectEntityByName("Page2");
    agHelper.AssertURL("page2");
  });
  it("2. Navigating from intermediary datasource to an existing page", function () {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    // Have to fill form since modal won't show for empty ds
    dataSources.FillPostgresDSForm();

    ee.SelectEntityByName("Page1");
    agHelper.AssertContains(
      "Don't save",
      "exist",
      dataSources._datasourceModalDoNotSave,
    );
    cy.get(dataSources._datasourceModalDoNotSave).click();
    agHelper.AssertURL("page1");

    ee.SelectEntityByName("Page2");
    agHelper.AssertURL("page2");
  });
});
