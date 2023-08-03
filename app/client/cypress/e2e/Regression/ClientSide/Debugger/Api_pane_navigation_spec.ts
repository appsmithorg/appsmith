import * as _ from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

describe("excludeForAirgap", "Api pane navigation", () => {
  it("Navigation to Grapql pagination field", () => {
    _.apiPage.CreateGraphqlApi("Api1");
    _.apiPage.SelectPaneTab("Pagination");
    _.apiPage.SelectPaginationTypeViaIndex(2);
    _.agHelper.EnterValue("{{test}}", {
      propFieldName: _.apiPage._nextCursorValue,
      directInput: true,
      inputFieldName: "",
    });

    _.apiPage.SelectPaneTab("Headers");
    _.apiPage.EnterHeader("test", "test");
    _.debuggerHelper.AssertErrorCount(1);
    _.entityExplorer.NavigateToSwitcher("Widgets");
    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.ClicklogEntityLink();

    _.agHelper.AssertElementVisible(_.apiPage._nextCursorValue);
    _.debuggerHelper.CloseBottomBar();
    _.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api1",
      entityType: EntityItems.Api,
    });
  });
  it("Navigation to rest api pagination field", () => {
    _.apiPage.CreateApi("Api2");
    _.apiPage.SelectPaneTab("Body");
    _.apiPage.SelectSubTab("MULTIPART_FORM_DATA");

    _.agHelper.EnterValue("{{test}}", {
      propFieldName: _.apiPage._bodyValue(0),
      directInput: true,
      inputFieldName: "",
    });
    _.apiPage.SelectPaneTab("Headers");
    _.entityExplorer.NavigateToSwitcher("Widgets");
    _.debuggerHelper.AssertErrorCount(1);
    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.ClicklogEntityLink();

    _.agHelper.AssertElementVisible(_.apiPage._bodyValue(0));
    _.debuggerHelper.CloseBottomBar();
    _.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api2",
      entityType: EntityItems.Api,
    });
  });
  it("Navigation to a grapql settings field", () => {
    _.apiPage.CreateGraphqlApi("Api3");
    _.apiPage.SelectPaneTab("Settings");
    _.dataSources.SetQueryTimeout(20000, "API");

    _.apiPage.SelectPaneTab("Pagination");
    _.entityExplorer.NavigateToSwitcher("Widgets");
    _.debuggerHelper.ClickDebuggerIcon();
    _.debuggerHelper.ClickLogsTab();
    _.debuggerHelper.ClicklogEntityLink(true);

    _.agHelper.AssertElementVisible(_.dataSources._queryTimeout);
    _.debuggerHelper.CloseBottomBar();
    _.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api3",
      entityType: EntityItems.Api,
    });
  });
});
