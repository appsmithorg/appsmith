import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim, setCacheNameDetails, skipWaiting } from "workbox-core";
import { registerRoute, Route } from "workbox-routing";
import {
  CacheFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from "workbox-strategies";

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
  appEditUrl: new RegExp(/\/app\/[\w\d-]+\/[\w\d]+-[a-f0-9]+\/edit/),
  appViewUrl: new RegExp(/\/app\/[\w\d-]+\/[\w\d]+-[a-f0-9]+(\/)?/),
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
const API_CACHE_DURATION = 10000; // Cache duration in milliseconds (10 seconds)
const pendingApiRequests = new Map();

// Function to handle API requests with caching, deduplication, and expiration
const handleApiRequest = async (apiUrl) => {
  const cache = await caches.open(CACHE_NAME);
  let cachedResponse = await cache.match(apiUrl);
  let now = Date.now();

  // Check if there is a valid cached response
  if (
    cachedResponse &&
    new Date(cachedResponse.headers.get("sw-cache-expires")) > now
  ) {
    return cachedResponse; // Serve from cache
  }

  // Check for ongoing request
  if (pendingApiRequests.has(apiUrl)) {
    return pendingApiRequests.get(apiUrl); // Wait for the existing request to complete
  }

  const fetchPromise = fetch(apiUrl)
    .then(async (response) => {
      if (response.ok) {
        const clonedResponse = response.clone();
        // Store in cache with expiration header
        const headers = new Headers(clonedResponse.headers);
        headers.set(
          "sw-cache-expires",
          new Date(now + API_CACHE_DURATION).toString(),
        );
        await cache.put(
          apiUrl,
          new Response(clonedResponse.body, {
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
            headers: headers,
          }),
        );
      }
      return response;
    })
    .finally(() => {
      pendingApiRequests.delete(apiUrl);
    });

  pendingApiRequests.set(apiUrl, fetchPromise);
  return fetchPromise;
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
    async ({ event, request, url }) => {
      const isAppEditUrl = regexMap.appEditUrl.test(request.url);
      const isAppViewUrl = regexMap.appViewUrl.test(request.url);
      let apiFetchPromise = null;

      if (isAppEditUrl) {
        const pageId = request.url.split("-").pop().split("/")[0];
        const apiUrl = `${url.origin}/api/v1/consolidated-api/edit?defaultPageId=${pageId}`;
        apiFetchPromise = handleApiRequest(apiUrl);
      } else if (isAppViewUrl) {
        const pageId = request.url.split("-").pop().split("/")[0];
        const apiUrl = `${url.origin}/api/v1/consolidated-api/view?defaultPageId=${pageId}`;
        apiFetchPromise = handleApiRequest(apiUrl);
      }
      const networkHandler = new NetworkOnly();
      const htmlPromise = networkHandler.handle({ event, request });

      if (apiFetchPromise) {
        apiFetchPromise.then(() => {}).catch(() => {});
      }

      return htmlPromise;
    },
  ),
);

// Route for fetching the API directly
registerRoute(
  new RegExp("/api/v1/consolidated-api/"),
  async ({ url }) => {
    return handleApiRequest(url.href);
  },
  "GET",
);
