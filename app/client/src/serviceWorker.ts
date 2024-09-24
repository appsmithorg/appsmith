import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim, setCacheNameDetails, skipWaiting } from "workbox-core";
import { registerRoute, Route } from "workbox-routing";
import {
  CacheFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from "workbox-strategies";
import {
  cachedApiUrlRegex,
  getApplicationParamsFromUrl,
  getPrefetchRequests,
  PrefetchApiService,
} from "ee/utils/serviceWorkerUtils";
import type { RouteHandlerCallback } from "workbox-core/types";

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
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPrecache = (self as any).__WB_MANIFEST;

precacheAndRoute(toPrecache);

self.__WB_DISABLE_DEV_LOGS = true;
skipWaiting();
clientsClaim();

const prefetchApiService = new PrefetchApiService();

/**
 * Route handler callback for HTML pages.
 * This callback is responsible for prefetching the API requests for the application page.
 */
const htmlRouteHandlerCallback: RouteHandlerCallback = async ({
  event,
  request,
  url,
}) => {
  // Extract application params from the URL
  const applicationParams = getApplicationParamsFromUrl(url);

  // If application params are present, prefetch the API requests for the application
  if (applicationParams) {
    const prefetchRequests = getPrefetchRequests(applicationParams);

    prefetchRequests.forEach((prefetchRequest) => {
      prefetchApiService.cacheApi(prefetchRequest).catch(() => {
        // Silently fail
      });
    });
  }

  const networkHandler = new NetworkOnly();

  return networkHandler.handle({ event, request });
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
  new Route(({ request, sameOrigin }) => {
    return sameOrigin && request.destination === "document";
  }, htmlRouteHandlerCallback),
);

// Route for fetching the API directly
registerRoute(
  // Intercept requests to the consolidated API and module instances API
  cachedApiUrlRegex,
  async ({ event, request }) => {
    // Check for cached response
    const cachedResponse = await prefetchApiService.getCachedResponse(request);

    // If the response is cached, return the response
    if (cachedResponse) {
      return cachedResponse;
    }

    // If the response is not cached, fetch the response
    const networkHandler = new NetworkOnly();

    return networkHandler.handle({ event, request });
  },
  "GET",
);
