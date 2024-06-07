import { Mutex } from "async-mutex";
import { APP_MODE } from "entities/App";
import type { Match, TokensToRegexpOptions } from "path-to-regexp";
import { match } from "path-to-regexp";

export const BUILDER_PATH = `/app/:applicationSlug/:pageSlug(.*\-):pageId/edit`;
export const BUILDER_CUSTOM_PATH = `/app/:customSlug(.*\-):pageId/edit`;
export const VIEWER_PATH = `/app/:applicationSlug/:pageSlug(.*\-):pageId`;
export const VIEWER_CUSTOM_PATH = `/app/:customSlug(.*\-):pageId`;
export const BUILDER_PATH_DEPRECATED = `/applications/:applicationId/pages/:pageId/edit`;
export const VIEWER_PATH_DEPRECATED = `/applications/:applicationId/pages/:pageId`;

interface TMatchResult {
  pageId?: string;
  applicationId?: string;
}

export const matchBuilderPath = (
  pathName: string,
  options: TokensToRegexpOptions,
) =>
  match<TMatchResult>(BUILDER_PATH, options)(pathName) ||
  match<TMatchResult>(BUILDER_PATH_DEPRECATED, options)(pathName) ||
  match<TMatchResult>(BUILDER_CUSTOM_PATH, options)(pathName);

/**
 * Function to match the path with the viewer path
 */
export const matchViewerPath = (pathName: string) =>
  match<TMatchResult>(VIEWER_PATH)(pathName) ||
  match<TMatchResult>(VIEWER_PATH_DEPRECATED)(pathName) ||
  match<TMatchResult>(VIEWER_CUSTOM_PATH)(pathName);

export interface TApplicationParams {
  origin: string;
  pageId?: string;
  applicationId?: string;
  branchName: string;
  appMode: APP_MODE;
}

type TApplicationParamsOrNull = TApplicationParams | null;

/**
 * returns the value in the query string for a key
 */
const getSearchQuery = (search = "", key: string) => {
  const params = new URLSearchParams(search);
  return decodeURIComponent(params.get(key) || "");
};

export const getApplicationParamsFromUrl = (
  url: URL,
): TApplicationParamsOrNull => {
  if (!url) {
    return null;
  }

  const branchName = getSearchQuery(url.search, "branch");

  const matchedBuilder: Match<TMatchResult> = matchBuilderPath(url.pathname, {
    end: false,
  });
  const matchedViewer: Match<TMatchResult> = matchViewerPath(url.pathname);

  if (matchedBuilder) {
    return {
      origin: url.origin,
      pageId: matchedBuilder.params.pageId,
      applicationId: matchedBuilder.params.applicationId,
      branchName,
      appMode: APP_MODE.EDIT,
    };
  }

  if (matchedViewer) {
    return {
      origin: url.origin,
      pageId: matchedViewer.params.pageId,
      applicationId: matchedViewer.params.applicationId,
      branchName,
      appMode: APP_MODE.PUBLISHED,
    };
  }

  return null;
};

/**
 * Function to get the prefetch request for consolidated api
 */
export const getConsolidatedApiPrefetchRequest = (
  applicationProps: TApplicationParams,
) => {
  const { applicationId, appMode, branchName, origin, pageId } =
    applicationProps;

  const headers = new Headers();
  const searchParams = new URLSearchParams();

  if (!pageId) {
    return null;
  }

  searchParams.append("defaultPageId", pageId);

  if (applicationId) {
    searchParams.append("applicationId", applicationId);
  }

  // Add the branch name to the headers
  if (branchName) {
    headers.append("Branchname", branchName);
  }

  // If the URL matches the builder path
  if (appMode === APP_MODE.EDIT) {
    const requestUrl = `${origin}/api/v1/consolidated-api/edit?${searchParams.toString()}`;
    const request = new Request(requestUrl, { method: "GET", headers });
    return request;
  }

  // If the URL matches the viewer path
  if (appMode === APP_MODE.PUBLISHED) {
    const requestUrl = `${origin}/api/v1/consolidated-api/view?${searchParams.toString()}`;
    const request = new Request(requestUrl, { method: "GET", headers });
    return request;
  }

  return null;
};

/**
 * Function to get the prefetch request for consolidated api
 */
export const getPrefetchModuleApiRequests = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applicationProps: TApplicationParams,
): Request[] => {
  return [];
};

/**
 * Cache strategy for Appsmith API
 */
export class PrefetchApiCacheStrategy {
  cacheName = "prefetch-cache-v1";
  cacheMaxAge = 2 * 60 * 1000; // 2 minutes in milliseconds
  // Mutex to lock the fetch and cache operation
  prefetchFetchMutexMap = new Map<string, Mutex>();

  constructor() {}

  getRequestKey = (request: Request) => {
    const headersKey = Array.from(request.headers.entries())
      .map(([key, value]) => `${key}:${value}`)
      .join(",");
    return `${request.method}:${request.url}:${headersKey}`;
  };

  aqcuireFetchMutex = async (request: Request) => {
    const requestKey = this.getRequestKey(request);
    let mutex = this.prefetchFetchMutexMap.get(requestKey);

    if (!mutex) {
      mutex = new Mutex();
      this.prefetchFetchMutexMap.set(requestKey, mutex);
    }

    return mutex.acquire();
  };

  waitForUnlock = async (request: Request) => {
    const requestKey = this.getRequestKey(request);
    const mutex = this.prefetchFetchMutexMap.get(requestKey);

    if (mutex) {
      return mutex.waitForUnlock();
    }
  };

  releaseFetchMutex = (request: Request) => {
    const requestKey = this.getRequestKey(request);
    const mutex = this.prefetchFetchMutexMap.get(requestKey);

    if (mutex) {
      mutex.release();
    }
  };

  /**
   * Function to fetch and cache the consolidated API
   * @param {Request} request
   * @returns
   */
  async cacheConsolidatedApi(request: Request) {
    // Acquire the lock
    await this.aqcuireFetchMutex(request);
    const prefetchApiCache = await caches.open(this.cacheName);
    try {
      const response = await fetch(request);

      if (response.ok) {
        // Clone the response as the response can be consumed only once
        const clonedResponse = response.clone();
        // Put the response in the cache
        await prefetchApiCache.put(request, clonedResponse);
      }
    } catch (error) {
      // Delete the existing cache if the fetch fails
      await prefetchApiCache.delete(request);
    } finally {
      // Release the lock
      this.releaseFetchMutex(request);
    }
  }

  async getCachedResponse(request: Request) {
    // Wait for the lock to be released
    await this.waitForUnlock(request);
    const prefetchApiCache = await caches.open(this.cacheName);
    // Check if the response is already in cache
    const cachedResponse = await prefetchApiCache.match(request);

    if (cachedResponse) {
      const dateHeader = cachedResponse.headers.get("date");
      const cachedTime = dateHeader ? new Date(dateHeader).getTime() : 0;
      const currentTime = Date.now();

      const isCacheValid = currentTime - cachedTime < this.cacheMaxAge;

      if (isCacheValid) {
        // Delete the cache as this is a one-time cache
        await prefetchApiCache.delete(request);
        // Return the cached response
        return cachedResponse;
      }

      // If the cache is not valid, delete the cache
      await prefetchApiCache.delete(request);
    }

    return null;
  }
}
