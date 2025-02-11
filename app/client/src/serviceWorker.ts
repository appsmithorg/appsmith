import { clientsClaim, skipWaiting } from "workbox-core";
import { registerRoute, Route } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import {
  cachedApiUrlRegex,
  getApplicationParamsFromUrl,
  getPrefetchRequests,
  PrefetchApiService,
} from "ee/utils/serviceWorkerUtils";
import type { RouteHandlerCallback } from "workbox-core/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const wbManifest = (self as any).__WB_MANIFEST;

// Delete the old pre-fetch cache. All static files are now cached by cache control headers.
caches.delete("appsmith-precache-v1");

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
