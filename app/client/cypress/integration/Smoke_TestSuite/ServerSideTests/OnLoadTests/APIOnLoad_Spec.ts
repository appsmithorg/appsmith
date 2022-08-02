import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dataSet: any;
const ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  propPane = ObjectsRegistry.PropertyPane,
  apiPage = ObjectsRegistry.ApiPage;

describe("JSObjects OnLoad Actions tests", function() {
  before(() => {
    cy.fixture("tableWidgetDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    cy.fixture("testdata").then(function(data: any) {
      dataSet = data;
    });
  });

  it("1. Api mapping on page load", function() {
    ee.NavigateToSwitcher("explorer");
    apiPage.CreateAndFillApi(dataSet.baseUrl + dataSet.methods, "PageLoadApi");
    ee.ExpandCollapseEntity("Container3");
    ee.SelectEntityByName("Table1");
    propPane.UpdatePropertyFieldValue(
      "Table Data",
      `{{PageLoadApi.data.data}}`,
    );
    agHelper.ValidateToastMessage(
      "[PageLoadApi] will be executed automatically on page load",
    );
    agHelper.RefreshPage();
    agHelper.ValidateNetworkStatus("@postExecute");
  });

  it("2. Shows when API failed to load on page load.", function() {
    apiPage.CreateAndFillApi(
      "https://abc.com/" + dataSet.methods,
      "PageLoadApi2",
    );
    apiPage.ToggleOnPageLoadRun(true);
    ee.ExpandCollapseEntity("Container3");
    ee.SelectEntityByName("Table1");
    propPane.UpdatePropertyFieldValue(
      "Table Data",
      `{{PageLoadApi2.data.data}}`,
    );
    agHelper.RefreshPage();
    agHelper.ValidateToastMessage(`The action "PageLoadApi2" has failed.`);
  });

  after(() => {
    ee.ActionContextMenuByEntityName("PageLoadApi", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("PageLoadApi2", "Delete", "Are you sure?");
  });
});
