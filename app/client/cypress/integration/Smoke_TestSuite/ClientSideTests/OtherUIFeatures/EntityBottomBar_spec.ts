import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  ApiPage: apiPage,
  DataSources: dataSources,
  Debugger: debuggerHelper,
  JSEditor: jsEditor,
} = ObjectsRegistry;

describe("Debugger bottom bar", () => {
  it("should be closable", () => {
    debuggerHelper.ClickDebuggerIcon();
    debuggerHelper.AssertOpen();
    debuggerHelper.close();
    debuggerHelper.AssertClosed();
  });
});

describe("Api bottom bar", () => {
  it("should be collapsable", () => {
    apiPage.CreateApi();
    apiPage.isBottomPaneOpen();

    apiPage.closeBottomPane();
    apiPage.isBottomPaneClosed();

    apiPage.openResponseTab();
    apiPage.isBottomPaneOpen();
  });
});

describe("JsEditor bottom bar", () => {
  it("should be collapsable", () => {
    jsEditor.NavigateToNewJSEditor();
    jsEditor.isBottomPaneOpen();

    jsEditor.closeBottomPane();
    jsEditor.isBottomPaneClosed();

    jsEditor.openResponseTab();
    jsEditor.isBottomPaneOpen();
  });
});

describe("Query bottom bar", () => {
  it("should be collapsable", () => {
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
