/// <reference types="cypress-tags" />
import {
  apiPage,
  agHelper,
  debuggerHelper,
  entityExplorer,
  dataSources,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation from "../../../../support/Pages/EditorNavigation";

describe("excludeForAirgap", "Api pane navigation", () => {
  it("1. Navigation to Graphql pagination field", () => {
    apiPage.CreateGraphqlApi("Api1");
    apiPage.SelectPaneTab("Pagination");
    apiPage.SelectPaginationTypeViaIndex(2);
    agHelper.EnterValue("{{test}}", {
      propFieldName: apiPage._nextCursorValue,
      directInput: true,
      inputFieldName: "",
    });

    apiPage.SelectPaneTab("Headers");
    apiPage.EnterHeader("test", "test");
    debuggerHelper.AssertErrorCount(1);
    EditorNavigation.ShowCanvas();
    debuggerHelper.ClickDebuggerIcon();
    debuggerHelper.ClicklogEntityLink();

    agHelper.AssertElementVisibility(apiPage._nextCursorValue);
    debuggerHelper.CloseBottomBar();
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api1",
      entityType: entityItems.Api,
    });
  });

  it("2. Navigation to rest api pagination field", () => {
    apiPage.CreateApi("Api2");
    apiPage.SelectPaneTab("Body");
    apiPage.SelectSubTab("MULTIPART_FORM_DATA");

    agHelper.EnterValue("{{test}}", {
      propFieldName: apiPage._bodyValue(0),
      directInput: true,
      inputFieldName: "",
    });
    apiPage.SelectPaneTab("Headers");
    EditorNavigation.ShowCanvas();
    debuggerHelper.AssertErrorCount(1);
    debuggerHelper.ClickDebuggerIcon();
    debuggerHelper.ClicklogEntityLink();

    agHelper.AssertElementVisibility(apiPage._bodyValue(0));
    debuggerHelper.CloseBottomBar();
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api2",
      entityType: entityItems.Api,
    });
  });

  it("3. Navigation to a grapql settings field", () => {
    apiPage.CreateGraphqlApi("Api3");
    apiPage.SelectPaneTab("Settings");
    dataSources.SetQueryTimeout(20000, "API");

    apiPage.SelectPaneTab("Pagination");
    EditorNavigation.ShowCanvas();
    debuggerHelper.ClickDebuggerIcon();
    debuggerHelper.ClickLogsTab();
    debuggerHelper.ClicklogEntityLink(true);

    agHelper.AssertElementVisibility(dataSources._queryTimeout);
    debuggerHelper.CloseBottomBar();
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api3",
      entityType: entityItems.Api,
    });
  });
});
