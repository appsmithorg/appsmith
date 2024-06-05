import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { EditorState } from "@appsmith/entities/IDE/constants";

interface TestCase {
  path: string;
  expected: FocusEntityInfo;
}

const pageId = "0123456789abcdef00000000";

describe("identifyEntityFromPath", () => {
  const oldUrlCases: TestCase[] = [
    {
      path: `/applications/myAppId/pages/${pageId}/edit`,
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationId: "myAppId",
          pageId: pageId,
        },
      },
    },
    {
      path: `/applications/myAppId/pages/${pageId}/edit/widgets/ryvc8i7oja`,
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        appState: EditorState.EDITOR,
        params: {
          applicationId: "myAppId",
          pageId: pageId,
          widgetIds: "ryvc8i7oja",
        },
      },
    },
    {
      path: `/applications/myAppId/pages/${pageId}/edit/queries`,
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationId: "myAppId",
          entity: "queries",
          pageId: pageId,
        },
      },
    },
    {
      path: `/applications/myAppId/pages/${pageId}/edit/api/myApiId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        appState: EditorState.EDITOR,
        params: {
          apiId: "myApiId",
          applicationId: "myAppId",
          pageId: pageId,
        },
      },
    },
    {
      path: `/applications/myAppId/pages/${pageId}/edit/queries/myQueryId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        appState: EditorState.EDITOR,
        params: {
          queryId: "myQueryId",
          applicationId: "myAppId",
          pageId: pageId,
        },
      },
    },
    {
      path: `/applications/myAppId/pages/${pageId}/edit/jsObjects`,
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationId: "myAppId",
          entity: "jsObjects",
          pageId: pageId,
        },
      },
    },
    {
      path: `/applications/myAppId/pages/${pageId}/edit/jsObjects/myJSId`,
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        appState: EditorState.EDITOR,
        params: {
          applicationId: "myAppId",
          collectionId: "myJSId",
          pageId: pageId,
        },
      },
    },
    {
      path: `/applications/myAppId/pages/${pageId}/edit/datasource`,
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        appState: EditorState.DATA,
        params: {
          applicationId: "myAppId",
          entity: "datasource",
          pageId: pageId,
        },
      },
    },
    {
      path: `/applications/myAppId/pages/${pageId}/edit/datasource/myDatasourceId`,
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        appState: EditorState.DATA,
        params: {
          applicationId: "myAppId",
          datasourceId: "myDatasourceId",
          pageId: pageId,
        },
      },
    },
  ];
  const pageSlugCases: TestCase[] = [
    {
      path: `/app/eval/page1-${pageId}/edit`,
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          pageId: pageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/myAppId/page1-${pageId}/edit/widgets/ryvc8i7oja`,
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "myAppId",
          pageId: pageId,
          pageSlug: "page1-",
          widgetIds: "ryvc8i7oja",
        },
      },
    },
    {
      path: `/app/eval/page1-${pageId}/edit/queries`,
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          entity: "queries",
          pageId: pageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${pageId}/edit/api/myApiId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        appState: EditorState.EDITOR,
        params: {
          apiId: "myApiId",
          applicationSlug: "eval",
          pageId: pageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${pageId}/edit/queries/myQueryId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          pageId: pageId,
          pageSlug: "page1-",
          queryId: "myQueryId",
        },
      },
    },
    {
      path: `/app/eval/page1-${pageId}/edit/jsObjects`,
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          entity: "jsObjects",
          pageId: pageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${pageId}/edit/jsObjects/myJSId`,
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          collectionId: "myJSId",
          pageId: pageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${pageId}/edit/datasource`,
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        appState: EditorState.DATA,
        params: {
          applicationSlug: "eval",
          entity: "datasource",
          pageId: pageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${pageId}/edit/datasource/myDatasourceId`,
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        appState: EditorState.DATA,
        params: {
          applicationSlug: "eval",
          datasourceId: "myDatasourceId",
          pageId: pageId,
          pageSlug: "page1-",
        },
      },
    },
  ];
  const customSlugCases: TestCase[] = [
    {
      path: `/app/myCustomSlug-${pageId}/edit`,
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          pageId: pageId,
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${pageId}/edit/widgets/ryvc8i7oja`,
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        appState: EditorState.EDITOR,
        params: {
          pageId: pageId,
          customSlug: "myCustomSlug-",
          widgetIds: "ryvc8i7oja",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${pageId}/edit/queries`,
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          pageId: pageId,
          customSlug: "myCustomSlug-",
          entity: "queries",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${pageId}/edit/api/myApiId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        appState: EditorState.EDITOR,
        params: {
          pageId: pageId,
          customSlug: "myCustomSlug-",
          apiId: "myApiId",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${pageId}/edit/queries/myQueryId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        appState: EditorState.EDITOR,
        params: {
          pageId: pageId,
          customSlug: "myCustomSlug-",
          queryId: "myQueryId",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${pageId}/edit/jsObjects`,
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          pageId: pageId,
          entity: "jsObjects",
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${pageId}/edit/jsObjects/myJSId`,
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        appState: EditorState.EDITOR,
        params: {
          collectionId: "myJSId",
          pageId: pageId,
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${pageId}/edit/datasource`,
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        appState: EditorState.DATA,
        params: {
          entity: "datasource",
          pageId: pageId,
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${pageId}/edit/datasource/myDatasourceId`,
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        appState: EditorState.DATA,
        params: {
          pageId: pageId,
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
