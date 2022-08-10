import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Firestore stub", function() {
  before(() => {
    dataSources.StartInterceptRoutesForFirestore();
  });
  it("1. Create, test, save then delete a Firestore datasource", function() {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Firestore");
    agHelper.RenameWithInPane("Firestore-Stub", false);
    dataSources.FillFirestoreDSForm();
    dataSources.TestSaveDatasource(false);
    dataSources.DeleteDatasouceFromActiveTab("Firestore-Stub", 200);
  });
});
