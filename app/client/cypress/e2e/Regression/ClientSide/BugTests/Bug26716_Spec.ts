import {
  dataSources,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
let dsName: any, userMock: string, movieMock: string;

describe(
  "excludeForAirgap",
  "Bug 26716: Datasource selected from entity explorer should be correctly highlighted",
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
            dataSources.navigateToDatasource(userMock);

            // Switch to Movies
            dataSources.navigateToDatasource(movieMock);

            // Switch to custom DS
            dataSources.navigateToDatasource(dsName);

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
