import { identifyEntityFromPath, FocusEntity } from "navigation/FocusEntity";

describe("identifyEntityFromPath", () => {
  const oldUrlCases = [
    {
      path: "/applications/myAppId/pages/myPageId/edit",
      hash: "",
      expected: { entity: FocusEntity.CANVAS, id: "", pageId: "myPageId" },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit#ryvc8i7oja",
      hash: "#ryvc8i7oja",
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "#ryvc8i7oja",
        pageId: "myPageId",
      },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/api/myApiId",
      hash: "",
      expected: { entity: FocusEntity.API, id: "myApiId", pageId: "myPageId" },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/queries/myQueryId",
      hash: "",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        pageId: "myPageId",
      },
    },
  ];
  const pageSlugCases = [
    {
      path: "/app/eval/page1-myPageId/edit",
      hash: "",
      expected: { entity: FocusEntity.CANVAS, id: "", pageId: "myPageId" },
    },
    {
      path: "/app/myAppId/page1-myPageId/edit#ryvc8i7oja",
      hash: "#ryvc8i7oja",
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "#ryvc8i7oja",
        pageId: "myPageId",
      },
    },
    {
      path: "/app/eval/page1-myPageId/edit/api/myApiId",
      hash: "",
      expected: { entity: FocusEntity.API, id: "myApiId", pageId: "myPageId" },
    },
    {
      path: "/app/eval/page1-myPageId/edit/queries/myQueryId",
      hash: "",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        pageId: "myPageId",
      },
    },
  ];
  const customSlugCases = [
    {
      path: "/app/myCustomSlug-myPageId/edit",
      hash: "",
      expected: { entity: FocusEntity.CANVAS, id: "", pageId: "myPageId" },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit#ryvc8i7oja",
      hash: "#ryvc8i7oja",
      expected: {
        entity: FocusEntity.PROPERTY_PANE,
        id: "#ryvc8i7oja",
        pageId: "myPageId",
      },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/api/myApiId",
      hash: "",
      expected: { entity: FocusEntity.API, id: "myApiId", pageId: "myPageId" },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/queries/myQueryId",
      hash: "",
      expected: {
        entity: FocusEntity.QUERY,
        id: "myQueryId",
        pageId: "myPageId",
      },
    },
  ];

  const cases = oldUrlCases.concat(pageSlugCases.concat(customSlugCases));

  it("works", () => {
    for (const testCase of cases) {
      const actual = identifyEntityFromPath(testCase.path, testCase.hash);
      expect(actual).toStrictEqual(testCase.expected);
    }
  });
});
