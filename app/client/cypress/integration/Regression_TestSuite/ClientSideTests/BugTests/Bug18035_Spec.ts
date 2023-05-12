import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper;

describe(
  "excludeForAirgap",
  "Bug 18035: Updates save button text on datasource discard popup",
  function () {
    it("1. Create gsheet datasource, click on back button, discard popup should contain save and authorize", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Google Sheets");
      agHelper.GoBack();
      agHelper.AssertContains(
        "SAVE AND AUTHORIZE",
        "exist",
        dataSources._datasourceModalSave,
      );
      cy.get(dataSources._datasourceModalDoNotSave).click();
    });

    it("2. Create any other datasource, click on back button, discard popup should contain save", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      agHelper.GoBack();
      agHelper.AssertContains(
        "SAVE",
        "exist",
        dataSources._datasourceModalSave,
      );
      cy.get(dataSources._datasourceModalDoNotSave).click();
    });

    it("3. Bug 19426: Testing empty datasource without saving should not throw 404", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("S3");
      dataSources.TestDatasource(false);
      dataSources.SaveDSFromDialog(false);
    });
  },
);
