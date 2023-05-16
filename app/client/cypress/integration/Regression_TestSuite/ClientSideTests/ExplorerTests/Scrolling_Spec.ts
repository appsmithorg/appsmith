import * as _ from "../../../../support/Objects/ObjectsCore";
let mockDBNameUsers: string, mockDBNameMovies: string;

describe("Entity explorer context menu should hide on scrolling", function () {
  it("1. Bug #15474 - Entity explorer menu must close on scroll", function () {
    // Setup to make the explorer scrollable
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.agHelper.ContainsNClick("Libraries");
    _.dataSources.CreateMockDB("Users").then(($createdMockUsers) => {
      mockDBNameUsers = $createdMockUsers;
      _.dataSources.CreateQueryFromActiveTab($createdMockUsers, false);

      _.dataSources.CreateMockDB("Movies").then(($createdMockMovies) => {
        mockDBNameMovies = $createdMockMovies;
        _.dataSources.CreateQueryFromActiveTab($createdMockMovies, false);

        _.agHelper.Sleep();
        _.entityExplorer.ExpandCollapseEntity(mockDBNameUsers);
        _.agHelper.Sleep();
        _.entityExplorer.ExpandCollapseEntity(mockDBNameMovies);

        _.entityExplorer.ExpandCollapseEntity("public.users");
        _.entityExplorer.ExpandCollapseEntity("movies");
        _.agHelper.GetNClick(_.locators._createNew);
        _.agHelper.AssertElementVisible(_.entityExplorer._createNewPopup);
        _.agHelper.ScrollTo(_.entityExplorer._entityExplorerWrapper, "bottom");
        _.agHelper.AssertElementAbsence(_.entityExplorer._createNewPopup);
      });
    });
  });

  after(() => {
    //clean up
    _.entityExplorer.ActionContextMenuByEntityName(
      "Query1",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "Query2",
      "Delete",
      "Are you sure?",
    );
    _.dataSources.DeleteDatasouceFromActiveTab(mockDBNameMovies); //Since sometimes after Queries are deleted, ds is no more visible in EE tr_.ee
    _.dataSources.DeleteDatasouceFromActiveTab(mockDBNameUsers);
  });
});
