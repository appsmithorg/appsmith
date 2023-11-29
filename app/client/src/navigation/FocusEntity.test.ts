import { identifyEntityFromPath, FocusEntity } from "navigation/FocusEntity";
import { AppState } from "../entities/IDE/constants";

describe("identifyEntityFromPath", () => {
  const oldUrlCases = [
    {
      path: "/applications/myAppId/pages/myPageId/edit",
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/widgets/ryvc8i7oja",
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/queries",
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/api/myApiId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/queries/myQueryId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/jsObjects",
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/jsObjects/myJSId",
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/datasource",
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        pageId: "myPageId",
        appState: AppState.DATA,
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/datasources/myDatasourceId",
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        pageId: "myPageId",
        appState: AppState.DATA,
      },
    },
  ];
  const pageSlugCases = [
    {
      path: "/app/eval/page1-myPageId/edit",
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/myAppId/page1-myPageId/edit/widgets/ryvc8i7oja",
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/queries",
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/api/myApiId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/queries/myQueryId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/jsObjects",
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/jsObjects/myJSId",
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/datasource",
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        pageId: "myPageId",
        appState: AppState.DATA,
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/datasources/myDatasourceId",
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        pageId: "myPageId",
        appState: AppState.DATA,
      },
    },
  ];
  const customSlugCases = [
    {
      path: "/app/myCustomSlug-myPageId/edit",
      expected: {
        entity: FocusEntity.CANVAS,
        id: "",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/widgets/ryvc8i7oja",
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "ryvc8i7oja",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/queries",
      expected: {
        entity: FocusEntity.QUERY_LIST,
        id: "",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/api/myApiId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myApiId",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/queries/myQueryId",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/jsObjects",
      expected: {
        entity: FocusEntity.JS_OBJECT_LIST,
        id: "",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/jsObjects/myJSId",
      expected: {
        entity: FocusEntity.JS_OBJECT,
        id: "myJSId",
        pageId: "myPageId",
        appState: AppState.PAGES,
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/datasource",
      expected: {
        entity: FocusEntity.DATASOURCE_LIST,
        id: "",
        pageId: "myPageId",
        appState: AppState.DATA,
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/datasources/myDatasourceId",
      expected: {
        entity: FocusEntity.DATASOURCE,
        id: "myDatasourceId",
        pageId: "myPageId",
        appState: AppState.DATA,
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
