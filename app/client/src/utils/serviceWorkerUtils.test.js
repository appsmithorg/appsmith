import {
  getSearchQuery,
  getConsolidatedAPISearchParams,
  getPrefetchConsolidatedApiRequest,
  ConsolidatedApiCacheStrategy,
  matchBuilderPath,
  matchViewerPath,
} from "./serviceWorkerUtils";
import { Headers, Request, Response } from "node-fetch";

global.fetch = jest.fn();
global.caches = {
  open: jest.fn().mockResolvedValue({
    match: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }),
};

describe("serviceWorkerUtils", () => {
  describe("getSearchQuery", () => {
    it("should return the search query from the URL", () => {
      const search = "?key=value";
      const key = "key";
      const result = getSearchQuery(search, key);
      expect(result).toEqual("value");
    });

    it("should return an empty string if the key is not present in the URL", () => {
      const search = "?key=value";
      const key = "invalid";
      const result = getSearchQuery(search, key);
      expect(result).toEqual("");
    });

    it("should return an empty string if the search query is empty", () => {
      const search = "";
      const key = "key";
      const result = getSearchQuery(search, key);
      expect(result).toEqual("");
    });

    it("should return an empty string if the search query is null", () => {
      const search = null;
      const key = "key";
      const result = getSearchQuery(search, key);
      expect(result).toEqual("");
    });
  });

  describe("getConsolidatedAPISearchParams", () => {
    it("should return the consolidated API search params", () => {
      const params = {
        applicationId: "appId",
        pageId: "pageId",
      };
      const result = getConsolidatedAPISearchParams(params);
      expect(result).toEqual("defaultPageId=pageId&applicationId=appId");
    });

    it("should return empty string search params with only the applicationId", () => {
      const params = {
        applicationId: "appId",
      };
      const result = getConsolidatedAPISearchParams(params);
      expect(result).toEqual("");
    });

    it("should return the consolidated API search params with only the pageId", () => {
      const params = {
        pageId: "pageId",
      };
      const result = getConsolidatedAPISearchParams(params);
      expect(result).toEqual("defaultPageId=pageId");
    });

    it("should return an empty string if the params are empty", () => {
      const result = getConsolidatedAPISearchParams();
      expect(result).toEqual("");
    });

    it("should return an empty string if the params are null", () => {
      const result = getConsolidatedAPISearchParams(null);
      expect(result).toEqual("");
    });

    it("should return an empty string if the params are undefined", () => {
      const result = getConsolidatedAPISearchParams(undefined);
      expect(result).toEqual("");
    });
  });

  describe("getPrefetchConsolidatedApiRequest", () => {
    beforeAll(() => {
      global.Request = Request;
      global.Headers = Headers;
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return null if url is not provided", () => {
      expect(getPrefetchConsolidatedApiRequest(null)).toBeNull();
    });

    it("should return null if url does not match any paths", () => {
      const url = new URL("https://app.appsmith.com/unknown/path");
      expect(getPrefetchConsolidatedApiRequest(url)).toBeNull();
    });

    it("should return a request for builder path", async () => {
      const url = new URL(
        "http://example.com/app/test-slug/test-page-123/edit?branch=test-branch",
      );

      const result = getPrefetchConsolidatedApiRequest(url);
      const expectedResult = new Request(
        "http://example.com/api/v1/consolidated-api/edit?defaultPageId=123",
        {
          method: "GET",
          headers: {
            BranchName: "test-branch",
          },
        },
      );

      expect(result).toEqual(expectedResult);
    });

    it("should return a request for viewer path", () => {
      const url = new URL(
        "https://app.appsmith.com/app/test-slug/test-page-123?branch=test-branch",
      );

      const expectedResult = new Request(
        "https://app.appsmith.com/api/v1/consolidated-api/view?defaultPageId=123",
        {
          method: "GET",
          headers: {
            BranchName: "test-branch",
          },
        },
      );

      const result = getPrefetchConsolidatedApiRequest(url);

      expect(result).toEqual(expectedResult);
    });

    it("should return a request without branch name in headers", () => {
      const url = new URL(
        "https://app.appsmith.com/app/test-slug/test-page-123/edit",
      );

      const expectedResult = new Request(
        "https://app.appsmith.com/api/v1/consolidated-api/edit?defaultPageId=123",
        {
          method: "GET",
          headers: {},
        },
      );

      const result = getPrefetchConsolidatedApiRequest(url);

      expect(result).toEqual(expectedResult);
    });
  });

  describe("ConsolidatedApiCacheStrategy", () => {
    let strategy;
    let mockCache;

    beforeAll(() => {
      global.Request = Request;
      global.Headers = Headers;
      global.Response = Response;
    });

    beforeEach(async () => {
      // Reset all mocks
      jest.clearAllMocks();

      mockCache = {
        match: jest.fn(),
        delete: jest.fn(),
        put: jest.fn(),
      };

      global.caches = {
        open: jest.fn().mockResolvedValue(mockCache),
      };

      strategy = new ConsolidatedApiCacheStrategy();
    });

    it("should cache the API response", async () => {
      const mockRequest = new Request("https://example.com/api");
      const mockResponse = new Response("mock data", {
        status: 200,
        headers: { date: new Date().toUTCString() },
      });

      fetch.mockResolvedValue(mockResponse);

      await strategy.cacheConsolidatedApi(mockRequest);

      expect(fetch).toHaveBeenCalledWith(mockRequest);
      expect(mockCache.put).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Response),
      );
    });

    it("should handle errors when fetching the API response", async () => {
      const mockRequest = new Request("https://example.com/api");

      fetch.mockRejectedValue(new Error("Network error"));

      await strategy.cacheConsolidatedApi(mockRequest);

      expect(fetch).toHaveBeenCalledWith(mockRequest);
      expect(mockCache.delete).toHaveBeenCalledWith(mockRequest);
    });

    it("should return a valid cached response", async () => {
      const mockRequest = new Request("https://example.com/api");
      const mockResponse = new Response("mock data", {
        status: 200,
        headers: { date: new Date().toUTCString() },
      });

      mockCache.match.mockResolvedValue(mockResponse);

      const cachedResponse = await strategy.getCachedResponse(mockRequest);

      expect(mockCache.match).toHaveBeenCalledWith(mockRequest);
      expect(cachedResponse).toEqual(mockResponse);
    });

    it("should return null for an invalid cached response", async () => {
      const mockRequest = new Request("https://example.com/api");
      const mockResponse = new Response("mock data", {
        status: 200,
        headers: {
          date: new Date(Date.now() - (2 * 60 * 1000 + 1)).toUTCString(),
        }, // 2 minutes 1 second old cache
      });

      mockCache.match.mockResolvedValue(mockResponse);

      const cachedResponse = await strategy.getCachedResponse(mockRequest);

      expect(mockCache.match).toHaveBeenCalledWith(mockRequest);
      expect(mockCache.delete).toHaveBeenCalledWith(mockRequest);
      expect(cachedResponse).toBeNull();
    });

    it("should return null if no cached response is found", async () => {
      const mockRequest = new Request("https://example.com/api");

      mockCache.match.mockResolvedValue(null);

      const cachedResponse = await strategy.getCachedResponse(mockRequest);

      expect(mockCache.match).toHaveBeenCalledWith(mockRequest);
      expect(cachedResponse).toBeNull();
    });
  });

  describe("matchBuilderPath", () => {
    it("should match the standard builder path", () => {
      const pathName = "/app/applicationSlug/pageSlug-123/edit";
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeTruthy();
      expect(result.params).toHaveProperty("applicationSlug");
      expect(result.params).toHaveProperty("pageSlug");
      expect(result.params).toHaveProperty("pageId", "123");
    });

    it("should match the standard builder path for alphanumeric pageId", () => {
      const pathName =
        "/app/applicationSlug/pageSlug-6616733a6e70274710f21a07/edit";
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeTruthy();
      expect(result.params).toHaveProperty("applicationSlug");
      expect(result.params).toHaveProperty("pageSlug");
      expect(result.params).toHaveProperty(
        "pageId",
        "6616733a6e70274710f21a07",
      );
    });

    it("should match the custom builder path", () => {
      const pathName = "/app/customSlug-custom-456/edit";
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeTruthy();
      expect(result.params).toHaveProperty("customSlug");
      expect(result.params).toHaveProperty("pageId", "456");
    });

    it("should match the deprecated builder path", () => {
      const pathName = "/applications/appId123/pages/456/edit";
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeTruthy();
      expect(result.params).toHaveProperty("applicationId", "appId123");
      expect(result.params).toHaveProperty("pageId", "456");
    });

    it("should not match incorrect builder path", () => {
      const pathName = "/app/applicationSlug/nonMatching-123";
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeFalsy();
    });

    it("should not match when no pageId is present", () => {
      const pathName = "/app/applicationSlug/pageSlug-edit";
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeFalsy();
    });

    it("should match when the path is edit widgets", () => {
      const pathName =
        "/app/applicationSlug/pageSlug-123/edit/widgets/t36hb2zukr";
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeTruthy();
      expect(result.params).toHaveProperty("applicationSlug");
      expect(result.params).toHaveProperty("pageSlug");
      expect(result.params).toHaveProperty("pageId", "123");
    });
  });

  describe("matchViewerPath", () => {
    it("should match the standard viewer path", () => {
      const pathName = "/app/applicationSlug/pageSlug-123";
      const result = matchViewerPath(pathName);

      expect(result).toBeTruthy();
      expect(result.params).toHaveProperty("applicationSlug");
      expect(result.params).toHaveProperty("pageSlug");
      expect(result.params).toHaveProperty("pageId", "123");
    });

    it("should match the custom viewer path", () => {
      const pathName = "/app/customSlug-custom-456";
      const result = matchViewerPath(pathName);

      expect(result).toBeTruthy();
      expect(result.params).toHaveProperty("customSlug");
      expect(result.params).toHaveProperty("pageId", "456");
    });

    it("should match the deprecated viewer path", () => {
      const pathName = "/applications/appId123/pages/456";
      const result = matchViewerPath(pathName);

      expect(result).toBeTruthy();
      expect(result.params).toHaveProperty("applicationId", "appId123");
      expect(result.params).toHaveProperty("pageId", "456");
    });

    it("should not match when no pageId is present", () => {
      const pathName = "/app/applicationSlug/pageSlug";
      const result = matchViewerPath(pathName);

      expect(result).toBeFalsy();
    });
  });
});
