import {
  PrecacheController,
  PrecacheRoute,
  precacheAndRoute,
} from "workbox-precaching";
import { clientsClaim, setCacheNameDetails, skipWaiting } from "workbox-core";
import { registerRoute, Route } from "workbox-routing";
import {
  CacheFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import log from "loglevel";

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
  providers: new RegExp(/v1\/marketplace\/(providers|templates)/),
};

//////////////////////////////////////////////////////////
// Note: if you need to filter out some files from precaching,
// do that in InjectManifest’s `exclude` plugin options
const toPrecache = self.__WB_MANIFEST;

const isChromium =
  navigator.userAgentData &&
  navigator.userAgentData.brands.some((data) => data.brand == "Chromium");
if (isChromium) {
  // In Chromium, we use a custom PrecacheController strategy that starts caching pages
  // on `activate` instead of `install`. This code is based on
  // https://developer.chrome.com/docs/workbox/modules/workbox-precaching/#using-precachecontroller-directly
  // but uses the `activate` event instead of the `install` one.
  // The `activate` event is fired after the `install` one, and
  // (based on experiments) it’s also fired only once per installation.
  //
  // This works around a problematic V8 heuristic. V8 generates a "full" code cache
  // for scripts cached from the `install` event (see https://v8.dev/blog/code-caching-for-devs#use-service-worker-caches).
  // The "full" code cache makes the execution of the app a bit faster
  // (V8 doesn’t need to compile functions on demand) but is much, much slower
  // to deserialize, adding up to a several-second app startup delay
  // (see https://bugs.chromium.org/p/chromium/issues/detail?id=1428605).
  //
  // We haven’t tested whether other browsers are affected by the same issue.
  //
  // Hopefully, this branch of code could be deleted when https://bugs.chromium.org/p/chromium/issues/detail?id=1428605
  // is resolved.
  const precacheController = new PrecacheController();
  precacheController.addToCacheList(toPrecache);

  let installEvent;
  self.addEventListener("install", (event) => {
    installEvent = event;
  });

  let isActivating = false;
  self.addEventListener("activate", (activateEvent) => {
    isActivating = true;

    activateEvent.waitUntil(
      (async function () {
        // Make the `waitUntil` function a noop – otherwise, it throws
        // when called outside of the `install` event handler.
        installEvent.waitUntil = () => {
          /* Do nothing */
        };

        // precacheController.install() *has* to receive the `install` event,
        // or it won’t save the preloaded assets to the cache. This is true
        // as of `workbox-precaching@npm:6.5.3`. The relevant check lives here:
        // https://github.com/GoogleChrome/workbox/blob/95f97a207fd51efb3f8a653f6e3e58224183a778/packages/workbox-precaching/src/PrecacheStrategy.ts#L101
        await precacheController.install(installEvent);
        await precacheController.activate(activateEvent);

        isActivating = false;
      })(),
    );
  });

  // Note: the solution we have here is pretty fragile because it relies on us knowing PrecacheController
  // internals (eg we know that `precacheController.install()` has to receive an `install` event, and
  // it doesn’t work with `activate`). This sanity check exists to make sure we don’t silently break
  // service worker precaching when we upgrade the workbox version.
  self.addEventListener("fetch", async (event) => {
    const url = new URL(event.request.url);
    if (
      url.origin.includes(".appsmith.com") &&
      url.pathname.startsWith("/static/js/")
    ) {
      const response = await caches.match(event.request);

      if (!response && !isActivating) {
        log.error(
          "[service worker] Sanity check failed: no cached response found for " +
            event.request.url +
            ". If you see this regularly, it’s likely the service worker preloading got broken.",
        );
      }
    }
  });

  const precacheRoute = new PrecacheRoute(precacheController);
  registerRoute(precacheRoute);
} else {
  // In non-Chromium browsers, we use the default strategy. E.g., as of Mar 2023,
  // in Firefox, the Chromium strategy causes chunk requests to hang while the `activate`
  // event handler is busy caching everything.
  precacheAndRoute(toPrecache);
}

//////////////////////////////////////////////////////////

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
  ({ url }) => regexMap.providers.test(url.pathname),
  new CacheFirst({
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 1 * 60 * 60,
      }),
    ],
  }),
);

registerRoute(
  new Route(({ request, sameOrigin }) => {
    return sameOrigin && request.destination === "document";
  }, new NetworkOnly()),
);
