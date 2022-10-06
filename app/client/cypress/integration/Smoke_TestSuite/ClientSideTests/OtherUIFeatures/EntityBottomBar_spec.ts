import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  ApiPage: apiPage,
  DataSources: dataSources,
  Debugger: debuggerHelper,
  JSEditor: jsEditor,
} = ObjectsRegistry;

describe("Entity bottom bar", () => {
  it("1. debugger should be closable", () => {
    debuggerHelper.ClickDebuggerIcon();
    debuggerHelper.AssertOpen();
    debuggerHelper.close();
    debuggerHelper.AssertClosed();
  });

  it("2. api bottom pane should be collapsable", () => {
    apiPage.CreateApi();
    apiPage.isBottomPaneOpen();

    apiPage.closeBottomPane();
    apiPage.isBottomPaneClosed();

    apiPage.openResponseTab();
    apiPage.isBottomPaneOpen();
  });

  it("3. jseditor bottom bar should be collapsable", () => {
    jsEditor.NavigateToNewJSEditor();
    jsEditor.isBottomPaneOpen();

    jsEditor.closeBottomPane();
    jsEditor.isBottomPaneClosed();

    jsEditor.openResponseTab();
    jsEditor.isBottomPaneOpen();
  });

  it("4. query bottom bar should be collapsable", () => {
    dataSources.createMockDB("Users").then((dbName) => {
      dataSources.CreateQuery(dbName);
      dataSources.isBottomPaneOpen();

      dataSources.closeBottomPane();
      dataSources.isBottomPaneClosed();

      dataSources.openResponseTab();
      dataSources.isBottomPaneOpen();

      // clean up
      dataSources.DeleteQuery("Query1");
      dataSources.DeleteDatasouceFromActiveTab(dbName);
    });
  });
});
