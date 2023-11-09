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
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      entityExplorer.NavigateToSwitcher("Explorer");
      entityExplorer.ExpandCollapseEntity("Modal1");
      entityExplorer.ExpandCollapseEntity("Modal2");
      entityExplorer.ExpandCollapseEntity("Modal3");
      entityExplorer.ExpandCollapseEntity("Modal4");
      entityExplorer.ExpandCollapseEntity("Modal5");
      entityExplorer.ExpandCollapseEntity("Modal6");

      // Setup to make the explorer scrollable
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      dataSources.CreateMockDB("Users").then(($createdMockUsers) => {
        cy.log("Users DB created is " + $createdMockUsers);
        mockDBNameUsers = $createdMockUsers;
        dataSources.CreateQueryAfterDSSaved();
        entityExplorer.CreateNewDsQuery("Users");
        entityExplorer.CreateNewDsQuery("Users");
        entityExplorer.CreateNewDsQuery("Users");

        dataSources.CreateMockDB("Movies").then(($createdMockMovies) => {
          cy.log("Movies DB created is " + $createdMockMovies);
          mockDBNameMovies = $createdMockMovies;
          dataSources.CreateQueryAfterDSSaved();
          entityExplorer.CreateNewDsQuery("Movies");
          entityExplorer.CreateNewDsQuery("Movies");
          entityExplorer.CreateNewDsQuery("Movies");

          agHelper.GetNClick(locators._createNew);
          agHelper.AssertElementVisibility(entityExplorer._adsPopup);
          agHelper.ScrollTo(entityExplorer._entityExplorerWrapper, "top");
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
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL);
      entityExplorer.NavigateToSwitcher("Explorer");
      entityExplorer.ExpandCollapseEntity("Modal1");
      entityExplorer.ExpandCollapseEntity("Modal2");
      entityExplorer.ExpandCollapseEntity("Modal3");
      entityExplorer.ExpandCollapseEntity("Modal4");
      entityExplorer.ExpandCollapseEntity("Modal5");
      entityExplorer.ExpandCollapseEntity("Modal6");

      // Setup to make the explorer scrollable
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($createdMockUsers: any) => {
        mockDBNameUsers = $createdMockUsers;
        dataSources.CreateQueryAfterDSSaved();

        dataSources.CreateDataSource("Mongo");
        cy.get("@dsName").then(($createdMockMovies: any) => {
          mockDBNameMovies = $createdMockMovies;
          dataSources.CreateQueryAfterDSSaved();

          agHelper.GetNClick(locators._createNew);
          agHelper.AssertElementVisibility(entityExplorer._adsPopup);
          agHelper.ScrollTo(entityExplorer._entityExplorerWrapper, "top");
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
    dataSources.DeleteDatasourceFromWithinDS(mockDBNameMovies); //Since sometimes after Queries are deleted, ds is no more visible in EE tree
    dataSources.DeleteDatasourceFromWithinDS(mockDBNameUsers);
  });
});
