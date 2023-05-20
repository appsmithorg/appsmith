import { ObjectsRegistry } from "../../../support/Objects/Registry";
const { ApiPage, DataSources, EntityExplorer } = ObjectsRegistry;
import * as _ from "../../../support/Objects/ObjectsCore";

describe("Validate generate CRUD operation by creating a datasource from generate CRUD form", () => {
  it(
    "excludeForAirgap",
    "1. Generated CRUD app should work when there are no entities in the page & when there are entities in the current page",
    () => {
      DataSources.GeneratePageWithMockDB();

      //when there are entities in the current page
      EntityExplorer.AddNewPage();
      ApiPage.CreateApi();
      DataSources.GeneratePageWithMockDB();
    },
  );
  it(
    "airgap",
    "1. Generated CRUD app should work when there are no entities in the page & when there are entities in the current page - airgap",
    () => {
      _.dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        DataSources.GeneratePageWithDB($dsName, "public.city");

        //when there are entities in the current page
        EntityExplorer.AddNewPage();
        ApiPage.CreateApi();
        DataSources.GeneratePageWithDB($dsName, "public.city");
      });
    },
  );
});
