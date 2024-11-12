import { Mutex } from "async-mutex";
import { APP_MODE } from "entities/App";
import type { Match, TokensToRegexpOptions } from "path-to-regexp";
import { match } from "path-to-regexp";
import {
  BUILDER_PATH,
  BUILDER_CUSTOM_PATH,
  VIEWER_PATH,
  VIEWER_CUSTOM_PATH,
  BUILDER_PATH_DEPRECATED,
  VIEWER_PATH_DEPRECATED,
} from "../constants/routes/appRoutes";

interface TMatchResult {
  basePageId?: string;
  baseApplicationId?: string;
  applicationSlug?: string;
}

export interface TApplicationParams {
  origin: string;
  basePageId?: string;
  baseApplicationId?: string;
  branchName: string;
  appMode: APP_MODE;
  applicationSlug?: string;
}

type TApplicationParamsOrNull = TApplicationParams | null;

export const cachedApiUrlRegex = new RegExp("/api/v1/consolidated-api/");

/**
 * Function to match the path with the builder path
 */
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

/**
 * returns the value in the query string for a key
 */
export const getSearchQuery = (search = "", key: string) => {
  const params = new URLSearchParams(search);

  return decodeURIComponent(params.get(key) || "");
};

export const getApplicationParamsFromUrl = (
  urlParams: Pick<URL, "origin" | "pathname" | "search">,
): TApplicationParamsOrNull => {
  const { origin, pathname, search } = urlParams;
  // Get the branch name from the query string
  const branchName = getSearchQuery(search, "branch");

  const matchedBuilder: Match<TMatchResult> = matchBuilderPath(pathname, {
    end: false,
  });
  const matchedViewer: Match<TMatchResult> = matchViewerPath(pathname);

  if (matchedBuilder) {
    return {
      origin,
      basePageId: matchedBuilder.params.basePageId,
      baseApplicationId: matchedBuilder.params.baseApplicationId,
      branchName,
      appMode: APP_MODE.EDIT,
      applicationSlug: matchedBuilder.params.applicationSlug,
    };
  }

  if (matchedViewer) {
    return {
      origin,
      basePageId: matchedViewer.params.basePageId,
      baseApplicationId: matchedViewer.params.baseApplicationId,
      branchName,
      appMode: APP_MODE.PUBLISHED,
      applicationSlug: matchedViewer.params.applicationSlug,
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
  const { appMode, baseApplicationId, basePageId, branchName, origin } =
    applicationProps;

  const headers = new Headers();
  const searchParams = new URLSearchParams();

  if (!basePageId) {
    return null;
  }

  searchParams.append("defaultPageId", basePageId);

  if (baseApplicationId) {
    searchParams.append("applicationId", baseApplicationId);
  }

  // Add the branch name to the headers
  if (branchName) {
    headers.append("Branchname", branchName);
  }

  // If the URL matches the builder path
  if (appMode === APP_MODE.EDIT) {
    const requestUrl = `${origin}/api/${"v1/consolidated-api/edit"}?${searchParams.toString()}`;
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
 * Function to get the prefetch requests for an application
 */
export const getPrefetchRequests = (
  applicationParams: TApplicationParams,
): Request[] => {
  const prefetchRequests: Request[] = [];
  const consolidatedApiPrefetchRequest =
    getConsolidatedApiPrefetchRequest(applicationParams);

  if (consolidatedApiPrefetchRequest) {
    prefetchRequests.push(consolidatedApiPrefetchRequest);
  }

  return prefetchRequests;
};

/**
 * Service to fetch and cache prefetch requests
 */
export class PrefetchApiService {
  cacheName = "prefetch-cache-v1";
  cacheMaxAge = 2 * 60 * 1000; // 2 minutes in milliseconds
  // Mutex to lock the fetch and cache operation
  prefetchFetchMutexMap = new Map<string, Mutex>();
  // Header keys used to create the unique request key
  headerKeys = ["branchname"];

  constructor() {}

  // Function to get the request key
  getRequestKey = (request: Request) => {
    let requestKey = `${request.method}:${request.url}`;

    this.headerKeys.forEach((headerKey) => {
      const headerValue = request.headers.get(headerKey);

      if (headerValue) {
        requestKey += `:${headerKey}:${headerValue}`;
      }
    });

    return requestKey;
  };

  // Function to acquire the fetch mutex for a request
  aqcuireFetchMutex = async (request: Request) => {
    const requestKey = this.getRequestKey(request);
    let mutex = this.prefetchFetchMutexMap.get(requestKey);

    if (!mutex) {
      mutex = new Mutex();
      this.prefetchFetchMutexMap.set(requestKey, mutex);
    }

    return mutex.acquire();
  };

  // Function to wait for the lock to be released for a request
  waitForUnlock = async (request: Request) => {
    const requestKey = this.getRequestKey(request);
    const mutex = this.prefetchFetchMutexMap.get(requestKey);

    if (mutex) {
      return mutex.waitForUnlock();
    }
  };

  // Function to release the fetch mutex for a request
  releaseFetchMutex = (request: Request) => {
    const requestKey = this.getRequestKey(request);
    const mutex = this.prefetchFetchMutexMap.get(requestKey);

    if (mutex) {
      mutex.release();
    }
  };

  /**
   * Function to fetch and cache the consolidated API
   */
  async cacheApi(request: Request) {
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

  /**
   * Function to get the cached response for the request
   */
  async getCachedResponse(request: Request) {
    // Wait for the lock to be released
    await this.waitForUnlock(request);
    const prefetchApiCache = await caches.open(this.cacheName);
    // Fetch the cached response for the request
    // if it is a miss, assign null to the cachedResponse
    let cachedResponse: Response | null =
      (await prefetchApiCache.match(request)) || null;

    if (cachedResponse) {
      const dateHeader = cachedResponse.headers.get("date");
      const cachedTime = dateHeader ? new Date(dateHeader).getTime() : 0;
      const currentTime = Date.now();
      // Check if the cache is valid
      const isCacheValid = currentTime - cachedTime < this.cacheMaxAge;

      // If the cache is not valid, assign null to the cachedResponse
      if (!isCacheValid) {
        cachedResponse = null;
      }

      // Delete the cache as this is a one time read cache
      await prefetchApiCache.delete(request);
    }

    return cachedResponse;
  }
}
