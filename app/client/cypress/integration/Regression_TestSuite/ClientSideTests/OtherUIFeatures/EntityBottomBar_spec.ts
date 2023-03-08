import * as _ from "../../../../support/Objects/ObjectsCore";
import { PageType } from "../../../../support/Pages/DebuggerHelper";

describe("Entity bottom bar", () => {
  it("1. Debugger should be closable", () => {
    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.AssertOpen(PageType.Canvas);
    _.debuggerHelper.Close(PageType.Canvas);
    _.debuggerHelper.AssertClosed(PageType.Canvas);
  });

  it("2. Api bottom pane should be collapsable", () => {
    _.apiPage.CreateApi();
    _.debuggerHelper.AssertOpen(PageType.API);

    _.debuggerHelper.Close(PageType.API);
    _.debuggerHelper.AssertClosed(PageType.API);

    _.debuggerHelper.ClickResponseTab();
    _.debuggerHelper.AssertOpen(PageType.API);
  });

  it("3. Jseditor bottom bar should be collapsable", () => {
    _.jsEditor.NavigateToNewJSEditor();
    _.debuggerHelper.AssertOpen(PageType.JsEditor);

    _.debuggerHelper.Close(PageType.JsEditor);
    _.debuggerHelper.AssertClosed(PageType.JsEditor);

    _.debuggerHelper.ClickResponseTab();
    _.debuggerHelper.AssertOpen(PageType.JsEditor);
  });

  it("4. Query bottom bar should be collapsable", () => {
    _.dataSources.CreateMockDB("Users").then((dbName) => {
      _.dataSources.CreateQueryFromActiveTab(dbName, false);
      _.debuggerHelper.AssertOpen(PageType.Query);

      _.debuggerHelper.Close(PageType.Query);
      _.debuggerHelper.AssertClosed(PageType.Query);

      _.debuggerHelper.ClickResponseTab();
      _.debuggerHelper.AssertOpen(PageType.Query);

      // clean up
      _.dataSources.DeleteQuery("Query1");
      _.dataSources.DeleteDatasouceFromActiveTab(dbName);
    });
  });
});
