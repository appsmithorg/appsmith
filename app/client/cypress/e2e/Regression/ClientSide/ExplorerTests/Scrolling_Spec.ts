import {
  agHelper,
  dataSources,
  entityExplorer,
  entityItems,
  locators,
} from "../../../../support/Objects/ObjectsCore";
let mockDBNameUsers: string, mockDBNameMovies: string;

describe("Entity explorer context menu should hide on scrolling", function () {
  it(
    "excludeForAirgap",
    "1. Bug #15474 - Entity explorer menu must close on scroll",
    function () {
      // Setup to make the explorer scrollable
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      entityExplorer.ExpandCollapseEntity("Datasources");
      agHelper.ContainsNClick("Libraries");
      dataSources.CreateMockDB("Users").then(($createdMockUsers) => {
        cy.log("Users DB created is " + $createdMockUsers);
        mockDBNameUsers = $createdMockUsers;
        dataSources.CreateQueryAfterDSSaved();

        dataSources.CreateMockDB("Movies").then(($createdMockMovies) => {
          cy.log("Movies DB created is " + $createdMockMovies);
          mockDBNameMovies = $createdMockMovies;
          dataSources.CreateQueryAfterDSSaved();

          agHelper.Sleep();
          entityExplorer.ExpandCollapseEntity(mockDBNameUsers);
          agHelper.Sleep();
          entityExplorer.ExpandCollapseEntity(mockDBNameMovies);

          entityExplorer.ExpandCollapseEntity("public.users");
          entityExplorer.ExpandCollapseEntity("movies");
          agHelper.GetNClick(locators._createNew);
          agHelper.AssertElementVisible(entityExplorer._adsPopup);
          agHelper.ScrollTo(entityExplorer._entityExplorerWrapper, "bottom");
          agHelper.AssertElementAbsence(entityExplorer._adsPopup);
        });
      });
    },
  );

  it(
    "airgap",
    "1. Bug #15474 - Entity explorer menu must close on scroll - airgap",
    function () {
      // Setup to make the explorer scrollable
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      entityExplorer.ExpandCollapseEntity("Datasources");
      agHelper.ContainsNClick("Libraries");
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($createdMockUsers: any) => {
        mockDBNameUsers = $createdMockUsers;
        dataSources.NavigateToActiveTab();
        dataSources.CreateQueryAfterDSSaved();

        dataSources.CreateDataSource("Mongo");
        cy.get("@dsName").then(($createdMockMovies: any) => {
          dataSources.NavigateToActiveTab();
          mockDBNameMovies = $createdMockMovies;
          dataSources.CreateQueryAfterDSSaved();

          agHelper.Sleep();
          entityExplorer.ExpandCollapseEntity(mockDBNameUsers);
          agHelper.Sleep();
          entityExplorer.ExpandCollapseEntity(mockDBNameMovies);

          entityExplorer.ExpandCollapseEntity("public.users");
          entityExplorer.ExpandCollapseEntity("listingAndReviews");
          agHelper.GetNClick(locators._createNew);
          agHelper.AssertElementVisible(entityExplorer._adsPopup);
          agHelper.ScrollTo(entityExplorer._entityExplorerWrapper, "bottom");
          agHelper.AssertElementAbsence(entityExplorer._adsPopup);
        });
      });
    },
  );

  after(() => {
    //clean up
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Query1",
      action: "Delete",
      entityType: entityItems.Query,
    });

    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Query2",
      action: "Delete",
      entityType: entityItems.Query,
    });
    dataSources.DeleteDatasouceFromActiveTab(mockDBNameMovies); //Since sometimes after Queries are deleted, ds is no more visible in EE tree
    dataSources.DeleteDatasouceFromActiveTab(mockDBNameUsers);
  });
});
