import {
  getActionIdFromURL,
  getJSCollectionIdFromURL,
} from "ee/pages/Editor/Explorer/helpers";

const applicationId = "a0123456789abcdef0000000";
const pageId = "b0123456789abcdef0000000";

describe("getActionIdFromUrl", () => {
  it("getsApiId", () => {
    window.history.pushState(
      {},
      "Api",
      `/app/applicationSlugName/pageSlugName-${pageId}/edit/api/apiId`,
    );
    const response = getActionIdFromURL();

    expect(response).toBe("apiId");
  });
  it("getsQueryId", () => {
    window.history.pushState(
      {},
      "Query",
      `/app/applicationSlugName/pageSlugName-${pageId}/edit/queries/queryId`,
    );
    const response = getActionIdFromURL();

    expect(response).toBe("queryId");
  });

  it("getsSaaSActionId", () => {
    window.history.pushState(
      {},
      "Query",
      `/app/applicationSlugName/pageSlugName-${pageId}/edit/saas/:pluginPackageName/api/saasActionId`,
    );
    const response = getActionIdFromURL();

    expect(response).toBe("saasActionId");
  });
});

describe("getJSCollectionIdFromURL", () => {
  it("returns collectionId from path", () => {
    window.history.pushState(
      {},
      "Query",
      `/applications/${applicationId}/pages/${pageId}/edit/jsObjects/collectionId`,
    );
    const response = getJSCollectionIdFromURL();

    expect(response).toBe("collectionId");
  });

  it("returns undefined", () => {
    window.history.pushState(
      {},
      "Query",
      `/applications/${applicationId}/pages/${pageId}/edit/jsObjects`,
    );
    const response = getJSCollectionIdFromURL();

    expect(response).toBe(undefined);
  });
});
