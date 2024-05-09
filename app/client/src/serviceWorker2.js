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
  suffix: undefined,
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

/* eslint-disable no-restricted-globals */
// Note: if you need to filter out some files from precaching,
// do that in craco.build.config.js → workbox webpack plugin options
const toPrecache = self.__WB_MANIFEST;
precacheAndRoute(toPrecache);

self.__WB_DISABLE_DEV_DEBUG_LOGS = false;
skipWaiting();
clientsClaim();

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
  new Route(({ request, sameOrigin }) => {
    return sameOrigin && request.destination === "document";
  }, new NetworkOnly()),
);

// Route for page navigation to initiate API request
registerRoute(
  new RegExp("^/app/([^/]+)/([^/]+)-([0-9a-f]+)/edit$"),
  async ({ event, url }) => {
    const pageId = url.pathname.split("-").pop();
    const apiUrl = `/api/v1/consolidated-api/edit?defaultPageId=${pageId}`;
    handleApiRequest(apiUrl);

    // Return the page HTML (assuming it's not to be cached)
    const networkHandler = new NetworkOnly();
    return networkHandler.handle({ event });
  },
  "GET",
);

// Route for fetching the API directly
registerRoute(
  new RegExp("^/api/v1/consolidated-api/edit"),
  async ({ url }) => handleApiRequest(url.href),
  "GET",
);
