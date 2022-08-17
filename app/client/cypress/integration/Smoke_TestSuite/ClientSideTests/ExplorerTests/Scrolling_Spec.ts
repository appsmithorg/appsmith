import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper,
  locator = ObjectsRegistry.CommonLocators;

describe("Entity explorer context menu should hide on scrolling", function() {
  it("1. Bug #15474 - Entity explorer menu must close on scroll", function() {
    // Setup to make the explorer scrollable
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ExpandCollapseEntity("DATASOURCES");
    agHelper.ContainsNClick("DEPENDENCIES");
    dataSources.NavigateToDSCreateNew();
    agHelper.GetNClick(dataSources._mockDB("Users"));
    dataSources.CreateQuery("Users");
    dataSources.NavigateToDSCreateNew();
    agHelper.GetNClick(dataSources._mockDB("Movies"));
    dataSources.CreateQuery("Movies");
    ee.ExpandCollapseEntity("public.users");
    ee.ExpandCollapseEntity("movies");
    agHelper.GetNClick(locator._createNew);
    agHelper.AssertElementVisible(ee._createNewPopup);
    agHelper.ScrollTo(ee._entityExplorerWrapper, "bottom");
    agHelper.AssertElementAbsence(ee._createNewPopup);
  });

  after(() => {
    //clean up
    ee.ActionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Query2", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Movies", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Users", "Delete", "Are you sure?");
  });
});
