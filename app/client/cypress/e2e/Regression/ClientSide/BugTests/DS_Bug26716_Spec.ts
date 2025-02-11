import {
  dataSources,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let dsName: any, userMock: string, movieMock: string;

describe.skip(
  "Bug 26716: Datasource selected from entity explorer should be correctly highlighted",
  {
    tags: [
      "@tag.Datasource",
      "@tag.excludeForAirgap",
      "@tag.Git",
      "@tag.AccessControl",
    ],
  },
  function () {
    it("1. Create users and movies mock datasources and switch between them through entity explorer, check the active state", function () {
      dataSources.CreateMockDB("Users").then((mockDBName) => {
        userMock = mockDBName;
        cy.log("Mock DB Name: " + userMock);
        dataSources.CreateQueryAfterDSSaved(); //create dummy query for DS to be visible in entity explorer
        dataSources.CreateMockDB("Movies").then((mockDBName) => {
          movieMock = mockDBName;
          cy.log("Mock DB Name: " + mockDBName);
          dataSources.CreateQueryAfterDSSaved(); //create dummy query for DS to be visible in entity explorer
          dataSources.CreateDataSource("Postgres");
          dataSources.CreateQueryAfterDSSaved(); //create dummy query for DS to be visible in entity explorer
          cy.get("@dsName").then(($dsName) => {
            dsName = $dsName;
            // Select Users
            EditorNavigation.SelectEntityByName(
              userMock,
              EntityType.Datasource,
            );

            // Switch to Movies
            EditorNavigation.SelectEntityByName(
              movieMock,
              EntityType.Datasource,
            );

            // Switch to custom DS
            EditorNavigation.SelectEntityByName(dsName, EntityType.Datasource);

            // Delete all datasources
            entityExplorer.ActionContextMenuByEntityName({
              entityNameinLeftSidebar: "Query1",
              action: "Delete",
            });
            entityExplorer.ActionContextMenuByEntityName({
              entityNameinLeftSidebar: "Query2",
              action: "Delete",
            });
            entityExplorer.ActionContextMenuByEntityName({
              entityNameinLeftSidebar: "Query3",
              action: "Delete",
            });

            dataSources.DeleteDatasourceFromWithinDS(userMock);
            dataSources.DeleteDatasourceFromWithinDS(movieMock);
            dataSources.DeleteDatasourceFromWithinDS(dsName);
          });
        });
      });
    });
  },
);
