import { APP_MODE } from "entities/App";
import localforage from "localforage";
import isNull from "lodash/isNull";
import loglevel from "loglevel";
import {
  EComputationCacheName,
  type IValidatedCacheProps,
  type ICacheProps,
} from "./types";
import debounce from "lodash/debounce";
import { isFinite, isNumber, isString } from "lodash";

interface ICachedData<T> {
  value: T;
  dslVersion?: number;
}

interface ICacheLog {
  lastAccessedAt: number;
  createdAt: number | null;
}

export class AppComputationCache {
  // Singleton instance
  private static instance: AppComputationCache | null = null;
  private static CACHE_KEY_DELIMITER = ">";

  // The cache store for computation results
  private readonly store: LocalForage;

  // The cache store for cache event logs
  private readonly cacheLogsStore: LocalForage;

  // The app mode configuration for each cache type. This determines which app modes
  // the cache should be enabled for
  private readonly appModeConfig = {
    [EComputationCacheName.DEPENDENCY_MAP]: [APP_MODE.PUBLISHED],
    [EComputationCacheName.ALL_KEYS]: [APP_MODE.PUBLISHED],
  };

  constructor() {
    this.store = localforage.createInstance({
      name: "AppComputationCache",
      storeName: "cachedResults",
    });

    this.cacheLogsStore = localforage.createInstance({
      name: "AppComputationCache",
      storeName: "cacheMetadataStore",
    });
  }

  static getInstance(): AppComputationCache {
    if (!AppComputationCache.instance) {
      AppComputationCache.instance = new AppComputationCache();
    }

    return AppComputationCache.instance;
  }

  isAppModeValid(appMode: unknown) {
    return appMode === APP_MODE.PUBLISHED || appMode === APP_MODE.EDIT;
  }

  isTimestampValid(timestamp: unknown) {
    const isoStringRegex =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/;

    if (isString(timestamp) && !!timestamp.trim()) {
      return isoStringRegex.test(timestamp);
    }

    return false;
  }

  isDSLVersionValid(dslVersion: unknown) {
    return isNumber(dslVersion) && isFinite(dslVersion) && dslVersion > 0;
  }

  debouncedDeleteInvalidCacheEntries = debounce(
    this.deleteInvalidCacheEntries,
    5000,
  );

  /**
   * Check if the computation result should be cached based on the app mode configuration
   * @returns - A boolean indicating whether the cache should be enabled for the given app mode
   */
  shouldComputationBeCached(
    cacheName: EComputationCacheName,
    cacheProps: ICacheProps,
  ): cacheProps is IValidatedCacheProps {
    const { appMode, dslVersion, timestamp } = cacheProps;

    if (
      !this.isAppModeValid(appMode) ||
      !this.isTimestampValid(timestamp) ||
      !this.isDSLVersionValid(dslVersion)
    ) {
      return false;
    }

    return this.appModeConfig[cacheName].includes(appMode);
  }

  /**
   * Checks if the value should be cached based on the app mode configuration and
   * caches the computation result if it should be cached. It also tracks the cache usage
   * @returns - A promise that resolves when the computation result is cached
   * @throws - Logs an error if the computation result cannot be cached and throws the error
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
    try {
      const isCacheable = this.shouldComputationBeCached(cacheName, cacheProps);

      if (!isCacheable) {
        return;
      }

      const cacheKey = this.generateCacheKey({ cacheProps, cacheName });

      await this.store.setItem<ICachedData<T>>(cacheKey, {
        value: computationResult,
        dslVersion: cacheProps.dslVersion,
      });

      await this.trackCacheUsage(cacheKey);
    } catch (error) {
      loglevel.error(error);
      throw error;
    }
  }

  /**
   * Gets the cached computation result if it exists and is valid
   * @returns - A promise that resolves with the cached computation result or null if it does not exist
   * @throws - Logs an error if the computation result cannot be fetched and throws the error
   */
  async getCachedComputationResult<T>({
    cacheName,
    cacheProps,
  }: {
    cacheProps: ICacheProps;
    cacheName: EComputationCacheName;
  }): Promise<T | null> {
    try {
      const isCacheable = this.shouldComputationBeCached(cacheName, cacheProps);

      if (!isCacheable) {
        return null;
      }

      const cacheKey = this.generateCacheKey({
        cacheProps,
        cacheName,
      });

      const cached = await this.store.getItem<ICachedData<T>>(cacheKey);

      if (!this.isCacheValid(cached, cacheProps)) {
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
      loglevel.error(error);
      throw error;
    }
  }

  /**
   * Checks if the cached value is valid
   * @returns - A boolean indicating whether the cached value is valid
   */
  isCacheValid<T>(
    cachedValue: ICachedData<T> | null,
    cacheProps: IValidatedCacheProps,
  ): cachedValue is ICachedData<T> {
    if (isNull(cachedValue)) {
      return false;
    }

    if (!cachedValue.dslVersion) {
      return false;
    }

    return cachedValue.dslVersion === cacheProps.dslVersion;
  }

  /**
   * Generates a cache key from the index parts
   * @returns - The generated cache key
   */
  generateCacheKey({
    cacheName,
    cacheProps,
  }: {
    cacheProps: IValidatedCacheProps;
    cacheName: EComputationCacheName;
  }) {
    const { appId, appMode, instanceId, pageId, timestamp } = cacheProps;

    const timeStampEpoch = new Date(timestamp).getTime();
    const cacheKeyParts = [
      instanceId,
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
    try {
      const isCacheable = this.shouldComputationBeCached(cacheName, cacheProps);

      if (!isCacheable) {
        return computeFn();
      }

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
      loglevel.error(error);
      throw error;
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
   * @throws - Logs an error if the invalid cache entries cannot be deleted
   */

  async deleteInvalidCacheEntries(cacheProps: ICacheProps) {
    try {
      // Get previous entry keys
      const cacheKeys = await this.store.keys();

      // Get invalid cache keys
      const invalidCacheKeys = cacheKeys.filter((key) => {
        const keyParts = key.split(AppComputationCache.CACHE_KEY_DELIMITER);
        const cacheKeyTimestamp = parseInt(keyParts[4], 10);

        if (!cacheProps.timestamp) {
          return false;
        }

        return (
          keyParts[0] === cacheProps.instanceId &&
          keyParts[1] === cacheProps.appId &&
          keyParts[3] === cacheProps.appMode &&
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

  /**
   * Resets the singleton instance
   */
  static resetInstance() {
    AppComputationCache.instance = null;
  }
}

export const appComputationCache = AppComputationCache.getInstance();

export default appComputationCache;
