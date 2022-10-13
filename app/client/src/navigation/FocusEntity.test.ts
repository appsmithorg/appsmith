import { identifyEntityFromPath, FocusEntity } from "navigation/FocusEntity";

describe("identifyEntityFromPath", () => {
  const oldUrlCases = [
    {
      path: "/applications/myAppId/pages/myPageId/edit",
      hash: "",
      expected: { entity: FocusEntity.CANVAS, id: "" },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit#ryvc8i7oja",
      hash: "#ryvc8i7oja",
      expected: { entity: FocusEntity.PROPERTY_PANE, id: "#ryvc8i7oja" },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/api/myApiId",
      hash: "",
      expected: { entity: FocusEntity.API, id: "myApiId" },
    },
    {
      path: "/applications/myAppId/pages/myPageId/edit/queries/myQueryId",
      hash: "",
      expected: { entity: FocusEntity.QUERY, id: "myQueryId" },
    },
  ];
  const pageSlugCases = [
    {
      path: "/app/eval/page1-myPageId/edit",
      hash: "",
      expected: { entity: FocusEntity.CANVAS, id: "" },
    },
    {
      path: "/app/myAppId/page1-myPageId/edit#ryvc8i7oja",
      hash: "#ryvc8i7oja",
      expected: { entity: FocusEntity.PROPERTY_PANE, id: "#ryvc8i7oja" },
    },
    {
      path: "/app/eval/page1-myPageId/edit/api/myApiId",
      hash: "",
      expected: { entity: FocusEntity.API, id: "myApiId" },
    },
    {
      path: "/app/eval/page1-myPageId/edit/queries/myQueryId",
      hash: "",
      expected: { entity: FocusEntity.QUERY, id: "myQueryId" },
    },
  ];
  const customSlugCases = [
    {
      path: "/app/myCustomSlug-myPageId/edit",
      hash: "",
      expected: { entity: FocusEntity.CANVAS, id: "" },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit#ryvc8i7oja",
      hash: "#ryvc8i7oja",
      expected: { entity: FocusEntity.PROPERTY_PANE, id: "#ryvc8i7oja" },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/api/myApiId",
      hash: "",
      expected: { entity: FocusEntity.API, id: "myApiId" },
    },
    {
      path: "/app/myCustomSlug-myPageId/edit/queries/myQueryId",
      hash: "",
      expected: { entity: FocusEntity.QUERY, id: "myQueryId" },
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
