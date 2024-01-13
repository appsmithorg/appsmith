import {
  agHelper,
  dataManager,
  dataSources,
} from "../../../support/Objects/ObjectsCore";

let dsName: any;

// TODO: add another test case to test URI with username and password when the following issue is fixed:
//  https://github.com/appsmithorg/TestEventDriver/issues/40
describe(
  "Create, test, save then delete a mongo datasource using URI",
  { tags: ["@tag.Datasource", "@tag.Sanity"] },
  function () {
    it("1. Create, test, save then delete a mongo datasource using URI without username and password - #24897 ", function () {
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        // using CreatePlugIn function instead of CreateDatasource,
        // because I do not need to fill the datasource form and use the same default data
        dataSources.CreatePlugIn("MongoDB");
        dsName = "Mongo" + uid;
        agHelper.RenameWithInPane(dsName, false);

        dataSources.FillMongoDatasourceFormWithURI();
        dataSources.TestSaveDatasource(true);
        dataSources.DeleteDatasourceFromWithinDS(dsName);
      });
    });

    it("2. Create Mongo DS with Training space in Host, Database name & Verify connection", function () {
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        // using CreatePlugIn function instead of CreateDatasource,
        // because I do not need to fill the datasource form and use the same default data
        dataSources.CreatePlugIn("MongoDB");
        dsName = "Mongo" + uid;
        agHelper.RenameWithInPane(dsName, false);

        dataSources.FillMongoDSForm(dataManager.defaultEnviorment, true);
        dataSources.TestSaveDatasource();
        dataSources.DeleteDatasourceFromWithinDS(dsName);
      });
    });
  },
);
