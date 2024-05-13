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
  const { applicationId, pageId } = params;
  const searchParams = new URLSearchParams();

  if (pageId) {
    searchParams.append("defaultPageId", pageId);
  }

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
    this.initCache(cacheName);
  }

  async initCache(cacheName) {
    // Open the cache
    this.cache = await caches.open(cacheName);
  }

  /**
   *
   * @param {Request} request
   * @param {boolean} resetCache
   * @returns
   */

  async handle(request, resetCache = false) {
    // Check if the request is already in cache
    let cachedResponse = await this.cache.match(request);

    // If the response is in cache and resetCache is false, return the cached response
    if (cachedResponse && !resetCache) {
      // Delete the cached response. This is to ensure that the cache is deleted after the first use
      await this.cache.delete(request);
      // Return the cached response
      return cachedResponse;
    }

    // If the resetCache is true, delete the cached response
    if (resetCache) {
      await this.cache.delete(request);
    }

    // Check for ongoing request
    const requestKey = `${request.method}:${request.url}`;
    if (this.pendingApiRequests.has(requestKey)) {
      return this.pendingApiRequests.get(requestKey); // Return the ongoing request
    }

    // Fetch the request
    const fetchPromise = fetch(request)
      .then(async (response) => {
        // If the response is ok, clone the response
        if (response.ok) {
          const clonedResponse = response.clone();
          // Store in cache with expiration header
          await this.cache.put(request, clonedResponse);
        }
        return response;
      })
      .finally(() => {
        // Remove the request from the ongoing request map
        this.pendingApiRequests.delete(requestKey);
      });

    // Add the request to the ongoing request map
    this.pendingApiRequests.set(requestKey, fetchPromise);

    return fetchPromise;
  }
}
