import { APP_MODE } from "entities/App";
import localforage from "localforage";
import isNull from "lodash/isNull";
import loglevel from "loglevel";
import { EComputationCacheName } from "./types";

interface ICachedData<T> {
  value: T;
  timestamp: string;
}

interface ICacheLog {
  lastAccessedAt: number;
  createdAt: number | null;
}

class AppComputationCache {
  // Singleton instance
  private static instance: AppComputationCache | null = null;
  // The name of the item in the cache store that stores cache event logs
  private static CACHE_EVENT_ITEM_NAME = "cacheEventLog";

  // The cache store for computation results
  private readonly store = localforage.createInstance({
    name: "AppComputationCache",
    storeName: "cachedResults",
  });

  // The cache store for cache event logs
  private readonly cacheLogsStore = localforage.createInstance({
    name: "AppComputationCache",
    storeName: "cacheMetadataStore",
  });

  // The app mode configuration for each cache type. This determines which app modes
  // the cache should be enabled for
  private readonly appModeConfig = {
    [EComputationCacheName.DEPENDENCY_MAP]: [APP_MODE.PUBLISHED],
    [EComputationCacheName.ALL_KEYS]: [APP_MODE.PUBLISHED],
  };

  static getInstance(): AppComputationCache {
    if (!AppComputationCache.instance) {
      AppComputationCache.instance = new AppComputationCache();
    }
    return AppComputationCache.instance;
  }

  /**
   * Check if the computation result should be cached based on the app mode configuration
   * @param cacheName - The name of the cache
   * @param appMode - The app mode for which the cache should be enabled
   * @returns - A boolean indicating whether the cache should be enabled for the given app mode
   */
  isComputationCached({
    appMode,
    cacheName,
  }: {
    cacheName: EComputationCacheName;
    appMode?: APP_MODE;
  }) {
    if (!appMode) {
      return false;
    }

    return this.appModeConfig[cacheName].includes(appMode);
  }

  /**
   * Checks if the value should be cached based on the app mode configuration and
   * caches the computation result if it should be cached. It also tracks the cache usage
   * @param appId - The id of the app
   * @param appMode - The app mode for which the cache should be enabled
   * @param cacheName - The name of the cache
   * @param computationResult - The result of the computation
   * @param pageId - The id of the page
   * @param timestamp - The timestamp of the computation
   * @returns - A promise that resolves when the computation result is cached
   * @throws - Logs an error if the computation result cannot be cached
   */
  async cacheComputationResult<T>({
    appId,
    appMode,
    cacheName,
    computationResult,
    pageId,
    timestamp,
  }: {
    appId: string;
    cacheName: EComputationCacheName;
    computationResult: T;
    pageId: string;
    timestamp: string;
    appMode?: APP_MODE;
  }) {
    const shouldCache = this.isComputationCached({
      cacheName,
      appMode,
    });

    if (!shouldCache || !appMode) {
      return;
    }

    const cacheKey = this.generateCacheKey([appId, pageId, appMode, cacheName]);

    try {
      await this.store.setItem<ICachedData<T>>(cacheKey, {
        value: computationResult,
        timestamp,
      });

      await this.trackCacheUsage(cacheKey, true);
    } catch (error) {
      loglevel.debug("Error caching computation result:", error);
    }
  }

  /**
   * Gets the cached computation result if it exists and is valid
   * @param appId - The id of the app
   * @param appMode - The app mode for which the cache should be enabled
   * @param cacheName - The name of the cache
   * @param pageId - The id of the page
   * @param timestamp - The timestamp of the computation
   * @returns - A promise that resolves with the cached computation result if it exists and is valid
   * @throws - Returns null if the cached computation result does not exist or is invalid
   */
  async getCachedComputationResult<T>({
    appId,
    appMode,
    cacheName,
    pageId,
    timestamp,
  }: {
    appId: string;
    cacheName: EComputationCacheName;
    pageId: string;
    timestamp: string;
    appMode?: APP_MODE;
  }): Promise<T | null> {
    if (!appMode) {
      return null;
    }

    const shouldCache = this.isComputationCached({
      cacheName,
      appMode,
    });

    if (!shouldCache) {
      return null;
    }

    const cacheKey = this.generateCacheKey([appId, pageId, appMode, cacheName]);

    try {
      const cached = await this.store.getItem<ICachedData<T>>(cacheKey);
      if (isNull(cached)) {
        return null;
      }

      if (cached.timestamp !== timestamp) {
        await this.store.removeItem(cacheKey);
        return null;
      }

      await this.trackCacheUsage(cacheKey);

      return cached.value;
    } catch (error) {
      loglevel.error("Error getting cache result:", error);
      return null;
    }
  }

  /**
   * Generates a cache key from the index parts
   * @param indexParts - The parts of the cache index
   * @returns - The generated cache key
   */
  generateCacheKey(indexParts: string[]) {
    return indexParts.join("_");
  }

  /**
   * Fetches the computation result from the cache or computes it if it does not exist
   * @param appId - The id of the app
   * @param appMode - The app mode for which the cache should be enabled
   * @param cacheName - The name of the cache
   * @param computeFn - The function to compute the result
   * @param pageId - The id of the page
   * @param timestamp - The timestamp of the computation
   * @returns - A promise that resolves with the computation result
   * @throws - Logs an error if the computation result cannot be fetched or computed and returns the computed fallback result
   */
  async fetchOrCompute<T>({
    appId,
    appMode,
    cacheName,
    computeFn,
    pageId,
    timestamp,
  }: {
    appId: string;
    appMode?: APP_MODE;
    timestamp: string;
    pageId: string;
    computeFn: () => Promise<T> | T;
    cacheName: EComputationCacheName;
  }) {
    try {
      const cachedResult = await this.getCachedComputationResult<T>({
        appId,
        timestamp,
        pageId,
        appMode,
        cacheName,
      });

      if (cachedResult) {
        return cachedResult;
      }

      const shouldCache = this.isComputationCached({
        cacheName,
        appMode,
      });

      if (!shouldCache || !appMode) {
        return computeFn();
      }

      const computationResult = await computeFn();

      await this.cacheComputationResult({
        appId,
        timestamp,
        pageId,
        appMode,
        computationResult,
        cacheName,
      });

      return computationResult;
    } catch (error) {
      loglevel.error("Error getting cache result:", error);

      const fallbackResult = await computeFn();
      return fallbackResult;
    }
  }

  /**
   * Tracks the cache usage by updating the last accessed timestamp of the cache
   * @param name - The name of the cache
   * @param isNew - A boolean indicating whether the cache is new
   * @returns - A promise that resolves when the cache usage is tracked
   * @throws - Logs an error if the cache usage cannot be tracked
   */
  async trackCacheUsage(name: string, isNew: boolean = false) {
    try {
      const currentLogs = await this.cacheLogsStore.getItem<
        Record<string, ICacheLog>
      >(AppComputationCache.CACHE_EVENT_ITEM_NAME);

      const logEntry = currentLogs?.[name] || {
        createdAt: isNew ? Date.now() : null,
      };

      await this.cacheLogsStore.setItem(
        AppComputationCache.CACHE_EVENT_ITEM_NAME,
        {
          ...(currentLogs || {}),
          [name]: {
            ...logEntry,
            lastAccessedAt: Date.now(),
            createdAt: logEntry.createdAt || Date.now(),
          },
        },
      );
    } catch (error) {
      loglevel.error("Error tracking cache usage:", error);
    }
  }
}

export const appComputationCache = AppComputationCache.getInstance();

export default appComputationCache;
