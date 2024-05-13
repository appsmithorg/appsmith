import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim, setCacheNameDetails, skipWaiting } from "workbox-core";
import { registerRoute, Route } from "workbox-routing";
import {
  CacheFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { match } from "path-to-regexp";

export const BUILDER_PATH = `/app/:applicationSlug/:pageSlug(.*\-):pageId/edit`;
export const BUILDER_CUSTOM_PATH = `/app/:customSlug(.*\-):pageId/edit`;
export const VIEWER_PATH = `/app/:applicationSlug/:pageSlug(.*\-):pageId`;
export const VIEWER_CUSTOM_PATH = `/app/:customSlug(.*\-):pageId`;
export const BUILDER_PATH_DEPRECATED = `/applications/:applicationId/pages/:pageId/edit`;
export const VIEWER_PATH_DEPRECATED = `/applications/:applicationId/pages/:pageId`;

export const getSearchQuery = (search = "", key) => {
  const params = new URLSearchParams(search);
  return decodeURIComponent(params.get(key) || "");
};

export const matchBuilderPath = (pathName, options) =>
  match(BUILDER_PATH, options)(pathName) ||
  match(BUILDER_PATH_DEPRECATED, options)(pathName) ||
  match(BUILDER_CUSTOM_PATH, options)(pathName);

export const matchViewerPath = (pathName) =>
  match(VIEWER_PATH)(pathName) ||
  match(VIEWER_PATH_DEPRECATED)(pathName) ||
  match(VIEWER_CUSTOM_PATH)(pathName);

setCacheNameDetails({
  prefix: "appsmith",
  suffix: "",
  precache: "precache-v1",
  runtime: "runtime",
  googleAnalytics: "appsmith-ga",
});

const regexMap = {
  appViewPage: new RegExp(/api\/v1\/pages\/\w+\/view$/),
  static3PAssets: new RegExp(
    /(tiny.cloud|googleapis|gstatic|cloudfront).*.(js|css|woff2)/,
  ),
  shims: new RegExp(/shims\/.*.js/),
  profile: new RegExp(/v1\/(users\/profile|workspaces)/),
};

/* eslint-disable no-restricted-globals */
// Note: if you need to filter out some files from precaching,
// do that in craco.build.config.js → workbox webpack plugin options
const toPrecache = self.__WB_MANIFEST;
precacheAndRoute(toPrecache);

self.__WB_DISABLE_DEV_DEBUG_LOGS = false;
skipWaiting();
clientsClaim();

const CACHE_NAME = "api-cache";
const pendingApiRequests = new Map();

// Function to handle API requests with caching, deduplication, and expiration
/**
 *
 * @param {Request} request
 * @param {boolean} resetCache
 * @returns
 */
const handleCachedApiRequest = async (request, resetCache = false) => {
  const requestKey = `${request.method}:${request.url}`;
  const cache = await caches.open(CACHE_NAME);
  let cachedResponse = await cache.match(request);

  if (cachedResponse && !resetCache) {
    await cache.delete(request);
    return cachedResponse;
  }

  if (resetCache) {
    await cache.delete(request);
  }

  // Check for ongoing request
  if (pendingApiRequests.has(requestKey)) {
    return pendingApiRequests.get(requestKey); // Wait for the existing request to complete
  }

  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const clonedResponse = response.clone();
        // Store in cache with expiration header
        await cache.put(request, clonedResponse);
      }
      return response;
    })
    .finally(() => {
      pendingApiRequests.delete(requestKey);
    });

  pendingApiRequests.set(requestKey, fetchPromise);
  return fetchPromise;
};

/**
 *
 * @param {Match<object>} params
 * @returns
 */
const getConsolidatedAPISearchParams = (params = {}) => {
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
 * Function to prefetch a request
 * @param {URL} url
 * @returns {Request | null}
 */
const getPrefetchRequest = (url) => {
  const matchedBuilder = matchBuilderPath(url.pathname, { end: false });
  const matchViewer = matchViewerPath(url.pathname, { end: false });
  const branchName = getSearchQuery(url.search, "branch");

  let headers = new Headers();

  if (branchName) {
    headers.append("Branchname", branchName);
  }

  if (matchedBuilder && matchedBuilder.params?.pageId) {
    const searchParams = getConsolidatedAPISearchParams(matchedBuilder.params);
    const requestUrl = `${url.origin}/api/v1/consolidated-api/edit?${searchParams}`;
    const request = new Request(requestUrl, { method: "GET", headers });
    return request;
  }

  if (matchViewer && matchViewer.params?.pageId) {
    const searchParams = getConsolidatedAPISearchParams(matchViewer.params);
    const requestUrl = `${url.origin}/api/v1/consolidated-api/view?${searchParams}`;
    const request = new Request(requestUrl, { method: "GET", headers });
    return request;
  }

  return null;
};

/**
 *
 * @param {ExtendableEvent} event
 * @param {Request} request
 * @param {URL} url
 * @returns
 */
const handleFetchHtml = async (event, request, url) => {
  const prefetchRequest = getPrefetchRequest(url);

  if (prefetchRequest) {
    handleCachedApiRequest(prefetchRequest, true);
  }

  const networkHandler = new NetworkOnly();
  const htmlPromise = networkHandler.handle({ event, request });

  return htmlPromise;
};

// This route's caching seems too aggressive.
// TODO(abhinav): Figure out if this is really necessary.
// Maybe add the assets locally?
registerRoute(({ url }) => {
  return (
    regexMap.shims.test(url.pathname) || regexMap.static3PAssets.test(url.href)
  );
}, new CacheFirst());

registerRoute(({ url }) => {
  return regexMap.profile.test(url.pathname);
}, new NetworkOnly());

registerRoute(({ url }) => {
  return regexMap.appViewPage.test(url.pathname);
}, new StaleWhileRevalidate());

registerRoute(
  new Route(
    ({ request, sameOrigin }) => {
      return sameOrigin && request.destination === "document";
    },
    async ({ event, request, url }) => handleFetchHtml(event, request, url),
  ),
);

// Route for fetching the API directly
registerRoute(
  new RegExp("/api/v1/consolidated-api/"),
  async ({ request }) => {
    return handleCachedApiRequest(request);
  },
  "GET",
);
