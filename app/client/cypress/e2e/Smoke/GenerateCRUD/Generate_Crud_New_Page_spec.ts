import * as _ from "../../../support/Objects/ObjectsCore";
import PageList from "../../../support/Pages/PageList";

describe.skip(
  "Validate generate CRUD operation by creating a datasource from generate CRUD form",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  () => {
    it(
      "1. Generated CRUD app should work when there are no entities in the page & when there are entities in the current page",
      { tags: ["@tag.excludeForAirgap"] },
      () => {
        _.dataSources.GeneratePageWithMockDB();
        //when there are entities in the current page
        PageList.AddNewPage();
        _.apiPage.CreateApi();
        _.dataSources.GeneratePageWithMockDB();
      },
    );
    it(
      "airgap",
      "1. Generated CRUD app should work when there are no entities in the page & when there are entities in the current page - airgap",
      () => {
        _.dataSources.CreateDataSource("Postgres");
        cy.get("@dsName").then(($dsName) => {
          _.dataSources.GeneratePageWithDB($dsName, "public.city");

          //when there are entities in the current page
          PageList.AddNewPage();
          _.apiPage.CreateApi();
          _.dataSources.GeneratePageWithDB($dsName, "public.city");
        });
      },
    );
  },
);
