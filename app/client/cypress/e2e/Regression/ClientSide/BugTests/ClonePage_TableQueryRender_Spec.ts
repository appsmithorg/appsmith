import {
  agHelper,
  assertHelper,
  dataSources,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

// Regression for the post-clone "Table widget stuck loading until browser refresh"
// bug.
//
// Symptom (before fix):
//   1. User has a Page with a Table widget bound to {{Query1.data}}.
//   2. User clones that page.
//   3. On the cloned page the Table renders an empty / perpetually-loading state.
//   4. Refreshing the browser fixes it.
//
// Mechanism (before fix):
//   clonePageSaga used to dispatch executePageLoadActions(ActionExecutionContext.CLONE_PAGE)
//   *before* navigating to the cloned page. At that moment state.ui.editor.pageActions
//   (the slice executePageLoadActionsSaga reads) still held the SOURCE page's onPageLoad
//   actions, because INIT_CANVAS_LAYOUT had not fired yet for the cloned page. The saga
//   therefore executed the SOURCE Query1, racing against the cloned Query1 that
//   handleFetchedPage triggers post-navigation. The source saga was takeLatest-cancelled
//   mid-flight after dispatching EXECUTE_PLUGIN_ACTION_REQUEST and an empty
//   updateActionData, leaving the cloned page's data tree slot for "Query1" in an
//   inconsistent loading state. Manual refresh rebuilt the eval tree from scratch and
//   masked it.
//
// This test asserts that, immediately after a clone, the cloned page's Table renders the
// query's rows without any manual refresh.
describe(
  "Page clone | Table widget bound to a query renders data without manual refresh",
  { tags: ["@tag.IDE", "@tag.Binding"] },
  () => {
    it("Cloned page should render Table data on the first navigation, not require a browser refresh", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 400, 200);

      // CreateMockDB("Users") + CreateQueryAfterDSSaved auto-populates Query1 with
      // `SELECT * FROM public."users" LIMIT 10;` so we get a deterministic 10-row
      // payload to assert against on both the source and the cloned page.
      dataSources.CreateMockDB("Users").then(() => {
        assertHelper.AssertNetworkStatus("@getDatasourceStructure", 200);
        dataSources.CreateQueryAfterDSSaved();
        dataSources.runQueryAndVerifyResponseViews({
          count: 1,
          operator: "gte",
        });
      });

      // Bind the Table widget to {{Query1.data}}. This auto-marks Query1 as
      // ON_PAGE_LOAD, which is the precondition that activates the racy saga path
      // exercised by the bug.
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Table data", "{{Query1.data}}");

      // Source-page sanity check. If this fails the test is invalid (it was never
      // really exercising the bug).
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "10 Records",
      );

      // Clone the page. PageList.ClonePage already waits for the clonePage API to
      // return 201 and then auto-navigates to the cloned page.
      PageList.ClonePage("Page1");

      // The actual regression assertion: the cloned page must render 10 rows in the
      // editor canvas WITHOUT a manual browser refresh. Before the fix this would
      // time out because the Table stayed in the loading state.
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "10 Records",
      );
    });
  },
);
