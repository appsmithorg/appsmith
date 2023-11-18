import { Tag } from "../../../tags";
import * as _ from "../../../support/Objects/ObjectsCore";

describe(
  "Validate generate CRUD operation by creating a datasource from generate CRUD form",
  { tags: [Tag.GenerateCRUD] },
  () => {
    it(
      "1. Generated CRUD app should work when there are no entities in the page & when there are entities in the current page",
      { tags: [Tag.excludeForAirgap] },
      () => {
        _.dataSources.GeneratePageWithMockDB();
        //when there are entities in the current page
        _.entityExplorer.AddNewPage();
        _.apiPage.CreateApi();
        _.dataSources.GeneratePageWithMockDB();
      },
    );
    it(
      "1. Generated CRUD app should work when there are no entities in the page & when there are entities in the current page - airgap",
      { tags: [Tag.airgap] },
      () => {
        _.dataSources.CreateDataSource("Postgres");
        cy.get("@dsName").then(($dsName) => {
          _.dataSources.GeneratePageWithDB($dsName, "public.city");

          //when there are entities in the current page
          _.entityExplorer.AddNewPage();
          _.apiPage.CreateApi();
          _.dataSources.GeneratePageWithDB($dsName, "public.city");
        });
      },
    );
  },
);
