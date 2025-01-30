import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { EditorState } from "ee/entities/IDE/constants";

interface TestCase {
  path: string;
  expected: FocusEntityInfo;
}

const baseApplicationId = "a0123456789abcdef0000000";
const basePageId = "b0123456789abcdef0000000";

describe("identifyEntityFromPath", () => {
  const oldUrlCases: TestCase[] = [
    {
      path: `/applications/${baseApplicationId}/pages/${basePageId}/edit`,
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          baseApplicationId,
          basePageId,
        },
      },
    },
    {
      path: `/applications/${baseApplicationId}/pages/${basePageId}/edit/widgets/ryvc8i7oja`,
      expected: {
        entity: FocusEntity.WIDGET,
        id: "ryvc8i7oja",
        appState: EditorState.EDITOR,
        params: {
          baseApplicationId,
          basePageId,
          widgetIds: "ryvc8i7oja",
        },
      },
    },
    {
      path: `/applications/${baseApplicationId}/pages/${basePageId}/edit/queries`,
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          baseApplicationId,
          entity: "queries",
          basePageId,
        },
      },
    },
    {
      path: `/applications/${baseApplicationId}/pages/${basePageId}/edit/api/myApiId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        appState: EditorState.EDITOR,
        params: {
          baseApiId: "myApiId",
          baseApplicationId,
          basePageId,
        },
      },
    },
    {
      path: `/applications/${baseApplicationId}/pages/${basePageId}/edit/queries/myQueryId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        appState: EditorState.EDITOR,
        params: {
          baseQueryId: "myQueryId",
          baseApplicationId,
          basePageId,
        },
      },
    },
    {
      path: `/applications/${baseApplicationId}/pages/${basePageId}/edit/jsObjects`,
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          baseApplicationId,
          entity: "jsObjects",
          basePageId,
        },
      },
    },
    {
      path: `/applications/${baseApplicationId}/pages/${basePageId}/edit/jsObjects/myJSId`,
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        appState: EditorState.EDITOR,
        params: {
          baseApplicationId,
          baseCollectionId: "myJSId",
          basePageId,
        },
      },
    },
    {
      path: `/applications/${baseApplicationId}/pages/${basePageId}/edit/datasource`,
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        appState: EditorState.DATA,
        params: {
          baseApplicationId,
          entity: "datasource",
          basePageId,
        },
      },
    },
    {
      path: `/applications/${baseApplicationId}/pages/${basePageId}/edit/datasource/myDatasourceId`,
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        appState: EditorState.DATA,
        params: {
          baseApplicationId,
          datasourceId: "myDatasourceId",
          basePageId,
        },
      },
    },
  ];
  const pageSlugCases: TestCase[] = [
    {
      path: `/app/eval/page1-${basePageId}/edit`,
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          basePageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/app-slug/page1-${basePageId}/edit/widgets/ryvc8i7oja`,
      expected: {
        entity: FocusEntity.WIDGET,
        id: "ryvc8i7oja",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "app-slug",
          basePageId,
          pageSlug: "page1-",
          widgetIds: "ryvc8i7oja",
        },
      },
    },
    {
      path: `/app/eval/page1-${basePageId}/edit/queries`,
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          entity: "queries",
          basePageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${basePageId}/edit/api/myApiId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        appState: EditorState.EDITOR,
        params: {
          baseApiId: "myApiId",
          applicationSlug: "eval",
          basePageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${basePageId}/edit/queries/myQueryId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          basePageId,
          pageSlug: "page1-",
          baseQueryId: "myQueryId",
        },
      },
    },
    {
      path: `/app/eval/page1-${basePageId}/edit/jsObjects`,
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          entity: "jsObjects",
          basePageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${basePageId}/edit/jsObjects/myJSId`,
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        appState: EditorState.EDITOR,
        params: {
          applicationSlug: "eval",
          baseCollectionId: "myJSId",
          basePageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${basePageId}/edit/datasource`,
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        appState: EditorState.DATA,
        params: {
          applicationSlug: "eval",
          entity: "datasource",
          basePageId,
          pageSlug: "page1-",
        },
      },
    },
    {
      path: `/app/eval/page1-${basePageId}/edit/datasource/myDatasourceId`,
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        appState: EditorState.DATA,
        params: {
          applicationSlug: "eval",
          datasourceId: "myDatasourceId",
          basePageId,
          pageSlug: "page1-",
        },
      },
    },
  ];
  const customSlugCases: TestCase[] = [
    {
      path: `/app/myCustomSlug-${basePageId}/edit`,
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          basePageId,
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${basePageId}/edit/widgets/ryvc8i7oja`,
      expected: {
        entity: FocusEntity.WIDGET,
        id: "ryvc8i7oja",
        appState: EditorState.EDITOR,
        params: {
          basePageId,
          customSlug: "myCustomSlug-",
          widgetIds: "ryvc8i7oja",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${basePageId}/edit/queries`,
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          basePageId,
          customSlug: "myCustomSlug-",
          entity: "queries",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${basePageId}/edit/api/myApiId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        appState: EditorState.EDITOR,
        params: {
          basePageId,
          customSlug: "myCustomSlug-",
          baseApiId: "myApiId",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${basePageId}/edit/queries/myQueryId`,
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        appState: EditorState.EDITOR,
        params: {
          basePageId,
          customSlug: "myCustomSlug-",
          baseQueryId: "myQueryId",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${basePageId}/edit/jsObjects`,
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        appState: EditorState.EDITOR,
        params: {
          basePageId,
          entity: "jsObjects",
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${basePageId}/edit/jsObjects/myJSId`,
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        appState: EditorState.EDITOR,
        params: {
          baseCollectionId: "myJSId",
          basePageId,
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${basePageId}/edit/datasource`,
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        appState: EditorState.DATA,
        params: {
          entity: "datasource",
          basePageId,
          customSlug: "myCustomSlug-",
        },
      },
    },
    {
      path: `/app/myCustomSlug-${basePageId}/edit/datasource/myDatasourceId`,
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        appState: EditorState.DATA,
        params: {
          basePageId,
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
