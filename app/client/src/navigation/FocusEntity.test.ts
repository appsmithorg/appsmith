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
      path: "/applications/myAppId/pages/myPageId/edit/api/myApiId",
      expected: {
        entity: FocusEntity.API,
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
      path: "/app/eval/page1-myPageId/edit/api/myApiId",
      expected: {
        entity: FocusEntity.API,
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
      path: "/app/myCustomSlug-myPageId/edit/api/myApiId",
      expected: {
        entity: FocusEntity.API,
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
  ];

  const cases = oldUrlCases.concat(pageSlugCases.concat(customSlugCases));

  it("works", () => {
    for (const testCase of cases) {
      const actual = identifyEntityFromPath(testCase.path);
      expect(actual).toStrictEqual(testCase.expected);
    }
  });
});
