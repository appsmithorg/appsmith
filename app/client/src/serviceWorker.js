import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim, setCacheNameDetails, skipWaiting } from "workbox-core";
import { registerRoute, Route } from "workbox-routing";
import {
  CacheFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from "workbox-strategies";
import {
  getPrefetchRequest,
  AppsmithApiCacheStrategy,
} from "utils/serviceWorkerUtils";

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

const PREFETCH_API_CACHE_NAME = "prefetch-api-cache-v1";
const appsmithApiCacheStrategy = new AppsmithApiCacheStrategy(
  PREFETCH_API_CACHE_NAME,
);

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
    appsmithApiCacheStrategy.resetCacheAndFetch(prefetchRequest);
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
  async ({ event, request }) => {
    // Check for ongoing request
    const ongoingRequest = appsmithApiCacheStrategy.getOngoingRequest(request);
    if (ongoingRequest) {
      appsmithApiCacheStrategy.setSkipCacheRequest(request);
      return ongoingRequest; // Return the ongoing request
    }

    // Check for cached response
    const cachedResponse =
      await appsmithApiCacheStrategy.getCachedResponse(request);

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
