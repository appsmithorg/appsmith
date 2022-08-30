import { identifyEntityFromPath, FocusEntity } from "navigation/FocusEntity";

describe("identifyEntityFromPath", () => {
  const oldUrlCases = [
    {
      path: "/applications/myAppId/pages/myPageId/edit",
      hash: "",
      expected: FocusEntity.CANVAS,
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit#ryvc8i7oja",
      hash: "#ryvc8i7oja",
      expected: FocusEntity.PROPERTY_PANE,
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/api/myApiId",
      hash: "",
      expected: FocusEntity.API,
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/queries/myQueryId",
      hash: "",
      expected: FocusEntity.QUERY,
    },
  ];
  const pageSlugCases = [
    {
      path: "/app/eval/page1-myPageId/edit",
      hash: "",
      expected: FocusEntity.CANVAS,
    },
    {
      path: "/app/myAppId/page1-myPageId/edit#ryvc8i7oja",
      hash: "#ryvc8i7oja",
      expected: FocusEntity.PROPERTY_PANE,
    },
    {
      path: "/app/eval/page1-myPageId/edit/api/myApiId",
      hash: "",
      expected: FocusEntity.API,
    },
    {
      path: "/app/eval/page1-myPageId/edit/queries/myQueryId",
      hash: "",
      expected: FocusEntity.QUERY,
    },
  ];
  const customSlugCases = [
    {
      path: "/app/myCustomSlug-myPageId/edit",
      hash: "",
      expected: FocusEntity.CANVAS,
    },
    {
      path: "/app/myCustomSlug-myPageId/edit#ryvc8i7oja",
      hash: "#ryvc8i7oja",
      expected: FocusEntity.PROPERTY_PANE,
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/api/myApiId",
      hash: "",
      expected: FocusEntity.API,
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/queries/myQueryId",
      hash: "",
      expected: FocusEntity.QUERY,
    },
  ];

  const cases = oldUrlCases.concat(pageSlugCases.concat(customSlugCases));

  it("works", () => {
    for (const testCase of cases) {
      const actual = identifyEntityFromPath(testCase.path, testCase.hash);
      expect(actual).toBe(testCase.expected);
    }
  });
});
