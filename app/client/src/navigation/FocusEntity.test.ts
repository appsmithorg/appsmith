import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { EditorState } from "@appsmith/entities/IDE/constants";

interface TestCase {
  path: string;
  expected: FocusEntityInfo;
}

describe("identifyEntityFromPath", () => {
  const oldUrlCases: TestCase[] = [
    {
      path: "/applications/myAppId/pages/myPageId/edit",
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationId: "myAppId",
          pageId: "myPageId",
        },
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/widgets/ryvc8i7oja",
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        appState: EditorState.EDITOR,
        params: {
          applicationId: "myAppId",
          pageId: "myPageId",
          widgetIds: "ryvc8i7oja",
        },
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/queries",
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationId: "myAppId",
          entity: "queries",
          pageId: "myPageId",
        },
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/api/myApiId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        appState: EditorState.EDITOR,
        params: {
          apiId: "myApiId",
          applicationId: "myAppId",
          pageId: "myPageId",
        },
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/queries/myQueryId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        appState: EditorState.EDITOR,
        params: {
          queryId: "myQueryId",
          applicationId: "myAppId",
          pageId: "myPageId",
        },
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/jsObjects",
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationId: "myAppId",
          entity: "jsObjects",
          pageId: "myPageId",
        },
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/jsObjects/myJSId",
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        appState: EditorState.EDITOR,
        params: {
          applicationId: "myAppId",
          collectionId: "myJSId",
          pageId: "myPageId",
        },
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/datasource",
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        appState: EditorState.DATA,
        params: {
          applicationId: "myAppId",
          entity: "datasource",
          pageId: "myPageId",
        },
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/datasource/myDatasourceId",
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        appState: EditorState.DATA,
        params: {
          applicationId: "myAppId",
          datasourceId: "myDatasourceId",
          pageId: "myPageId",
        },
      },
    },
  ];
  const pageSlugCases: TestCase[] = [
    {
      path: "/app/eval/page1-myPageId/edit",
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          pageId: "myPageId",
          pageSlug: "page1-",
        },
      },
    },
    {
      path: "/app/myAppId/page1-myPageId/edit/widgets/ryvc8i7oja",
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "myAppId",
          pageId: "myPageId",
          pageSlug: "page1-",
          widgetIds: "ryvc8i7oja",
        },
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/queries",
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          entity: "queries",
          pageId: "myPageId",
          pageSlug: "page1-",
        },
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/api/myApiId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        appState: EditorState.EDITOR,
        params: {
          apiId: "myApiId",
          applicationSlug: "eval",
          pageId: "myPageId",
          pageSlug: "page1-",
        },
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/queries/myQueryId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          pageId: "myPageId",
          pageSlug: "page1-",
          queryId: "myQueryId",
        },
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/jsObjects",
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          entity: "jsObjects",
          pageId: "myPageId",
          pageSlug: "page1-",
        },
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/jsObjects/myJSId",
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          collectionId: "myJSId",
          pageId: "myPageId",
          pageSlug: "page1-",
        },
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/datasource",
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        appState: EditorState.DATA,
        params: {
          applicationSlug: "eval",
          entity: "datasource",
          pageId: "myPageId",
          pageSlug: "page1-",
        },
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/datasource/myDatasourceId",
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        appState: EditorState.DATA,
        params: {
          applicationSlug: "eval",
          datasourceId: "myDatasourceId",
          pageId: "myPageId",
          pageSlug: "page1-",
        },
      },
    },
  ];
  const customSlugCases: TestCase[] = [
    {
      path: "/app/myCustomSlug-myPageId/edit",
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          pageId: "myPageId",
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/widgets/ryvc8i7oja",
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        appState: EditorState.EDITOR,
        params: {
          pageId: "myPageId",
          customSlug: "myCustomSlug-",
          widgetIds: "ryvc8i7oja",
        },
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/queries",
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          pageId: "myPageId",
          customSlug: "myCustomSlug-",
          entity: "queries",
        },
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/api/myApiId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        appState: EditorState.EDITOR,
        params: {
          pageId: "myPageId",
          customSlug: "myCustomSlug-",
          apiId: "myApiId",
        },
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/queries/myQueryId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        appState: EditorState.EDITOR,
        params: {
          pageId: "myPageId",
          customSlug: "myCustomSlug-",
          queryId: "myQueryId",
        },
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/jsObjects",
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          pageId: "myPageId",
          entity: "jsObjects",
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/jsObjects/myJSId",
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        appState: EditorState.EDITOR,
        params: {
          collectionId: "myJSId",
          pageId: "myPageId",
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/datasource",
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        appState: EditorState.DATA,
        params: {
          entity: "datasource",
          pageId: "myPageId",
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/datasource/myDatasourceId",
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        appState: EditorState.DATA,
        params: {
          pageId: "myPageId",
          customSlug: "myCustomSlug-",
          datasourceId: "myDatasourceId",
        },
      },
    },
  ];

  const cases = oldUrlCases.concat(pageSlugCases.concat(customSlugCases));

  it("works", () => {
    for (const testCase of cases) {
      const actual = identifyEntityFromPath(testCase.path);
      expect(actual).toStrictEqual(testCase.expected);
    }
  });
});
