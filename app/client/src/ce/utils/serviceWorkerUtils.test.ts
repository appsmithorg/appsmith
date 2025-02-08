import { APP_MODE } from "entities/App";
import type { TApplicationParams } from "./serviceWorkerUtils";
import {
  matchBuilderPath,
  matchViewerPath,
  getSearchQuery,
  getConsolidatedApiPrefetchRequest,
  getApplicationParamsFromUrl,
  getPrefetchRequests,
  PrefetchApiService,
} from "./serviceWorkerUtils";
import { Mutex } from "async-mutex";
import { Request as NFRequest, Response as NFResponse } from "node-fetch";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).fetch = jest.fn() as jest.Mock;
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).caches = {
  open: jest.fn(),
  delete: jest.fn(),
};

const baseApplicationId = "b0123456789abcdef0000000";
const basePageId = "a0123456789abcdef0000000";

describe("serviceWorkerUtils", () => {
  describe("matchBuilderPath", () => {
    it("should match the standard builder path", () => {
      const pathName = `/app/applicationSlug/pageSlug-${basePageId}/edit`;
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeTruthy();

      if (result) {
        expect(result.params).toHaveProperty("applicationSlug");
        expect(result.params).toHaveProperty("pageSlug");
        expect(result.params).toHaveProperty("basePageId", basePageId);
      } else {
        fail("Expected result to be truthy");
      }
    });

    it("should match the standard builder path for alphanumeric basePageId", () => {
      const pathName = `/app/applicationSlug/pageSlug-${basePageId}/edit`;
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeTruthy();

      if (result) {
        expect(result.params).toHaveProperty("applicationSlug");
        expect(result.params).toHaveProperty("pageSlug");
        expect(result.params).toHaveProperty("basePageId", basePageId);
      } else {
        fail("Expected result to be truthy");
      }
    });

    it("should match the custom builder path", () => {
      const pathName = `/app/customSlug-custom-${basePageId}/edit`;
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeTruthy();

      if (result) {
        expect(result.params).toHaveProperty("customSlug");
        expect(result.params).toHaveProperty("basePageId", basePageId);
      } else {
        fail("Expected result to be truthy");
      }
    });

    it("should match the deprecated builder path", () => {
      const pathName = `/applications/${baseApplicationId}/pages/${basePageId}/edit`;
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeTruthy();

      if (result) {
        expect(result.params).toHaveProperty(
          "baseApplicationId",
          baseApplicationId,
        );
        expect(result.params).toHaveProperty("basePageId", basePageId);
      } else {
        fail("Expected result to be truthy");
      }
    });

    it("should not match incorrect builder path", () => {
      const pathName = "/app/applicationSlug/nonMatching-123";
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeFalsy();
    });

    it("should not match when no basePageId is present", () => {
      const pathName = "/app/applicationSlug/pageSlug-edit";
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      expect(result).toBeFalsy();
    });

    it("should match when the path is edit widgets", () => {
      const pathName = `/app/applicationSlug/pageSlug-${basePageId}/edit/widgets/t36hb2zukr`;
      const options = { end: false };
      const result = matchBuilderPath(pathName, options);

      if (result) {
        expect(result.params).toHaveProperty("applicationSlug");
        expect(result.params).toHaveProperty("pageSlug");
        expect(result.params).toHaveProperty("basePageId", basePageId);
      } else {
        fail("Expected result to be truthy");
      }
    });
  });

  describe("matchViewerPath", () => {
    it("should match the standard viewer path", () => {
      const pathName = `/app/applicationSlug/pageSlug-${basePageId}`;
      const result = matchViewerPath(pathName);

      expect(result).toBeTruthy();

      if (result) {
        expect(result.params).toHaveProperty("applicationSlug");
        expect(result.params).toHaveProperty("pageSlug");
        expect(result.params).toHaveProperty("basePageId", basePageId);
      } else {
        fail("Expected result to be truthy");
      }
    });

    it("should match the custom viewer path", () => {
      const pathName = `/app/customSlug-custom-${basePageId}`;
      const result = matchViewerPath(pathName);

      expect(result).toBeTruthy();

      if (result) {
        expect(result.params).toHaveProperty("customSlug");
        expect(result.params).toHaveProperty("basePageId", basePageId);
      } else {
        fail("Expected result to be truthy");
      }
    });

    it("should match the deprecated viewer path", () => {
      const pathName = `/applications/${baseApplicationId}/pages/${basePageId}`;
      const result = matchViewerPath(pathName);

      expect(result).toBeTruthy();

      if (result) {
        expect(result.params).toHaveProperty(
          "baseApplicationId",
          baseApplicationId,
        );
        expect(result.params).toHaveProperty("basePageId", basePageId);
      } else {
        fail("Expected result to be truthy");
      }
    });

    it("should not match when no basePageId is present", () => {
      const pathName = "/app/applicationSlug/pageSlug";
      const result = matchViewerPath(pathName);

      expect(result).toBeFalsy();
    });
  });

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
  });

  describe("getApplicationParamsFromUrl", () => {
    it("should parse URL and return correct params for builder path", () => {
      const url = new URL(
        `https://app.appsmith.com/app/my-app/page-${basePageId}/edit?branch=main`,
      );
      const expectedParams: TApplicationParams = {
        origin: "https://app.appsmith.com",
        basePageId,
        applicationSlug: "my-app",
        baseApplicationId: undefined,
        branchName: "main",
        appMode: APP_MODE.EDIT,
      };

      expect(getApplicationParamsFromUrl(url)).toEqual(expectedParams);
    });

    it("should parse URL and return correct params for viewer path", () => {
      const url = new URL(
        `https://app.appsmith.com/app/my-app/page-${basePageId}?branch=main`,
      );
      const expectedParams: TApplicationParams = {
        origin: "https://app.appsmith.com",
        basePageId,
        applicationSlug: "my-app",
        baseApplicationId: undefined,
        branchName: "main",
        appMode: APP_MODE.PUBLISHED,
      };

      expect(getApplicationParamsFromUrl(url)).toEqual(expectedParams);
    });

    it("should return null if the path does not match any pattern", () => {
      const url = new URL("https://app.appsmith.com/invalid/path?branch=main");

      expect(getApplicationParamsFromUrl(url)).toBeNull();
    });

    it("should parse deprecated builder path and return correct params", () => {
      const url = new URL(
        `https://app.appsmith.com/applications/${baseApplicationId}/pages/${basePageId}/edit?branch=main`,
      );
      const expectedParams: TApplicationParams = {
        origin: "https://app.appsmith.com",
        basePageId,
        baseApplicationId,
        branchName: "main",
        appMode: APP_MODE.EDIT,
      };

      expect(getApplicationParamsFromUrl(url)).toEqual(expectedParams);
    });

    it("should parse deprecated viewer path and return correct params", () => {
      const url = new URL(
        `https://app.appsmith.com/applications/${baseApplicationId}/pages/${basePageId}?branch=main`,
      );
      const expectedParams: TApplicationParams = {
        origin: "https://app.appsmith.com",
        basePageId,
        baseApplicationId,
        branchName: "main",
        appMode: APP_MODE.PUBLISHED,
      };

      expect(getApplicationParamsFromUrl(url)).toEqual(expectedParams);
    });

    it("should parse custom builder path and return correct params", () => {
      const url = new URL(
        `https://app.appsmith.com/app/custom-app-${basePageId}/edit?branch=main`,
      );
      const expectedParams: TApplicationParams = {
        origin: "https://app.appsmith.com",
        basePageId,
        baseApplicationId: undefined,
        branchName: "main",
        appMode: APP_MODE.EDIT,
      };

      expect(getApplicationParamsFromUrl(url)).toEqual(expectedParams);
    });

    it("should parse custom viewer path and return correct params", () => {
      const url = new URL(
        `https://app.appsmith.com/app/custom-app-${basePageId}?branch=main`,
      );
      const expectedParams: TApplicationParams = {
        origin: "https://app.appsmith.com",
        basePageId,
        baseApplicationId: undefined,
        branchName: "main",
        appMode: APP_MODE.PUBLISHED,
      };

      expect(getApplicationParamsFromUrl(url)).toEqual(expectedParams);
    });

    it("should parse URL and return params with empty branch name if branch query param is not present", () => {
      const url = new URL(
        `https://app.appsmith.com/app/my-app/page-${basePageId}/edit`,
      );
      const expectedParams: TApplicationParams = {
        origin: "https://app.appsmith.com",
        applicationSlug: "my-app",
        basePageId,
        baseApplicationId: undefined,
        branchName: "",
        appMode: APP_MODE.EDIT,
      };

      expect(getApplicationParamsFromUrl(url)).toEqual(expectedParams);
    });
  });

  describe("getConsolidatedApiPrefetchRequest", () => {
    beforeAll(() => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).Request = NFRequest;
    });

    it("should return null if basePageId is not provided", () => {
      const params: TApplicationParams = {
        origin: "https://app.appsmith.com",
        branchName: "main",
        appMode: APP_MODE.EDIT,
      };

      expect(getConsolidatedApiPrefetchRequest(params)).toBeNull();
    });

    it("should create request for EDIT mode with applicationId", () => {
      const params: TApplicationParams = {
        origin: "https://app.appsmith.com",
        basePageId,
        baseApplicationId,
        branchName: "main",
        appMode: APP_MODE.EDIT,
      };

      const request = getConsolidatedApiPrefetchRequest(params);

      expect(request).toBeInstanceOf(Request);
      expect(request?.url).toBe(
        `https://app.appsmith.com/api/v1/consolidated-api/edit?defaultPageId=${basePageId}&applicationId=${baseApplicationId}&branchName=${params.branchName}`,
      );
      expect(request?.method).toBe("GET");
    });

    it("should create request for PUBLISHED mode with applicationId", () => {
      const params: TApplicationParams = {
        origin: "https://app.appsmith.com",
        basePageId,
        baseApplicationId,
        branchName: "main",
        appMode: APP_MODE.PUBLISHED,
      };

      const request = getConsolidatedApiPrefetchRequest(params);

      expect(request).toBeInstanceOf(Request);
      expect(request?.url).toBe(
        `https://app.appsmith.com/api/v1/consolidated-api/view?defaultPageId=${basePageId}&applicationId=${baseApplicationId}&branchName=${params.branchName}`,
      );
      expect(request?.method).toBe("GET");
    });

    it("should create request for EDIT mode without applicationId", () => {
      const params: TApplicationParams = {
        origin: "https://app.appsmith.com",
        basePageId: "page123",
        branchName: "main",
        appMode: APP_MODE.EDIT,
      };

      const request = getConsolidatedApiPrefetchRequest(params);

      expect(request).toBeInstanceOf(Request);
      expect(request?.url).toBe(
        `https://app.appsmith.com/api/v1/consolidated-api/edit?defaultPageId=${params.basePageId}&branchName=${params.branchName}`,
      );
      expect(request?.method).toBe("GET");
    });

    it("should create request for PUBLISHED mode without applicationId", () => {
      const params: TApplicationParams = {
        origin: "https://app.appsmith.com",
        basePageId: "page123",
        branchName: "main",
        appMode: APP_MODE.PUBLISHED,
      };

      const request = getConsolidatedApiPrefetchRequest(params);

      expect(request).toBeInstanceOf(Request);
      expect(request?.url).toBe(
        `https://app.appsmith.com/api/v1/consolidated-api/view?defaultPageId=${params.basePageId}&branchName=${params.branchName}`,
      );
      expect(request?.method).toBe("GET");
    });

    it("should return null for an unknown app mode", () => {
      const params: TApplicationParams = {
        origin: "https://app.appsmith.com",
        basePageId: "page123",
        branchName: "main",
        appMode: "UNKNOWN" as APP_MODE,
      };

      expect(getConsolidatedApiPrefetchRequest(params)).toBeNull();
    });
  });

  describe("getPrefetchRequests", () => {
    it("should return prefetch requests with consolidated api request", () => {
      const params: TApplicationParams = {
        origin: "https://app.appsmith.com",
        branchName: "main",
        appMode: APP_MODE.EDIT,
        basePageId: "page123",
      };
      const requests = getPrefetchRequests(params);

      expect(requests).toHaveLength(1);
      const [consolidatedAPIRequest] = requests;

      expect(consolidatedAPIRequest).toBeInstanceOf(Request);
      expect(consolidatedAPIRequest?.url).toBe(
        `https://app.appsmith.com/api/v1/consolidated-api/edit?defaultPageId=${params.basePageId}&branchName=${params.branchName}`,
      );
      expect(consolidatedAPIRequest?.method).toBe("GET");
    });
  });

  describe("PrefetchApiService", () => {
    let prefetchApiService: PrefetchApiService;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockCache: any;

    beforeEach(() => {
      prefetchApiService = new PrefetchApiService();
      mockCache = {
        put: jest.fn(),
        match: jest.fn(),
        delete: jest.fn(),
      };
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).caches.open.mockResolvedValue(mockCache);
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).Request = NFRequest;
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).Response = NFResponse;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("getRequestKey", () => {
      it("should return the correct request key", () => {
        const url =
          "https://app.appsmith.com/api/v1/consolidated-api/edit?defaultPageId=page123&applicationId=app123&branchName=main";
        const method = "GET";
        const request = new Request(url, {
          method,
        });

        const key = prefetchApiService.getRequestKey(request);

        expect(key).toBe(`${method}:${url}`);
      });
    });

    describe("aqcuireFetchMutex", () => {
      it("should acquire a new mutex if not present", async () => {
        const request = new Request("https://app.appsmith.com", {
          method: "GET",
        });
        const acquireSpy = jest.spyOn(Mutex.prototype, "acquire");

        await prefetchApiService.aqcuireFetchMutex(request);
        expect(acquireSpy).toHaveBeenCalled();
      });

      it("should reuse existing mutex if present", async () => {
        const request = new Request("https://app.appsmith.com", {
          method: "GET",
        });
        const mutex = new Mutex();

        prefetchApiService.prefetchFetchMutexMap.set(
          prefetchApiService.getRequestKey(request),
          mutex,
        );
        const acquireSpy = jest.spyOn(mutex, "acquire");

        await prefetchApiService.aqcuireFetchMutex(request);
        expect(acquireSpy).toHaveBeenCalled();
      });
    });

    describe("waitForUnlock", () => {
      it("should wait for the mutex to unlock if it exists", async () => {
        const request = new Request("https://app.appsmith.com", {
          method: "GET",
        });
        const mutex = new Mutex();

        prefetchApiService.prefetchFetchMutexMap.set(
          prefetchApiService.getRequestKey(request),
          mutex,
        );
        const waitForUnlockSpy = jest.spyOn(mutex, "waitForUnlock");

        await prefetchApiService.waitForUnlock(request);
        expect(waitForUnlockSpy).toHaveBeenCalled();
      });

      it("should do nothing if the mutex does not exist", async () => {
        const request = new Request("https://app.appsmith.com", {
          method: "GET",
        });

        await expect(
          prefetchApiService.waitForUnlock(request),
        ).resolves.not.toThrow();
      });
    });

    describe("releaseFetchMutex", () => {
      it("should release the mutex if it exists", () => {
        const request = new Request("https://app.appsmith.com", {
          method: "GET",
        });
        const mutex = new Mutex();

        prefetchApiService.prefetchFetchMutexMap.set(
          prefetchApiService.getRequestKey(request),
          mutex,
        );
        const releaseSpy = jest.spyOn(mutex, "release");

        prefetchApiService.releaseFetchMutex(request);
        expect(releaseSpy).toHaveBeenCalled();
      });

      it("should do nothing if the mutex does not exist", () => {
        const request = new Request("https://app.appsmith.com", {
          method: "GET",
        });

        expect(() =>
          prefetchApiService.releaseFetchMutex(request),
        ).not.toThrow();
      });
    });

    describe("cacheApi", () => {
      it("should acquire the mutex, fetch the request, cache the response, and release the mutex", async () => {
        const request = new Request("https://app.appsmith.com/sdfsdf", {
          method: "GET",
        });
        const response = new Response("Test response", {
          status: 200,
          statusText: "OK",
        });

        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).fetch.mockResolvedValue(response);

        const acquireSpy = jest.spyOn(Mutex.prototype, "acquire");
        const releaseSpy = jest.spyOn(Mutex.prototype, "release");

        await prefetchApiService.cacheApi(request);

        expect(acquireSpy).toHaveBeenCalled();
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((global as any).fetch).toHaveBeenCalledWith(request);
        expect(mockCache.put).toHaveBeenCalledWith(
          request,
          expect.objectContaining({
            status: 200,
            statusText: "OK",
          }),
        );
        expect(releaseSpy).toHaveBeenCalled();
      });

      it("should delete the cache and release the mutex if fetch fails", async () => {
        const request = new Request("https://app.appsmith.com", {
          method: "GET",
        });

        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).fetch.mockRejectedValue(new Error("Fetch error"));

        const acquireSpy = jest.spyOn(Mutex.prototype, "acquire");
        const releaseSpy = jest.spyOn(Mutex.prototype, "release");

        await prefetchApiService.cacheApi(request);

        expect(acquireSpy).toHaveBeenCalled();
        expect(mockCache.delete).toHaveBeenCalledWith(request);
        expect(releaseSpy).toHaveBeenCalled();
      });
    });

    describe("getCachedResponse", () => {
      it("should wait for the mutex to unlock, get the cached response if valid, and delete it afterwards", async () => {
        const request = new Request("https://app.appsmith.com", {
          method: "GET",
        });
        const response = new Response("test response", {
          headers: { date: new Date(Date.now() - 1000).toUTCString() },
        });

        mockCache.match.mockResolvedValue(response);
        const mutex = new Mutex();

        prefetchApiService.prefetchFetchMutexMap.set(
          prefetchApiService.getRequestKey(request),
          mutex,
        );
        const waitForUnlockSpy = jest.spyOn(Mutex.prototype, "waitForUnlock");

        const cachedResponse =
          await prefetchApiService.getCachedResponse(request);

        expect(waitForUnlockSpy).toHaveBeenCalled();
        expect(mockCache.match).toHaveBeenCalledWith(request);
        expect(mockCache.delete).toHaveBeenCalledWith(request);
        expect(cachedResponse).toBe(response);
      });

      it("should return null if the cache is invalid", async () => {
        const request = new Request("https://app.appsmith.com", {
          method: "GET",
        });
        const response = new Response("test response", {
          headers: { date: new Date(Date.now() - 3 * 60 * 1000).toUTCString() },
        });

        mockCache.match.mockResolvedValue(response);

        const cachedResponse =
          await prefetchApiService.getCachedResponse(request);

        expect(mockCache.match).toHaveBeenCalledWith(request);
        expect(mockCache.delete).toHaveBeenCalledWith(request);
        expect(cachedResponse).toBeNull();
      });

      it("should return null if there is no cached response", async () => {
        const request = new Request("https://app.appsmith.com", {
          method: "GET",
        });

        mockCache.match.mockResolvedValue(null);

        const cachedResponse =
          await prefetchApiService.getCachedResponse(request);

        expect(mockCache.match).toHaveBeenCalledWith(request);
        expect(cachedResponse).toBeNull();
      });
    });
  });
});
