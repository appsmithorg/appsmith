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
  const matchViewer = matchViewerPath(url.pathname, { end: false });

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
  if (matchViewer && matchViewer.params?.pageId) {
    const searchParams = getConsolidatedAPISearchParams(matchViewer.params);
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
    // Map to store ongoing API requests
    this.pendingApiRequests = new Map();
    this.skipCacheRequests = new Map();
    this.initCache(cacheName);
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
    this.skipCacheRequests.get(requestKey) || false;
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
    // Delete the cached response
    await this.cache.delete(request);

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

          // Delete the skip cache request
          this.deleteSkipCacheRequest(request);
        }
        return response;
      })
      .finally(() => {
        // Remove the request from the ongoing request map
        this.deleteOngoingRequest(request);
      });

    // Add the request to the ongoing request map
    this.setOngoingRequest(request, fetchPromise);

    return fetchPromise;
  }

  async readFromCacheOrFetch(request) {
    // Check for ongoing request
    const ongoingRequest = this.getOngoingRequest(request);
    if (ongoingRequest) {
      this.skipCacheRequests.set(request);
      return ongoingRequest; // Return the ongoing request
    }

    // Check if the request is already in cache
    const cachedResponse = await this.cache.match(request);

    if (cachedResponse) {
      // Delete the cached response. This is to ensure that the cache is deleted after the first use
      await this.cache.delete(request);
      // Return the cached response
      return cachedResponse;
    }

    // Fetch the request
    return fetch(request);
  }
}
