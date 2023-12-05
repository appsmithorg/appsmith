import {
  agHelper,
  dataSources,
  draggableWidgets,
  entityExplorer,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
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
      PageLeftPane.switchSegment(PagePaneSegment.Explorer);
      PageLeftPane.expandCollapseItem("Modal1");
      PageLeftPane.expandCollapseItem("Modal2");
      PageLeftPane.expandCollapseItem("Modal3");
      PageLeftPane.expandCollapseItem("Modal4");
      PageLeftPane.expandCollapseItem("Modal5");
      PageLeftPane.expandCollapseItem("Modal6");

      // Setup to make the explorer scrollable
      PageLeftPane.expandCollapseItem("Queries/JS");
      dataSources.CreateMockDB("Users").then(($createdMockUsers) => {
        cy.log("Users DB created is " + $createdMockUsers);
        mockDBNameUsers = $createdMockUsers;
        dataSources.CreateQueryAfterDSSaved();
        entityExplorer.CreateNewDsQuery(mockDBNameUsers);
        entityExplorer.CreateNewDsQuery(mockDBNameUsers);
        entityExplorer.CreateNewDsQuery(mockDBNameUsers);

        dataSources.CreateMockDB("Movies").then(($createdMockMovies) => {
          cy.log("Movies DB created is " + $createdMockMovies);
          mockDBNameMovies = $createdMockMovies;
          dataSources.CreateQueryAfterDSSaved();
          entityExplorer.CreateNewDsQuery(mockDBNameMovies);
          entityExplorer.CreateNewDsQuery(mockDBNameMovies);
          entityExplorer.CreateNewDsQuery(mockDBNameMovies);

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
      PageLeftPane.switchSegment(PagePaneSegment.Explorer);
      PageLeftPane.expandCollapseItem("Modal1");
      PageLeftPane.expandCollapseItem("Modal2");
      PageLeftPane.expandCollapseItem("Modal3");
      PageLeftPane.expandCollapseItem("Modal4");
      PageLeftPane.expandCollapseItem("Modal5");
      PageLeftPane.expandCollapseItem("Modal6");

      // Setup to make the explorer scrollable
      PageLeftPane.expandCollapseItem("Queries/JS");
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($createdMockUsers: any) => {
        mockDBNameUsers = $createdMockUsers;
        dataSources.CreateQueryAfterDSSaved();
        entityExplorer.CreateNewDsQuery(mockDBNameUsers);
        entityExplorer.CreateNewDsQuery(mockDBNameUsers);
        entityExplorer.CreateNewDsQuery(mockDBNameUsers);

        dataSources.CreateDataSource("Mongo");
        cy.get("@dsName").then(($createdMockMovies: any) => {
          mockDBNameMovies = $createdMockMovies;
          dataSources.CreateQueryAfterDSSaved();
          entityExplorer.CreateNewDsQuery(mockDBNameMovies);
          entityExplorer.CreateNewDsQuery(mockDBNameMovies);
          entityExplorer.CreateNewDsQuery(mockDBNameMovies);

          agHelper.GetNClick(locators._createNew);
          agHelper.AssertElementVisibility(entityExplorer._adsPopup);
          agHelper.ScrollTo(entityExplorer._entityExplorerWrapper, "top");
          agHelper.AssertElementAbsence(entityExplorer._adsPopup);
        });
      });
    },
  );
});
