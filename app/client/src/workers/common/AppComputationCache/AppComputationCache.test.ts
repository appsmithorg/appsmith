import {
  EComputationCacheName,
  type ICacheProps,
  type IValidatedCacheProps,
} from "./types";
import { APP_MODE } from "entities/App";
import localforage from "localforage";
import loglevel from "loglevel";
import { AppComputationCache } from "./index";
import { WorkerEnv } from "workers/Evaluation/handlers/workerEnv";
import type { FeatureFlags } from "ee/entities/FeatureFlag";

jest.useFakeTimers();

// Mock functions for the main store
const setItemMock = jest.fn();
const getItemMock = jest.fn();
const keysMock = jest.fn();
const removeItemMock = jest.fn();

// Mock functions for the cache logs store
const setItemMockLogs = jest.fn();
const getItemMockLogs = jest.fn();
const keysMockLogs = jest.fn();
const removeItemMockLogs = jest.fn();

// Override the localforage driver to mock the local storage
localforage.defineDriver({
  _driver: localforage.LOCALSTORAGE,
  _initStorage: jest.fn(),

  // These methods will be used by the instances created in AppComputationCache
  keys: keysMock,
  getItem: getItemMock,
  setItem: setItemMock,
  removeItem: removeItemMock,

  iterate: jest.fn(),
  key: jest.fn(),
  length: jest.fn(),
  clear: jest.fn(),
});

// Mock localforage.createInstance to return our mocks
jest.spyOn(localforage, "createInstance").mockImplementation((options) => {
  if (options.storeName === "cachedResults") {
    return {
      ...localforage,
      setItem: setItemMock,
      getItem: getItemMock,
      keys: keysMock,
      removeItem: removeItemMock,
    };
  } else if (options.storeName === "cacheMetadataStore") {
    return {
      ...localforage,
      setItem: setItemMockLogs,
      getItem: getItemMockLogs,
      keys: keysMockLogs,
      removeItem: removeItemMockLogs,
    };
  } else {
    throw new Error("Unknown store");
  }
});

