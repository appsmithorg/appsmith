import { APP_MODE } from "entities/App";
import localforage from "localforage";
import isNull from "lodash/isNull";
import loglevel from "loglevel";
import { EComputationCacheName } from "./types";

interface ICachedData<T> {
  value: T;
  timestamp: string;
}

class AppComputationCache {
  private static instance: AppComputationCache | null = null;
  private readonly store = localforage.createInstance({
    name: "AppComputationCache",
    storeName: "computationResults",
  });
  private readonly cacheLogsStore = localforage.createInstance({
    name: "AppComputationCache",
    storeName: "cacheLogs",
  });
  private readonly appModeConfig = {
    [EComputationCacheName.AllKeys]: [APP_MODE.PUBLISHED],
    [EComputationCacheName.DependencyMap]: [APP_MODE.PUBLISHED],
  };

  static getInstance(): AppComputationCache {
    if (!AppComputationCache.instance) {
      AppComputationCache.instance = new AppComputationCache();
    }
    return AppComputationCache.instance;
  }

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

  async logCacheReadStatus(name: string) {
    await this.cacheLogsStore.setItem(name, {
      lastReadAt: new Date().toISOString(),
    });
  }

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

      await this.logCacheReadStatus(cacheName);
    } catch (error) {
      loglevel.debug("Error caching computation result:", error);
    }
  }

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

      await this.logCacheReadStatus(cacheName);

      return cached.value;
    } catch (error) {
      loglevel.debug("Error getting cache result:", error);
      return null;
    }
  }

  generateCacheKey(indexParts: string[]) {
    return indexParts.join("_");
  }

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
      loglevel.debug("Error getting cache result:", error);

      const fallbackResult = await computeFn();
      return fallbackResult;
    }
  }
}

export const appComputationCache = AppComputationCache.getInstance();

export default appComputationCache;
