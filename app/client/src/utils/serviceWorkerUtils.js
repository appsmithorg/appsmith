/* eslint-disable no-console */
import { match } from "path-to-regexp";
import { Mutex } from "async-mutex";

export const BUILDER_PATH = `/app/:applicationSlug/:pageSlug(.*\-):pageId/edit`;
export const BUILDER_CUSTOM_PATH = `/app/:customSlug(.*\-):pageId/edit`;
export const VIEWER_PATH = `/app/:applicationSlug/:pageSlug(.*\-):pageId`;
export const VIEWER_CUSTOM_PATH = `/app/:customSlug(.*\-):pageId`;
export const BUILDER_PATH_DEPRECATED = `/applications/:applicationId/pages/:pageId/edit`;
export const VIEWER_PATH_DEPRECATED = `/applications/:applicationId/pages/:pageId`;

/**
 * Function to get the search query from the URL
 * @param {string} search
 * @param {string} key
 * @returns {string | null}
 */
export const getSearchQuery = (search = "", key) => {
  const params = new URLSearchParams(search);
  return decodeURIComponent(params.get(key) || "");
};

/**
 * Function to match the path with the builder path
 * @param {string} pathName
 * @param {Object} options
 * @param {boolean} options.end
 * @returns {Match<object> | boolean}
 */
export const matchBuilderPath = (pathName, options) =>
  match(BUILDER_PATH, options)(pathName) ||
  match(BUILDER_PATH_DEPRECATED, options)(pathName) ||
  match(BUILDER_CUSTOM_PATH, options)(pathName);

/**
 * Function to match the path with the viewer path
 * @param {string} pathName
 * @returns {Match<object> | boolean}
 */
export const matchViewerPath = (pathName) =>
  match(VIEWER_PATH)(pathName) ||
  match(VIEWER_PATH_DEPRECATED)(pathName) ||
  match(VIEWER_CUSTOM_PATH)(pathName);

/**
 * Function to get the consolidated API search params
 * @param {Match<object>} params
 * @returns
 */
export const getConsolidatedAPISearchParams = (params = {}) => {
  if (!params || !params?.pageId) {
    return "";
  }

  const { applicationId, pageId } = params;
  const searchParams = new URLSearchParams();

  searchParams.append("defaultPageId", pageId);

  if (applicationId) {
    searchParams.append("applicationId", applicationId);
  }

  return searchParams.toString();
};

/**
 * Function to get the prefetch request for consolidated api
 * @param {URL} url
 * @returns {Request | null}
 */
export const getPrefetchConsolidatedApiRequest = (url) => {
  if (!url) {
    return null;
  }

  // Match the URL with the builder and viewer paths
  const matchedBuilder = matchBuilderPath(url.pathname, { end: false });
  const matchedViewer = matchViewerPath(url.pathname, { end: false });

  // Get the branch name from the search query
  const branchName = getSearchQuery(url.search, "branch");

  let headers = new Headers();

  // Add the branch name to the headers
  if (branchName) {
    headers.append("Branchname", branchName);
  }

  // If the URL matches the builder path
  if (matchedBuilder && matchedBuilder.params?.pageId) {
    const searchParams = getConsolidatedAPISearchParams(matchedBuilder.params);
    const requestUrl = `${url.origin}/api/v1/consolidated-api/edit?${searchParams}`;
    const request = new Request(requestUrl, { method: "GET", headers });
    return request;
  }

  // If the URL matches the viewer path
  if (matchedViewer && matchedViewer.params?.pageId) {
    const searchParams = getConsolidatedAPISearchParams(matchedViewer.params);
    const requestUrl = `${url.origin}/api/v1/consolidated-api/view?${searchParams}`;
    const request = new Request(requestUrl, { method: "GET", headers });
    return request;
  }

  // Return null if the URL does not match the builder or viewer path
  return null;
};

/**
 * Cache strategy for Appsmith API
 */
export class ConsolidatedApiCacheStrategy {
  /**
   * Constructor for the ConsolidatedApiCacheStrategy
   * @param {string} cacheName
   */
  constructor(cacheName) {
    this.initCache(cacheName);
    this.cacheMaxAge = 2 * 60 * 1000; // 2 minutes in milliseconds
    this.consolidatedApiFetchmutex = new Mutex();
  }

  async initCache(cacheName) {
    // Open the cache
    this.cache = await caches.open(cacheName);
  }

  /**
   * Function to fetch and cache the consolidated API
   * @param {Request} request
   * @returns
   */

  async cacheConsolidatedApi(request) {
    await this.consolidatedApiFetchmutex.acquire();
    console.log("SW: fetchAndCache : Mutex locked", performance.now());

    try {
      const response = await fetch(request);
      console.log("SW: fetchAndCache : fetched response", performance.now());

      if (response.ok) {
        const clonedResponse = response.clone();
        console.log("SW: fetchAndCache : putting in cache", performance.now());
        await this.cache.put(request, clonedResponse);
      }
    } catch (error) {
      await this.cache.delete(request);
      console.error("SW: fetchAndCache : Error fetching and caching", error);
    } finally {
      console.log("SW: fetchAndCache : Mutex released", performance.now());
      this.consolidatedApiFetchmutex.release();
    }
  }

  async getCachedResponse(request) {
    console.log("SW: getCachedResponse : Mutex waiting", performance.now());
    await this.consolidatedApiFetchmutex.waitForUnlock();
    // Check if the request is already in cache
    console.log("SW: getCachedResponse : Mutex acquired", performance.now());
    const cachedResponse = await this.cache.match(request);
    if (cachedResponse) {
      const dateHeader = cachedResponse.headers.get("date");
      const cachedTime = new Date(dateHeader).getTime();
      const currentTime = Date.now();

      const isCacheValid = currentTime - cachedTime < this.cacheMaxAge;

      console.log(
        "SW: getCachedResponse : Cache valid",
        isCacheValid,
        performance.now(),
      );
      if (isCacheValid) {
        // Delete the cache as this is a one-time cache
        await this.cache.delete(request);
        // Return the cached response
        console.log(
          "SW: getCachedResponse : Returning cached response",
          performance.now(),
        );
        return cachedResponse;
      }

      console.log("SW: getCachedResponse : Cache invalid", performance.now());
      // If the cache is not valid, delete the cache
      await this.cache.delete(request);
    }

    return null;
  }
}
