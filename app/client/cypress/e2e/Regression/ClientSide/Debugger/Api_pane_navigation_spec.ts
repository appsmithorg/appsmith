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

describe(
  "Api pane navigation",
  {
    tags: [
      "@tag.Datasource",
      " @tag.excludeForAirgap",
      "@tag.Git",
      "@tag.AccessControl",
    ],
  },
  () => {
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
      debuggerHelper.OpenDebugger();
      debuggerHelper.ClicklogEntityLink();

      agHelper.AssertElementVisibility(apiPage._nextCursorValue);
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
      debuggerHelper.ClicklogEntityLink();

      agHelper.AssertElementVisibility(apiPage._bodyValue(0));
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Api2",
        entityType: entityItems.Api,
      });
    });
  },
);
