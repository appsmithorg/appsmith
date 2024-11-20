import {
  agHelper,
  apiPage,
  assertHelper,
  debuggerHelper,
  entityExplorer,
  entityItems,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "JSObjects OnLoad Actions tests",
  { tags: ["@tag.PropertyPane", "@tag.JS", "@tag.Binding"] },
  function () {
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
          "https://www.google.com/" + dataSet.methods,
          "PageLoadApi2",
        );
      });
      apiPage.ToggleOnPageLoadRun(true);
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
        "Container3",
      ]);
      propPane.UpdatePropertyFieldValue(
        "Table data",
        `{{PageLoadApi2.data.data}}`,
      );
      agHelper.RefreshPage();
      debuggerHelper.AssertDebugError(
        'The action "PageLoadApi2" has failed.',
        "",
        true,
        false,
      );
    });

    after(() => {
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
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
  },
);
