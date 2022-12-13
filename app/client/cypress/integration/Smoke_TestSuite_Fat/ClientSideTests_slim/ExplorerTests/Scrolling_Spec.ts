import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper,
  locator = ObjectsRegistry.CommonLocators;
let mockDBNameUsers: any, mockDBNameMovies: any;

describe("Entity explorer context menu should hide on scrolling", function() {
  it("1. Bug #15474 - Entity explorer menu must close on scroll", function() {
    // Setup to make the explorer scrollable
    ee.ExpandCollapseEntity("Queries/JS");
    ee.ExpandCollapseEntity("Datasources");
    agHelper.ContainsNClick("Dependencies");
    dataSources.NavigateToDSCreateNew();
    agHelper.GetNClick(dataSources._mockDB("Users"));
    cy.wait("@getMockDb").then(($createdMock) => {
      mockDBNameUsers = $createdMock.response?.body.data.name;
      dataSources.CreateQuery(mockDBNameUsers);
    });
    dataSources.NavigateToDSCreateNew();
    agHelper.GetNClick(dataSources._mockDB("Movies"));
    cy.wait("@getMockDb").then(($createdMock) => {
      mockDBNameMovies = $createdMock.response?.body.data.name;
      dataSources.CreateQuery(mockDBNameMovies);
    });
    ee.ExpandCollapseEntity("Users");
    ee.ExpandCollapseEntity("Movies");
    ee.ExpandCollapseEntity("public.users");
    agHelper.GetNClick(locator._createNew);
    agHelper.AssertElementVisible(ee._createNewPopup);
    agHelper.ScrollTo(ee._entityExplorerWrapper, "bottom");
    agHelper.AssertElementAbsence(ee._createNewPopup);
  });

  after(() => {
    //clean up
    ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Query2", "Delete", "Are you sure?");
    dataSources.DeleteDatasouceFromActiveTab(mockDBNameMovies); //Since sometimes after Queries are deleted, ds is no more visible in EE tree
    dataSources.DeleteDatasouceFromActiveTab(mockDBNameUsers);
  });
});
