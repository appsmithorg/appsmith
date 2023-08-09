import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer;

describe("Fix UQI query switching", function () {
  it("The command of the query must be preserved and should not default to initial value after changed.", function () {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreateDataSource("Mongo", false, false);
    dataSources.CreateQueryAfterDSSaved("", "MongoQuery");
    dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find document(s)",
      "Insert document(s)",
    );
    dataSources.NavigateToDSCreateNew();
    dataSources.CreateDataSource("S3", false, false);
    dataSources.CreateQueryAfterDSSaved("", "S3Query");
    dataSources.ValidateNSelectDropdown(
      "Commands",
      "List files in bucket",
      "Create a new file",
    );
    ee.SelectEntityByName("MongoQuery", "Queries/JS");
    dataSources.ValidateNSelectDropdown("Commands", "Insert document(s)");

    ee.SelectEntityByName("S3Query", "Queries/JS");
    dataSources.ValidateNSelectDropdown("Commands", "Create a new file");
  });
});
