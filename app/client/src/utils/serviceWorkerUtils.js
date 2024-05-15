/* eslint-disable no-console */
import { match } from "path-to-regexp";

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
 * Function to get the prefetch request
 * @param {URL} url
 * @returns {Request | null}
 */
export const getPrefetchRequest = (url) => {
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
export class AppsmithApiCacheStrategy {
  /**
   *
   * @param {string} cacheName
   */
  constructor(cacheName) {
    // If the prefetch request is ongoing, we should not make another request. This scenario occurs when the request from the main thread
    // was initialised when the prefetch request was ongoing. The map stores the promise returned by fetch of the prefetch request and the same is returned
    // to the main thread
    this.pendingApiRequests = new Map();
    // If the request should be skipped from the cache, we should not cache the response. This scenario occurs when the request from the main thread
    // was initialised when the prefetch request was ongoing. Since the promise is returned to the main thread, the response should not be cached
    this.skipCacheRequests = new Map();
    this.initCache(cacheName);
    this.cacheMaxAge = 2 * 60 * 1000; // 2 minutes in milliseconds
  }

  async initCache(cacheName) {
    // Open the cache
    this.cache = await caches.open(cacheName);
  }

  /**
   * Get the ongoing request from the map
   * @param {Request} request
   * @returns {any | null}
   */
  getOngoingRequest(request) {
    const requestKey = `${request.method}:${request.url}`;
    if (this.pendingApiRequests.has(requestKey)) {
      return this.pendingApiRequests.get(requestKey);
    }

    return null;
  }

  /**
   * Set the ongoing request in the map
   * @param {Request} request
   * @param {Promise<Response>} promise
   * @returns {void}
   */
  setOngoingRequest(request, promise) {
    const requestKey = `${request.method}:${request.url}`;
    this.pendingApiRequests.set(requestKey, promise);
  }

  /**
   * Delete the ongoing request from the map
   * @param {Request} request
   * @returns {void}
   */
  deleteOngoingRequest(request) {
    const requestKey = `${request.method}:${request.url}`;
    this.pendingApiRequests.delete(requestKey);
  }

  /**
   * get the skip cache request in the map
   * @param {Request} request
   * @param {Promise<Response>} promise
   * @returns {boolean}
   */
  shouldSkipCacheRequest(request) {
    const requestKey = `${request.method}:${request.url}`;
    return this.skipCacheRequests.get(requestKey) || false;
  }

  /**
   * Set the skip cache request in the map
   * @param {Request} request
   * @param {Promise<Response>} promise
   * @returns {void}
   */
  setSkipCacheRequest(request) {
    const requestKey = `${request.method}:${request.url}`;
    this.skipCacheRequests.set(requestKey, true);
  }

  /**
   * Delete the skip cache request in the map
   * @param {Request} request
   * @param {Promise<Response>} promise
   * @returns {void}
   */
  deleteSkipCacheRequest(request) {
    const requestKey = `${request.method}:${request.url}`;
    this.skipCacheRequests.delete(requestKey);
  }

  /**
   *
   * @param {Request} request
   * @returns
   */

  async resetCacheAndFetch(request) {
    // Fetch the request
    const fetchPromise = fetch(request)
      .then(async (response) => {
        // If the response is ok, clone the response
        if (response.ok) {
          const clonedResponse = response.clone();
          // Store in cache with expiration header
          const shouldSkipCache = this.shouldSkipCacheRequest(request);
          if (!shouldSkipCache) {
            await this.cache.put(request, clonedResponse);
          }
        }
        return response;
      })
      .finally(() => {
        // Delete the skip cache request
        this.deleteSkipCacheRequest(request);
        // Remove the request from the ongoing request map
        this.deleteOngoingRequest(request);
      });

    // Add the request to the ongoing request map
    this.setOngoingRequest(request, fetchPromise);

    // Delete the cached response
    await this.cache.delete(request);

    return fetchPromise;
  }

  async getCachedResponse(request) {
    // Check if the request is already in cache
    const cachedResponse = await this.cache.match(request);

    if (cachedResponse) {
      const dateHeader = cachedResponse.headers.get("date");
      const cachedTime = new Date(dateHeader).getTime();
      const currentTime = Date.now();

      const isCacheValid = currentTime - cachedTime < this.cacheMaxAge;

      if (isCacheValid) {
        // Delete the cache as this is a one-time cache
        await this.cache.delete(request);
        // Return the cached response
        return cachedResponse;
      }

      // If the cache is not valid, delete the cache
      await this.cache.delete(request);
    }

    return null;
  }
}
