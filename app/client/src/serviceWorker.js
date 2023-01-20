/* eslint-disable */
import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim, setCacheNameDetails, skipWaiting } from "workbox-core";
import { registerRoute, Route } from "workbox-routing";
import {
  CacheFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

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

/* eslint-disable no-restricted-globals */
const toPrecache = self.__WB_MANIFEST.filter(
  (file) => !file.url.includes("index.html"),
);
precacheAndRoute(toPrecache);

self.__WB_DISABLE_DEV_DEBUG_LOGS = false;
skipWaiting();
clientsClaim();

registerRoute(({ request }) => {
  return request.url.indexOf('/windowProxy/') !== -1;
}, function (event) {
  return event.request.json().then((reqJSON) => {
    return new Promise(function (resolve, reject) {
      var channel = new MessageChannel();
      channel.port1.onmessage = function (event) {
        console.log("Received response for :");
        console.log({ res: event.data });
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(new Response(JSON.stringify(event.data)));
        }
        channel.port1.close();
        channel.port2.close();
      };
      self.clients.matchAll({
        type: 'window',
      }).then((clients) => {
        if (clients && clients.length) {
          clients[0].postMessage(
            reqJSON, [channel.port2]
          );
        }
      });
    })
  });
}, "POST");

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