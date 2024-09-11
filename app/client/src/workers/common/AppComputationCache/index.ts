import { APP_MODE } from "entities/App";
import localforage from "localforage";
import isNull from "lodash/isNull";
import loglevel from "loglevel";
import { EComputationCacheName, type ICacheProps } from "./types";
import debounce from "lodash/debounce";

interface ICachedData<T> {
  value: T;
}

interface ICacheLog {
  lastAccessedAt: number;
  createdAt: number | null;
}

class AppComputationCache {
  // Singleton instance
  private static instance: AppComputationCache | null = null;
  private static CACHE_KEY_DELIMITER = ">";

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

  debouncedDeleteInvalidCacheEntries = debounce(
    this.deleteInvalidCacheEntries,
    10000,
  );

  /**
   * Check if the computation result should be cached based on the app mode configuration
   * @returns - A boolean indicating whether the cache should be enabled for the given app mode
   */
  isComputationCached({
    cacheName,
    cacheProps,
  }: {
    cacheName: EComputationCacheName;
    cacheProps: ICacheProps;
  }) {
    const { appMode, timestamp } = cacheProps;

    if (!appMode || !timestamp) {
      return false;
    }

    return this.appModeConfig[cacheName].includes(appMode);
  }

  /**
   * Checks if the value should be cached based on the app mode configuration and
   * caches the computation result if it should be cached. It also tracks the cache usage
   * @returns - A promise that resolves when the computation result is cached
   */
  async cacheComputationResult<T>({
    cacheName,
    cacheProps,
    computationResult,
  }: {
    cacheProps: ICacheProps;
    cacheName: EComputationCacheName;
    computationResult: T;
  }) {
    const shouldCache = this.isComputationCached({
      cacheName,
      cacheProps,
    });

    if (!shouldCache) {
      return;
    }

    const cacheKey = this.generateCacheKey({ cacheProps, cacheName });

    try {
      await this.store.setItem<ICachedData<T>>(cacheKey, {
        value: computationResult,
      });

      await this.trackCacheUsage(cacheKey);
    } catch (error) {
      loglevel.debug("Error caching computation result:", error);
    }
  }

  /**
   * Gets the cached computation result if it exists and is valid
   * @returns - A promise that resolves with the cached computation result or null if it does not exist
   */
  async getCachedComputationResult<T>({
    cacheName,
    cacheProps,
  }: {
    cacheProps: ICacheProps;
    cacheName: EComputationCacheName;
  }): Promise<T | null> {
    const shouldCache = this.isComputationCached({
      cacheName,
      cacheProps,
    });

    if (!shouldCache) {
      return null;
    }

    const cacheKey = this.generateCacheKey({
      cacheProps,
      cacheName,
    });

    try {
      const cached = await this.store.getItem<ICachedData<T>>(cacheKey);
      if (isNull(cached)) {
        // Cache miss
        // Delete invalid cache entries when thread is idle
        setTimeout(async () => {
          await this.debouncedDeleteInvalidCacheEntries(cacheProps);
        }, 0);

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
   * @returns - The generated cache key
   */
  generateCacheKey({
    cacheName,
    cacheProps,
  }: {
    cacheProps: ICacheProps;
    cacheName: EComputationCacheName;
  }) {
    const { appId, appMode, instanceId, pageId, timestamp, workspaceId } =
      cacheProps;

    const timeStampEpoch = new Date(timestamp).getTime();
    const cacheKeyParts = [
      instanceId,
      workspaceId,
      appId,
      pageId,
      appMode,
      timeStampEpoch,
      cacheName,
    ];

    return cacheKeyParts.join(AppComputationCache.CACHE_KEY_DELIMITER);
  }

  /**
   * Fetches the computation result from the cache or computes it if it does not exist
   * @returns - A promise that resolves with the computation result
   * @throws - Logs an error if the computation result cannot be fetched or computed and returns the computed fallback result
   */
  async fetchOrCompute<T>({
    cacheName,
    cacheProps,
    computeFn,
  }: {
    cacheProps: ICacheProps;
    computeFn: () => Promise<T> | T;
    cacheName: EComputationCacheName;
  }) {
    const shouldCache = this.isComputationCached({
      cacheName,
      cacheProps,
    });

    if (!shouldCache) {
      return computeFn();
    }

    try {
      const cachedResult = await this.getCachedComputationResult<T>({
        cacheProps,
        cacheName,
      });

      if (cachedResult) {
        return cachedResult;
      }

      const computationResult = await computeFn();

      await this.cacheComputationResult({
        cacheProps,
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
   * @returns - A promise that resolves when the cache usage is tracked
   * @throws - Logs an error if the cache usage cannot be tracked
   */
  async trackCacheUsage(name: string) {
    try {
      const currentLog = await this.cacheLogsStore.getItem<ICacheLog>(name);

      await this.cacheLogsStore.setItem(name, {
        lastAccessedAt: Date.now(),
        createdAt: currentLog?.createdAt || Date.now(),
      });
    } catch (error) {
      loglevel.error("Error tracking cache usage:", error);
    }
  }

  /**
   * Delete invalid cache entries
   * @returns - A promise that resolves when the invalid cache entries are deleted
   */

  async deleteInvalidCacheEntries(cacheProps: ICacheProps) {
    try {
      // Get previous entry keys
      const cacheKeys = await this.store.keys();

      // Get invalid cache keys
      const invalidCacheKeys = cacheKeys.filter((key) => {
        const keyParts = key.split(AppComputationCache.CACHE_KEY_DELIMITER);
        const cacheKeyTimestamp = parseInt(keyParts[5], 10);

        return (
          keyParts[0] === cacheProps.instanceId &&
          keyParts[1] === cacheProps.workspaceId &&
          keyParts[2] === cacheProps.appId &&
          keyParts[3] === cacheProps.pageId &&
          keyParts[4] === cacheProps.appMode &&
          cacheKeyTimestamp !== new Date(cacheProps.timestamp).getTime()
        );
      });

      // Delete invalid cache entries
      await Promise.all(
        invalidCacheKeys.map(async (key) => this.store.removeItem(key)),
      );

      // Delete invalid cache logs
      await Promise.all(
        invalidCacheKeys.map(async (key) =>
          this.cacheLogsStore.removeItem(key),
        ),
      );
    } catch (error) {
      loglevel.error("Error deleting invalid cache entries:", error);
    }
  }
}

export const appComputationCache = AppComputationCache.getInstance();

export default appComputationCache;
