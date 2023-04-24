import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dataSources = ObjectsRegistry.DataSources;

describe("Testing empty datasource without saving should not throw 404", function() {
  it("Bug 19426: Create empty S3 datasource, test it", function() {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("S3");
    dataSources.TestDatasource(false);
    dataSources.SaveDSFromDialog(false);
  });
});