describe("AppComputationCache", () => {
  let appComputationCache: AppComputationCache;

  beforeEach(() => {
    jest.clearAllMocks();
    AppComputationCache.resetInstance();
    WorkerEnv.setFeatureFlags({
      release_computation_cache_enabled: true,
    } as FeatureFlags);

    // Now instantiate the singleton after mocks are set up
    appComputationCache = AppComputationCache.getInstance();
  });

  describe("generateCacheKey", () => {
    test("should generate the correct cache key", () => {
      const cacheProps: IValidatedCacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const cacheKey = appComputationCache.generateCacheKey({
        cacheName,
        cacheProps,
      });

      expect(cacheKey).toBe(
        `${cacheProps.instanceId}>${cacheProps.appId}>${cacheProps.pageId}>${cacheProps.appMode}>${new Date(
          cacheProps.timestamp,
        ).getTime()}>${cacheName}`,
      );
    });
  });

  describe("isComputationCached", () => {
    test("should return false for EDIT mode", () => {
      const cacheProps: ICacheProps = {
        appMode: APP_MODE.EDIT,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const result = appComputationCache.shouldComputationBeCached(
        cacheName,
        cacheProps,
      );

      expect(result).toBe(false);
    });

    test("should return true for PUBLISHED mode", () => {
      const cacheProps: ICacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const result = appComputationCache.shouldComputationBeCached(
        cacheName,
        cacheProps,
      );

      expect(result).toBe(true);
    });

    test("should return false if appMode is undefined", () => {
      const cacheProps: ICacheProps = {
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const result = appComputationCache.shouldComputationBeCached(
        cacheName,
        cacheProps,
      );

      expect(result).toBe(false);
    });

    test("should return false if timestamp is undefined", () => {
      const cacheProps: ICacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: "",
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const result = appComputationCache.shouldComputationBeCached(
        cacheName,
        cacheProps,
      );

      expect(result).toBe(false);
    });

    test("should return false if dslVersion is undefined", () => {
      const cacheProps: ICacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: null,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const result = appComputationCache.shouldComputationBeCached(
        cacheName,
        cacheProps,
      );

      expect(result).toBe(false);
    });
  });

  describe("getCachedComputationResult", () => {
    test("should call getItemMock and return null if cache miss", async () => {
      const cacheProps: IValidatedCacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const cacheKey = appComputationCache.generateCacheKey({
        cacheName,
        cacheProps,
      });

      getItemMock.mockResolvedValue(null);
      keysMock.mockResolvedValue([]);

      const result = await appComputationCache.getCachedComputationResult({
        cacheName,
        cacheProps,
      });

      expect(getItemMock).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(null);

      jest.advanceTimersByTime(5000);

      expect(keysMock).toHaveBeenCalledTimes(1);
    });

    test("should call deleteInvalidCacheEntries on cache miss after 10 seconds", async () => {
      const cacheProps: IValidatedCacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const cacheKey = appComputationCache.generateCacheKey({
        cacheName,
        cacheProps,
      });

      getItemMock.mockResolvedValue(null);
      keysMock.mockResolvedValue([]);

      const result = await appComputationCache.getCachedComputationResult({
        cacheName,
        cacheProps,
      });

      expect(getItemMock).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(null);

      jest.advanceTimersByTime(2500);
      expect(keysMock).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(2500);
      jest.runAllTimers();

      expect(keysMock).toHaveBeenCalledTimes(1);
    });

    test("should call deleteInvalidCacheEntries on dsl version mismatch after 10 seconds", async () => {
      const cacheProps: IValidatedCacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 2,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const cacheKey = appComputationCache.generateCacheKey({
        cacheName,
        cacheProps,
      });

      getItemMock.mockResolvedValue({ value: "cachedValue", dslVersion: 1 });

      const result = await appComputationCache.getCachedComputationResult({
        cacheName,
        cacheProps,
      });

      expect(getItemMock).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(null);

      jest.advanceTimersByTime(2500);
      expect(keysMock).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(2500);
      jest.runAllTimers();

      expect(keysMock).toHaveBeenCalledTimes(1);
    });

    test("should call getItemMock and return cached value if cache hit", async () => {
      const cacheProps: IValidatedCacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const cacheKey = appComputationCache.generateCacheKey({
        cacheName,
        cacheProps,
      });

      getItemMock.mockResolvedValue({ value: "cachedValue", dslVersion: 1 });

      const result = await appComputationCache.getCachedComputationResult({
        cacheName,
        cacheProps,
      });

      expect(getItemMock).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe("cachedValue");
    });
  });

  describe("cacheComputationResult", () => {
    test("should store computation result and call trackCacheUsage when shouldCache is true", async () => {
      const cacheProps: IValidatedCacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const cacheKey = appComputationCache.generateCacheKey({
        cacheName,
        cacheProps,
      });

      const computationResult = "computedValue";

      const trackCacheUsageSpy = jest.spyOn(
        appComputationCache,
        "trackCacheUsage",
      );

      await appComputationCache.cacheComputationResult({
        cacheName,
        cacheProps,
        computationResult,
      });

      expect(setItemMock).toHaveBeenCalledWith(cacheKey, {
        value: computationResult,
        dslVersion: 1,
      });
      expect(trackCacheUsageSpy).toHaveBeenCalledWith(cacheKey);

      trackCacheUsageSpy.mockRestore();
    });

    test("should not store computation result when shouldCache is false", async () => {
      const cacheProps: ICacheProps = {
        appMode: APP_MODE.EDIT,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const computationResult = "computedValue";

      await appComputationCache.cacheComputationResult({
        cacheName,
        cacheProps,
        computationResult,
      });

      expect(setItemMock).not.toHaveBeenCalled();
    });

    test("should not store computation result when dsl version is invalid", async () => {
      const cacheProps: ICacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: null,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const computationResult = "computedValue";

      await appComputationCache.cacheComputationResult({
        cacheName,
        cacheProps,
        computationResult,
      });

      expect(setItemMock).not.toHaveBeenCalled();
    });
  });

  describe("fetchOrCompute", () => {
    test("should return cached result if available", async () => {
      const cacheProps: IValidatedCacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const cacheKey = appComputationCache.generateCacheKey({
        cacheName,
        cacheProps,
      });

      getItemMock.mockResolvedValue({ value: "cachedValue", dslVersion: 1 });

      const computeFn = jest.fn(() => "computedValue");

      const result = await appComputationCache.fetchOrCompute({
        cacheName,
        cacheProps,
        computeFn,
      });

      expect(getItemMock).toHaveBeenCalledWith(cacheKey);
      expect(computeFn).not.toHaveBeenCalled();
      expect(result).toBe("cachedValue");
    });

    test("should compute, cache, and return result if not in cache", async () => {
      getItemMock.mockResolvedValue(null);

      const cacheProps: IValidatedCacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const cacheKey = appComputationCache.generateCacheKey({
        cacheName,
        cacheProps,
      });

      const computationResult = "computedValue";

      const computeFn = jest.fn(() => computationResult);

      const cacheComputationResultSpy = jest.spyOn(
        appComputationCache,
        "cacheComputationResult",
      );

      const result = await appComputationCache.fetchOrCompute({
        cacheName,
        cacheProps,
        computeFn,
      });

      expect(getItemMock).toHaveBeenCalledWith(cacheKey);
      expect(computeFn).toHaveBeenCalled();
      expect(cacheComputationResultSpy).toHaveBeenCalledWith({
        cacheName,
        cacheProps,
        computationResult,
      });
      expect(result).toBe(computationResult);

      cacheComputationResultSpy.mockRestore();
    });

    test("should handle cache errors and compute result", async () => {
      getItemMock.mockRejectedValue(new Error("Cache access error"));

      const defaultLogLevel = loglevel.getLevel();

      loglevel.setLevel("SILENT");

      const cacheProps: IValidatedCacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const computationResult = "computedValue";

      const computeFn = jest.fn(() => computationResult);

      try {
        await appComputationCache.fetchOrCompute({
          cacheName,
          cacheProps,
          computeFn,
        });
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Cache access error");
      }

      loglevel.setLevel(defaultLogLevel);
    });

    test("should not cache result when dsl version is invalid", async () => {
      const cacheProps: ICacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: null,
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const computationResult = "computedValue";

      await appComputationCache.cacheComputationResult({
        cacheName,
        cacheProps,
        computationResult,
      });

      expect(setItemMock).not.toHaveBeenCalled();
    });
  });

  describe("deleteInvalidCacheEntries", () => {
    test("should delete old cache entries", async () => {
      const cacheProps: IValidatedCacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        dslVersion: 1,
      };

      const currentTimestamp = new Date(cacheProps.timestamp).getTime();

      const currentCacheKey = [
        cacheProps.instanceId,
        cacheProps.appId,
        cacheProps.pageId,
        cacheProps.appMode,
        currentTimestamp,
        EComputationCacheName.ALL_KEYS,
      ].join(">");

      const oldTimestamp = new Date("10 September 2024").getTime();

      const oldCacheKey = [
        cacheProps.instanceId,
        cacheProps.appId,
        cacheProps.pageId,
        cacheProps.appMode,
        oldTimestamp,
        EComputationCacheName.ALL_KEYS,
      ].join(">");

      keysMock.mockResolvedValue([currentCacheKey, oldCacheKey]);

      await appComputationCache.deleteInvalidCacheEntries(cacheProps);

      expect(keysMock).toHaveBeenCalled();

      expect(removeItemMock).toHaveBeenCalledWith(oldCacheKey);
      expect(removeItemMock).not.toHaveBeenCalledWith(currentCacheKey);
    });
  });

  describe("trackCacheUsage", () => {
    test("should update cache log", async () => {
      const cacheKey = "someCacheKey";

      const existingCacheLog = {
        lastAccessedAt: Date.now() - 1000,
        createdAt: Date.now() - 2000,
      };

      getItemMockLogs.mockResolvedValue(existingCacheLog);

      await appComputationCache.trackCacheUsage(cacheKey);

      expect(getItemMockLogs).toHaveBeenCalledWith(cacheKey);

      expect(setItemMockLogs).toHaveBeenCalledWith(cacheKey, {
        lastAccessedAt: expect.any(Number),
        createdAt: existingCacheLog.createdAt,
      });
    });
  });

  describe("isAppModeValid", () => {
    test("should return true for valid app modes", () => {
      expect(appComputationCache.isAppModeValid(APP_MODE.PUBLISHED)).toBe(true);
      expect(appComputationCache.isAppModeValid(APP_MODE.EDIT)).toBe(true);
    });

    test("should return false for invalid app modes", () => {
      expect(appComputationCache.isAppModeValid(undefined)).toBe(false);
      expect(appComputationCache.isAppModeValid(null)).toBe(false);
      expect(appComputationCache.isAppModeValid("invalid")).toBe(false);
    });
  });

  describe("isTimestampValid", () => {
    test("should return true for valid timestamps", () => {
      const validTimestamp = new Date().toISOString();

      expect(appComputationCache.isTimestampValid(validTimestamp)).toBe(true);
    });

    test("should return false for invalid timestamps", () => {
      expect(appComputationCache.isTimestampValid(undefined)).toBe(false);
      expect(appComputationCache.isTimestampValid(null)).toBe(false);
      expect(appComputationCache.isTimestampValid("invalid")).toBe(false);
      expect(appComputationCache.isTimestampValid("2024-01-01")).toBe(false);
      expect(appComputationCache.isTimestampValid("2024-01-01T00")).toBe(false);
      expect(appComputationCache.isTimestampValid("2024-01-01T00:00")).toBe(
        false,
      );
      expect(appComputationCache.isTimestampValid("2024-01-01T00:00:00")).toBe(
        false,
      );
      expect(
        appComputationCache.isTimestampValid("2024-01-01T00:00:00.000"),
      ).toBe(false);
    });
  });

  describe("isDSLVersionValid", () => {
    test("should return true for valid dsl versions", () => {
      expect(appComputationCache.isDSLVersionValid(1)).toBe(true);
      expect(appComputationCache.isDSLVersionValid(90)).toBe(true);
    });

    test("should return false for invalid dsl versions", () => {
      expect(appComputationCache.isDSLVersionValid(0)).toBe(false);
      expect(appComputationCache.isDSLVersionValid(null)).toBe(false);
      expect(appComputationCache.isDSLVersionValid("invalid")).toBe(false);
      expect(appComputationCache.isDSLVersionValid(undefined)).toBe(false);
      expect(appComputationCache.isDSLVersionValid(NaN)).toBe(false);
      expect(appComputationCache.isDSLVersionValid(Infinity)).toBe(false);
      expect(appComputationCache.isDSLVersionValid(-1)).toBe(false);
    });
  });

  describe("isCacheValid", () => {
    const cacheProps: IValidatedCacheProps = {
      appMode: APP_MODE.PUBLISHED,
      timestamp: new Date().toISOString(),
      appId: "appId",
      instanceId: "instanceId",
      pageId: "pageId",
      dslVersion: 1,
    };

    test("should return true for valid cache", () => {
      const cachedValue = {
        value: "cachedValue",
        dslVersion: 1,
      };

      expect(appComputationCache.isCacheValid(cachedValue, cacheProps)).toBe(
        true,
      );
    });

    test("should return false null cache", () => {
      expect(appComputationCache.isCacheValid(null, cacheProps)).toBe(false);
    });

    test("should return false if dsl version is not present", () => {
      expect(
        appComputationCache.isCacheValid(
          {
            value: "cachedValue",
          },
          cacheProps,
        ),
      ).toBe(false);
    });

    test("should return false if dsl version mismatch", () => {
      expect(
        appComputationCache.isCacheValid(
          { value: "cachedValue", dslVersion: 2 },
          cacheProps,
        ),
      ).toBe(false);
    });
  });
});
