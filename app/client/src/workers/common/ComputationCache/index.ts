import { APP_MODE } from "entities/App";
import localforage from "localforage";
import isNull from "lodash/isNull";
import loglevel from "loglevel";
import { EComputationName } from "./types";

interface ICachedData<T> {
  value: T;
  timestamp: string;
}

class ComputationCache {
  private static instance: ComputationCache | null = null;
  private readonly store = localforage.createInstance({
    name: "AppComputationCache",
    storeName: "computationResults",
  });
  private readonly appModeConfig = {
    [EComputationName.AllKeys]: [APP_MODE.PUBLISHED],
    [EComputationName.DependencyMap]: [APP_MODE.PUBLISHED],
  };

  static getInstance(): ComputationCache {
    if (!ComputationCache.instance) {
      ComputationCache.instance = new ComputationCache();
    }
    return ComputationCache.instance;
  }

  isComputationCached({
    computationName,
    viewMode,
  }: {
    computationName: EComputationName;
    viewMode?: APP_MODE;
  }) {
    if (!viewMode) {
      return false;
    }

    return this.appModeConfig[computationName].includes(viewMode);
  }

  async cacheComputationResult<T>({
    appId,
    computationName,
    computationResult,
    pageId,
    timestamp,
    viewMode,
  }: {
    appId: string;
    computationName: EComputationName;
    computationResult: T;
    pageId: string;
    timestamp: string;
    viewMode: APP_MODE;
  }) {
    const shouldCache = this.isComputationCached({
      computationName,
      viewMode,
    });

    if (!shouldCache) {
      return;
    }

    const cacheKey = this.generateCacheKey([
      appId,
      pageId,
      viewMode,
      computationName,
    ]);

    try {
      await this.store.setItem<ICachedData<T>>(cacheKey, {
        value: computationResult,
        timestamp,
      });
    } catch (error) {
      loglevel.debug("Error caching computation result:", error);
    }
  }

  async getCachedComputationResult<T>({
    appId,
    computationName,
    pageId,
    timestamp,
    viewMode,
  }: {
    appId: string;
    computationName: EComputationName;
    pageId: string;
    timestamp: string;
    viewMode?: APP_MODE;
  }): Promise<T | null> {
    if (!viewMode) {
      return null;
    }

    const cacheKey = this.generateCacheKey([
      appId,
      pageId,
      viewMode,
      computationName,
    ]);

    try {
      const cached = await this.store.getItem<ICachedData<T>>(cacheKey);
      if (isNull(cached)) {
        return null;
      }

      if (cached.timestamp !== timestamp) {
        return null;
      }

      return cached.value;
    } catch (error) {
      loglevel.debug("Error getting cache result:", error);
      return null;
    }
  }

  generateCacheKey(indexParts: string[]) {
    return indexParts.join("_");
  }

  async performComputation<T>({
    appId,
    computationName,
    computeFn,
    pageId,
    timestamp,
    viewMode,
  }: {
    appId: string;
    timestamp: string;
    pageId: string;
    viewMode?: APP_MODE;
    computeFn: () => Promise<T> | T;
    computationName: EComputationName;
  }) {
    try {
      const cachedResult = await this.getCachedComputationResult({
        appId,
        timestamp,
        pageId,
        viewMode,
        computationName,
      });

      if (cachedResult) {
        return cachedResult;
      }

      const shouldCache = this.isComputationCached({
        computationName,
        viewMode,
      });

      if (!shouldCache || !viewMode) {
        return computeFn();
      }

      const computationResult = await computeFn();

      await this.cacheComputationResult({
        appId,
        timestamp,
        pageId,
        viewMode,
        computationResult,
        computationName,
      });

      return computationResult;
    } catch (error) {
      loglevel.debug("Error getting cache result:", error);

      const fallbackResult = await computeFn();
      return fallbackResult;
    }
  }
}

export const computationCache = ComputationCache.getInstance();

export default computationCache;
