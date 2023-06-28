import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";
import datasourceFormData from "../../../fixtures/datasources.json";

let dsName: any;

describe("Create, test, save then delete a mongo datasource using URI", function () {
  it("1. Create, test, save then delete a mongo datasource using URI", function () {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      // using CreatePlugIn function instead of CreateDatasource,
      // because I do not need to fill the datasource form and use the same default data
      dataSources.CreatePlugIn("MongoDB");
      dsName = "Mongo" + uid;
      agHelper.RenameWithInPane(dsName, false);

      dataSources.FillMongoDatasourceFormWithURI(
        datasourceFormData["mongo-uri"],
      );
      // TODO: update this to `true` when the following issue is fixed:
      //  https://github.com/appsmithorg/TestEventDriver/issues/40
      dataSources.TestSaveDatasource(false);
      dataSources.DeleteDatasouceFromActiveTab(dsName);
    });
  });
});
