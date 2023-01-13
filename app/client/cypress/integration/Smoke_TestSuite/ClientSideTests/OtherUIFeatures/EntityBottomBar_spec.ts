import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { PageType } from "../../../../support/Pages/DebuggerHelper";

const {
  ApiPage: apiPage,
  DataSources: dataSources,
  DebuggerHelper: debuggerHelper,
  JSEditor: jsEditor,
} = ObjectsRegistry;

describe("Entity bottom bar", () => {
  it("1. debugger should be closable", () => {
    debuggerHelper.ClickDebuggerIcon();
    debuggerHelper.AssertOpen(PageType.Canvas);
    debuggerHelper.Close(PageType.Canvas);
    debuggerHelper.AssertClosed(PageType.Canvas);
  });

  it("2. api bottom pane should be collapsable", () => {
    apiPage.CreateApi();
    debuggerHelper.AssertOpen(PageType.API);

    debuggerHelper.Close(PageType.API);
    debuggerHelper.AssertClosed(PageType.API);

    debuggerHelper.ClickResponseTab();
    debuggerHelper.AssertOpen(PageType.API);
  });

  it("3. jseditor bottom bar should be collapsable", () => {
    jsEditor.NavigateToNewJSEditor();
    debuggerHelper.AssertOpen(PageType.JsEditor);

    debuggerHelper.Close(PageType.JsEditor);
    debuggerHelper.AssertClosed(PageType.JsEditor);

    debuggerHelper.ClickResponseTab();
    debuggerHelper.AssertOpen(PageType.JsEditor);
  });

  it("4. query bottom bar should be collapsable", () => {
    dataSources.CreateMockDB("Users").then((dbName) => {
      dataSources.CreateQuery(dbName);
      debuggerHelper.AssertOpen(PageType.Query);

      debuggerHelper.Close(PageType.Query);
      debuggerHelper.AssertClosed(PageType.Query);

      debuggerHelper.ClickResponseTab();
      debuggerHelper.AssertOpen(PageType.Query);

      // clean up
      dataSources.DeleteQuery("Query1");
      dataSources.DeleteDatasouceFromActiveTab(dbName);
    });
  });
});
