import {
  agHelper,
  dataSources,
  draggableWidgets,
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
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      entityExplorer.NavigateToSwitcher("Explorer");
      entityExplorer.ExpandCollapseEntity("Modal1");
      entityExplorer.ExpandCollapseEntity("Modal2");
      entityExplorer.ExpandCollapseEntity("Modal3");

      // Setup to make the explorer scrollable
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      entityExplorer.ExpandCollapseEntity("Datasources");
      agHelper.ContainsNClick("Libraries");
      dataSources.CreateMockDB("Users").then(($createdMockUsers) => {
        cy.log("Users DB created is " + $createdMockUsers);
        mockDBNameUsers = $createdMockUsers;
        dataSources.CreateQueryAfterDSSaved();
        dataSources.AssertTableInVirtuosoList(mockDBNameUsers, "public.users");

        dataSources.CreateMockDB("Movies").then(($createdMockMovies) => {
          cy.log("Movies DB created is " + $createdMockMovies);
          mockDBNameMovies = $createdMockMovies;
          dataSources.CreateQueryAfterDSSaved();

          dataSources.AssertTableInVirtuosoList(mockDBNameMovies, "movies");

          agHelper.GetNClick(locators._createNew);
          agHelper.AssertElementVisibility(entityExplorer._adsPopup);
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
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      entityExplorer.NavigateToSwitcher("Explorer");
      entityExplorer.ExpandCollapseEntity("Modal1");
      entityExplorer.ExpandCollapseEntity("Modal2");
      entityExplorer.ExpandCollapseEntity("Modal3");

      // Setup to make the explorer scrollable
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      entityExplorer.ExpandCollapseEntity("Datasources");
      agHelper.ContainsNClick("Libraries");
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($createdMockUsers: any) => {
        mockDBNameUsers = $createdMockUsers;
        dataSources.CreateQueryAfterDSSaved();

        dataSources.AssertTableInVirtuosoList(mockDBNameUsers, "public.users");

        dataSources.CreateDataSource("Mongo");
        cy.get("@dsName").then(($createdMockMovies: any) => {
          mockDBNameMovies = $createdMockMovies;
          dataSources.CreateQueryAfterDSSaved();

          dataSources.AssertTableInVirtuosoList(
            mockDBNameMovies,
            "listingAndReviews",
          );

          agHelper.GetNClick(locators._createNew);
          agHelper.AssertElementVisibility(entityExplorer._adsPopup);
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
