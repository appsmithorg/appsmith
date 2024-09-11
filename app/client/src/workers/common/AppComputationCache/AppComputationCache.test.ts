import { appComputationCache } from "./index";
import { EComputationCacheName } from "./types";
import { APP_MODE } from "entities/App";
import localforage from "localforage";

jest.useFakeTimers();
const setItemMock = jest.fn();
const getItemMock = jest.fn();
const getKeysMock = jest.fn();
const removeItemMock = jest.fn();

// Override the localforage driver to mock the local storage
// localforage defaults to LOCALSTORAGE driver in jest environment
localforage.defineDriver({
  _driver: localforage.LOCALSTORAGE,
  _initStorage: jest.fn(),

  keys: getKeysMock,
  getItem: getItemMock,
  setItem: setItemMock,
  removeItem: removeItemMock,

  iterate: jest.fn(),
  key: jest.fn(),
  length: jest.fn(),
  clear: jest.fn(),
});

describe("AppComputationCache", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateCacheKey", () => {
    test("should generate the cache key", async () => {
      const cacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        workspaceId: "workspaceId",
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const cacheKey = await appComputationCache.generateCacheKey({
        cacheName,
        cacheProps,
      });

      expect(cacheKey).toBe(
        `${cacheProps.instanceId}>${cacheProps.workspaceId}>${cacheProps.appId}>${cacheProps.pageId}>${cacheProps.appMode}>${new Date(cacheProps.timestamp).getTime()}>${cacheName}`,
      );
    });
  });

  describe("isComputationCached", () => {
    test("should return false for EDIT mode", async () => {
      const cacheProps = {
        appMode: APP_MODE.EDIT,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        workspaceId: "workspaceId",
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const result = await appComputationCache.isComputationCached({
        cacheName,
        cacheProps,
      });

      expect(result).toBe(false);
    });

    test("should return true for PUBLISHED mode", async () => {
      const cacheProps = {
        appMode: APP_MODE.PUBLISHED,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        workspaceId: "workspaceId",
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const result = await appComputationCache.isComputationCached({
        cacheName,
        cacheProps,
      });

      expect(result).toBe(true);
    });

    test("should return false if appMode is undefined", async () => {
      const cacheProps = {
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        workspaceId: "workspaceId",
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const result = await appComputationCache.isComputationCached({
        cacheName,
        cacheProps,
      });

      expect(result).toBe(false);
    });

    test("should return false if timestamp is undefined", async () => {
      const cacheProps = {
        timestamp: "",
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        workspaceId: "workspaceId",
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const result = await appComputationCache.isComputationCached({
        cacheName,
        cacheProps,
      });

      expect(result).toBe(false);
    });

    test("should return null if cache is disabled", async () => {
      const cacheProps = {
        appMode: APP_MODE.EDIT,
        timestamp: new Date("11 September 2024").toISOString(),
        appId: "appId",
        instanceId: "instanceId",
        pageId: "pageId",
        workspaceId: "workspaceId",
      };

      const cacheName = EComputationCacheName.ALL_KEYS;

      const result = await appComputationCache.isComputationCached({
        cacheName,
        cacheProps,
      });

      expect(result).toBe(false);
    });
  });

  test("should call getItemMock and return null if cache miss", async () => {
    const cacheProps = {
      appMode: APP_MODE.PUBLISHED,
      timestamp: new Date("11 September 2024").toISOString(),
      appId: "appId",
      instanceId: "instanceId",
      pageId: "pageId",
      workspaceId: "workspaceId",
    };

    const cacheName = EComputationCacheName.ALL_KEYS;

    const cacheKey = await appComputationCache.generateCacheKey({
      cacheName,
      cacheProps,
    });

    getItemMock.mockResolvedValue(null);
    getKeysMock.mockResolvedValue([]);

    const result = await appComputationCache.getCachedComputationResult({
      cacheName,
      cacheProps,
    });

    expect(getItemMock).toHaveBeenCalledWith(cacheKey);
    expect(result).toBe(null);

    jest.advanceTimersByTime(10000);

    expect(getKeysMock).toHaveBeenCalledTimes(1);
  });

  test("should call deleteInvalidCacheEntries on cache miss after 10 seconds", async () => {
    const cacheProps = {
      appMode: APP_MODE.PUBLISHED,
      timestamp: new Date("11 September 2024").toISOString(),
      appId: "appId",
      instanceId: "instanceId",
      pageId: "pageId",
      workspaceId: "workspaceId",
    };

    const cacheName = EComputationCacheName.ALL_KEYS;

    const cacheKey = await appComputationCache.generateCacheKey({
      cacheName,
      cacheProps,
    });

    getItemMock.mockResolvedValue(null);
    getKeysMock.mockResolvedValue([]);

    const result = await appComputationCache.getCachedComputationResult({
      cacheName,
      cacheProps,
    });

    expect(getItemMock).toHaveBeenCalledWith(cacheKey);
    expect(result).toBe(null);

    jest.advanceTimersByTime(5000);
    expect(getKeysMock).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(5000);
    jest.runAllTimers();

    expect(getKeysMock).toHaveBeenCalledTimes(1);
  });

  test("should call getItemMock and return cached value if cache hit", async () => {
    const cacheProps = {
      appMode: APP_MODE.PUBLISHED,
      timestamp: new Date("11 September 2024").toISOString(),
      appId: "appId",
      instanceId: "instanceId",
      pageId: "pageId",
      workspaceId: "workspaceId",
    };

    const cacheName = EComputationCacheName.ALL_KEYS;

    const cacheKey = await appComputationCache.generateCacheKey({
      cacheName,
      cacheProps,
    });

    getItemMock.mockResolvedValue({ value: "cachedValue" });

    const result = await appComputationCache.getCachedComputationResult({
      cacheName,
      cacheProps,
    });

    expect(getItemMock).toHaveBeenCalledWith(cacheKey);
    expect(result).toBe("cachedValue");
  });
});
