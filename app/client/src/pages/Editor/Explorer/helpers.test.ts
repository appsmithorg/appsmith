import { getActionIdFromURL } from "pages/Editor/Explorer/helpers";

describe("getActionIdFromUrl", () => {
  it("getsApiId", () => {
    window.history.pushState(
      {},
      "Api",
      "/applications/appId/pages/pageId/edit/api/apiId",
    );
    const response = getActionIdFromURL();
    expect(response).toBe("apiId");
  });
  it("getsQueryId", () => {
    window.history.pushState(
      {},
      "Query",
      "/applications/appId/pages/pageId/edit/queries/queryId",
    );
    const response = getActionIdFromURL();
    expect(response).toBe("queryId");
  });

  it("getsSaaSActionId", () => {
    window.history.pushState(
      {},
      "Query",
      "/applications/appId/pages/pageId/edit/saas/:pluginPackageName/api/saasActionId",
    );
    const response = getActionIdFromURL();
    expect(response).toBe("saasActionId");
  });
});
