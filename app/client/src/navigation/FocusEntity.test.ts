import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { EditorState } from "@appsmith/entities/IDE/constants";

interface TestCase {
  path: string;
  expected: FocusEntityInfo;
}

const applicationId = "a0123456789abcdef0000000";
const pageId = "b0123456789abcdef0000000";

describe("identifyEntityFromPath", () => {
  const oldUrlCases: TestCase[] = [
    {
      path: `/applications/${applicationId}/pages/${pageId}/edit`,
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        appState: EditorState.UI,
        params: {
          applicationId,
          pageId,
        },
      },
    },
    {
      path: `/applications/${applicationId}/pages/${pageId}/edit/widgets/ryvc8i7oja`,
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        appState: EditorState.UI,
        params: {
          applicationId,
          pageId,
          widgetIds: "ryvc8i7oja",
        },
      },
    },
    {
      path: `/applications/${applicationId}/pages/${pageId}/edit/queries`,
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        appState: EditorState.DATA,
        params: {
          applicationId,
          entity: "queries",
          pageId,
        },
      },
    },
    {
      path: `/applications/${applicationId}/pages/${pageId}/edit/api/myApiId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        appState: EditorState.DATA,
        params: {
          apiId: "myApiId",
          applicationId,
          pageId,
        },
      },
    },
    {
      path: `/applications/${applicationId}/pages/${pageId}/edit/queries/myQueryId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        appState: EditorState.DATA,
        params: {
          queryId: "myQueryId",
          applicationId,
          pageId,
        },
      },
    },
    {
      path: `/applications/${applicationId}/pages/${pageId}/edit/jsObjects`,
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        appState: EditorState.LOGIC,
        params: {
          applicationId,
          entity: "jsObjects",
          pageId,
        },
      },
    },
    {
      path: `/applications/${applicationId}/pages/${pageId}/edit/jsObjects/myJSId`,
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        appState: EditorState.LOGIC,
        params: {
          applicationId,
          collectionId: "myJSId",
          pageId,
        },
      },
    },
    {
      path: `/applications/${applicationId}/pages/${pageId}/edit/datasource`,
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        appState: EditorState.DATASOURCES,
        params: {
          applicationId,
          entity: "datasource",
          pageId,
        },
      },
    },
    {
      path: `/applications/${applicationId}/pages/${pageId}/edit/datasource/myDatasourceId`,
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        appState: EditorState.DATASOURCES,
        params: {
          applicationId,
          datasourceId: "myDatasourceId",
          pageId,
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
        appState: EditorState.UI,
        params: {
          applicationSlug: "eval",
          pageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/app-slug/page1-${pageId}/edit/widgets/ryvc8i7oja`,
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        appState: EditorState.UI,
        params: {
          applicationSlug: "app-slug",
          pageId,
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
        appState: EditorState.DATA,
        params: {
          applicationSlug: "eval",
          entity: "queries",
          pageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${pageId}/edit/api/myApiId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        appState: EditorState.DATA,
        params: {
          apiId: "myApiId",
          applicationSlug: "eval",
          pageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${pageId}/edit/queries/myQueryId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        appState: EditorState.DATA,
        params: {
          applicationSlug: "eval",
          pageId,
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
        appState: EditorState.LOGIC,
        params: {
          applicationSlug: "eval",
          entity: "jsObjects",
          pageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${pageId}/edit/jsObjects/myJSId`,
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        appState: EditorState.LOGIC,
        params: {
          applicationSlug: "eval",
          collectionId: "myJSId",
          pageId,
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
          pageId,
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
          pageId,
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
        appState: EditorState.UI,
        params: {
          pageId,
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${pageId}/edit/widgets/ryvc8i7oja`,
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        appState: EditorState.UI,
        params: {
          pageId,
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
        appState: EditorState.DATA,
        params: {
          pageId,
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
        appState: EditorState.DATA,
        params: {
          pageId,
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
        appState: EditorState.DATA,
        params: {
          pageId,
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
        appState: EditorState.LOGIC,
        params: {
          pageId,
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
        appState: EditorState.LOGIC,
        params: {
          collectionId: "myJSId",
          pageId,
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${pageId}/edit/datasource`,
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        appState: EditorState.DATASOURCES,
        params: {
          entity: "datasource",
          pageId,
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${pageId}/edit/datasource/myDatasourceId`,
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        appState: EditorState.DATASOURCES,
        params: {
          pageId,
          customSlug: "myCustomSlug-",
          datasourceId: "myDatasourceId",
        },
      },
    },
  ];

  const cases = oldUrlCases.concat(pageSlugCases.concat(customSlugCases));

  it.each(cases)("$# $path", ({ expected, path }) => {
    expect(identifyEntityFromPath(path)).toStrictEqual(expected);
  });
});
