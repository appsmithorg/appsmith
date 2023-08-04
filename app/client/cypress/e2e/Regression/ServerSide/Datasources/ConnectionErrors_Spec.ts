import { agHelper, dataSources } from "../../../../support/Objects/ObjectsCore";

describe("Validate Empty DS error messages", () => {
  it("1. Validate Postgress connection errors", () => {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    dataSources.TestDatasource(false);
    agHelper.ValidateToastMessage("Missing endpoint.");
    agHelper.ValidateToastMessage("Missing username for authentication.", 1);
    agHelper.ClearTextField(dataSources._databaseName);
    dataSources.TestDatasource(false);
    agHelper.ValidateToastMessage("Missing database name.", 2);
  });
});
