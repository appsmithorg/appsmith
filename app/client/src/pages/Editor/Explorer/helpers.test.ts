import { getActionIdFromURL } from "pages/Editor/Explorer/helpers";

describe("getActionIdFromUrl", () => {
  it("getsApiId", () => {
    window.history.pushState(
      {},
      "Api",
      "/app/applicationSlugName/pageSlugName-pageId/edit/api/apiId",
    );
    const response = getActionIdFromURL();
    expect(response).toBe("apiId");
  });
  it("getsQueryId", () => {
    window.history.pushState(
      {},
      "Query",
      "/app/applicationSlugName/pageSlugName-pageId/edit/queries/queryId",
    );
    const response = getActionIdFromURL();
    expect(response).toBe("queryId");
  });

  it("getsSaaSActionId", () => {
    window.history.pushState(
      {},
      "Query",
      "/app/applicationSlugName/pageSlugName-pageId/edit/saas/:pluginPackageName/api/saasActionId",
    );
    const response = getActionIdFromURL();
    expect(response).toBe("saasActionId");
  });
});
