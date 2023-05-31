import * as _ from "../../../../support/Objects/ObjectsCore";

let dataSet: any;

describe("JSObjects OnLoad Actions tests", function () {
  before(() => {
    cy.fixture("tableWidgetDsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
    cy.fixture("testdata").then(function (data: any) {
      dataSet = data;
    });
  });

  it("1. Api mapping on page load", function () {
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.apiPage.CreateAndFillApi(
      dataSet.baseUrl + dataSet.methods,
      "PageLoadApi",
    );
    _.agHelper.PressEscape();
    _.entityExplorer.ExpandCollapseEntity("Container3");
    _.entityExplorer.SelectEntityByName("Table1");
    _.propPane.UpdatePropertyFieldValue(
      "Table data",
      `{{PageLoadApi.data.data}}`,
    );
    _.agHelper.ValidateToastMessage(
      "[PageLoadApi] will be executed automatically on page load",
    );
    _.agHelper.RefreshPage();
    _.agHelper.ValidateNetworkStatus("@postExecute");
  });

  it("2. Shows when API failed to load on page load.", function () {
    _.apiPage.CreateAndFillApi(
      "https://abc.com/" + dataSet.methods,
      "PageLoadApi2",
    );
    _.apiPage.ToggleOnPageLoadRun(true);
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("Container3");
    _.entityExplorer.SelectEntityByName("Table1");
    _.propPane.UpdatePropertyFieldValue(
      "Table data",
      `{{PageLoadApi2.data.data}}`,
    );
    _.agHelper.RefreshPage();
    _.agHelper.ValidateToastMessage(`The action "PageLoadApi2" has failed.`);
  });

  after(() => {
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.ActionContextMenuByEntityName(
      "PageLoadApi",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "PageLoadApi2",
      "Delete",
      "Are you sure?",
    );
  });
});
