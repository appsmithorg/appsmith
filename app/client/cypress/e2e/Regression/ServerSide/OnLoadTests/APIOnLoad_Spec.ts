import {
  agHelper,
  apiPage,
  assertHelper,
  entityExplorer,
  entityItems,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("JSObjects OnLoad Actions tests", function () {
  before(() => {
    agHelper.AddDsl("tableWidgetDsl");
  });

  it("1. Api mapping on page load", function () {
    cy.fixture("testdata").then(function (dataSet: any) {
      apiPage.CreateAndFillApi(
        dataSet.baseUrl + dataSet.methods,
        "PageLoadApi",
      );
    });
    agHelper.PressEscape();
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
      "Container3",
    ]);
    propPane.UpdatePropertyFieldValue(
      "Table data",
      `{{PageLoadApi.data.data}}`,
    );
    agHelper.ValidateToastMessage(
      "[PageLoadApi] will be executed automatically on page load",
    );
    agHelper.RefreshPage();
    assertHelper.AssertNetworkStatus("@postExecute");
  });

  it("2. Shows when API failed to load on page load.", function () {
    cy.fixture("testdata").then(function (dataSet: any) {
      apiPage.CreateAndFillApi(
        "https://abc.com/" + dataSet.methods,
        "PageLoadApi2",
      );
    });
    apiPage.ToggleOnPageLoadRun(true);
    entityExplorer.ExpandCollapseEntity("Widgets");
    entityExplorer.ExpandCollapseEntity("Container3");
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
      "Container3",
    ]);
    propPane.UpdatePropertyFieldValue(
      "Table data",
      `{{PageLoadApi2.data.data}}`,
    );
    agHelper.RefreshPage();
    agHelper.ValidateToastMessage(`The action "PageLoadApi2" has failed.`);
  });

  after(() => {
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "PageLoadApi",
      action: "Delete",
      entityType: entityItems.Api,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "PageLoadApi2",
      action: "Delete",
      entityType: entityItems.Api,
    });
  });
});
