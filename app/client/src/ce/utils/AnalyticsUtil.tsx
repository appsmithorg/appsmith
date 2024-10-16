// Events
import * as log from "loglevel";
import smartlookClient from "smartlook-client";
import { getAppsmithConfigs } from "ee/configs";
import * as Sentry from "@sentry/react";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { sha256 } from "js-sha256";
import type { EventName } from "ee/utils/analyticsUtilTypes";
import mixpanelClient from "mixpanel-browser";

export function getUserSource() {
  const { cloudHosting, segment } = getAppsmithConfigs();
  const source = cloudHosting || segment.apiKey ? "cloud" : "ce";

  return source;
}

declare global {
  interface Window {
    // Zipy is added via script tags in index.html
    zipy: {
      identify: (uid: string, userInfo: Record<string, string>) => void;
      anonymize: () => void;
    };
  }
}

export const parentContextTypeTokens = ["pkg", "workflow"];

/**
 * Function to check the current URL and return the parent context.
 * For app, function was returning app name due to the way app urls are structured
 * So this function will only return the parent context for pkg and workflow
 * @param location current location object based on URL
 * @returns object {id, type} where type is either pkg or workflow and id is the id of the pkg or workflow
 */
export function getParentContextFromURL(location: Location) {
  const pathSplit = location.pathname.split("/");
  let type = parentContextTypeTokens[0];
  const editorIndex = pathSplit.findIndex((path) =>
    parentContextTypeTokens.includes(path),
  );

  if (editorIndex !== -1) {
    type = pathSplit[editorIndex];

    const id = pathSplit[editorIndex + 1];

    return { id, type };
  }
}

export function getApplicationId(location: Location) {
  const pathSplit = location.pathname.split("/");
  const applicationsIndex = pathSplit.findIndex(
    (path) => path === "applications",
  );
  const appId = pathSplit[applicationsIndex + 1];

  return appId;
}

export enum AnalyticsEventType {
  error = "error",
}

class AnalyticsUtil {
  static cachedAnonymoustId: string;
  static cachedUserId: string;
  static user?: User = undefined;
  static blockTrackEvent: boolean | undefined;
  static instanceId?: string = "";
  static blockErrorLogs = false;

  static initializeSmartLook(id: string) {
    smartlookClient.init(id);
  }

  static async initializeSegment(key: string) {
    const initPromise = new Promise<boolean>((resolve) => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (function init(window: any) {
        const analytics = (window.analytics = window.analytics || []);

        if (!analytics.initialize) {
          if (analytics.invoked) {
            log.error("Segment snippet included twice.");
          } else {
            analytics.invoked = !0;
            analytics.methods = [
              "trackSubmit",
              "trackClick",
              "trackLink",
              "trackForm",
              "pageview",
              "identify",
              "reset",
              "group",
              "track",
              "ready",
              "alias",
              "debug",
              "page",
              "once",
              "off",
              "on",
            ];
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            analytics.factory = function (t: any) {
              return function () {
                const e = Array.prototype.slice.call(arguments); //eslint-disable-line prefer-rest-params

                e.unshift(t);
                analytics.push(e);

                return analytics;
              };
            };
          }

          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (let t: any = 0; t < analytics.methods.length; t++) {
            const e = analytics.methods[t];

            analytics[e] = analytics.factory(e);
          }

          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          analytics.load = function (t: any, e: any) {
            const n = document.createElement("script");

            n.type = "text/javascript";
            n.async = !0;
            // Ref: https://www.notion.so/appsmith/530051a2083040b5bcec15a46121aea3
            n.src = "https://a.appsmith.com/reroute/" + t + "/main.js";
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const a: any = document.getElementsByTagName("script")[0];

            a.parentNode.insertBefore(n, a);
            analytics._loadOptions = e;
          };
          analytics.ready(() => {
            resolve(true);
          });
          setTimeout(() => {
            resolve(false);
          }, 2000);
          analytics.SNIPPET_VERSION = "4.1.0";
          // Ref: https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#batching
          analytics.load(key, {
            integrations: {
              "Segment.io": {
                deliveryStrategy: {
                  strategy: "batching", // The delivery strategy used for sending events to Segment
                  config: {
                    size: 100, // The batch size is the threshold that forces all batched events to be sent once it’s reached.
                    timeout: 1000, // The number of milliseconds that forces all events queued for batching to be sent, regardless of the batch size, once it’s reached
                  },
                },
              },
            },
          });

          if (!AnalyticsUtil.blockTrackEvent) {
            analytics.page();
          }
        }
      })(window);
    });

    return initPromise;
  }

  static logEvent(
    eventName: EventName,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventData: any = {},
    eventType?: AnalyticsEventType,
  ) {
    if (AnalyticsUtil.blockTrackEvent) {
      return;
    }

    if (
      AnalyticsUtil.blockErrorLogs &&
      eventType === AnalyticsEventType.error
    ) {
      return;
    }

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowDoc: any = window;
    let finalEventData = eventData;
    const userData = AnalyticsUtil.user;
    const parentContext = getParentContextFromURL(windowDoc.location);
    const instanceId = AnalyticsUtil.instanceId;
    const appId = getApplicationId(windowDoc.location);
    const { appVersion, segment } = getAppsmithConfigs();

    if (userData) {
      const source = getUserSource();
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let user: any = {};

      if (segment.apiKey) {
        user = {
          userId: userData.username,
          email: userData.email,
          appId,
        };
      } else {
        const userId = userData.username;

        if (userId !== AnalyticsUtil.cachedUserId) {
          AnalyticsUtil.cachedAnonymoustId = sha256(userId);
          AnalyticsUtil.cachedUserId = userId;
        }

        user = {
          userId: AnalyticsUtil.cachedAnonymoustId,
        };
      }

      finalEventData = {
        ...eventData,
        userData:
          user.userId === ANONYMOUS_USERNAME ? undefined : { ...user, source },
      };
    }

    finalEventData = {
      ...finalEventData,
      instanceId,
      version: appVersion.id,
      ...(parentContext ? { parentContext } : {}),
    };

    if (windowDoc.analytics) {
      log.debug("Event fired", eventName, finalEventData);
      windowDoc.analytics.track(eventName, finalEventData);
    } else {
      log.debug("Event fired locally", eventName, finalEventData);
    }
  }

  static identifyUser(userData: User, sendAdditionalData?: boolean) {
    const { appVersion, mixpanel, segment, sentry, smartLook } =
      getAppsmithConfigs();
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowDoc: any = window;
    const userId = userData.username;

    if (windowDoc.analytics) {
      const source = getUserSource();

      // This flag is only set on Appsmith Cloud. In this case, we get more detailed analytics of the user
      if (segment.apiKey) {
        const userProperties = {
          userId: userId,
          source,
          email: userData.email,
          name: userData.name,
          emailVerified: userData.emailVerified,
        };

        AnalyticsUtil.user = userData;
        log.debug("Identify User " + userId);
        windowDoc.analytics.identify(userId, userProperties);

        // Init mixpanel to record session recordings
        mixpanelClient.init(mixpanel.apiKey, {
          record_sessions_percent: 100,
        });

        // Middleware to add Mixpanel's session recording properties to Segment events
        // https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/middleware/
        windowDoc.analytics.addSourceMiddleware(
          (middleware: {
            payload: {
              type: "track" | "page" | "identify";
              obj: {
                properties: Record<string, unknown>;
                anonymousId: string;
                userId: string;
              };
            };
            next: (payload: unknown) => void;
          }) => {
            if (
              middleware.payload.type === "track" ||
              middleware.payload.type === "page"
            ) {
              if (mixpanelClient) {
                const segmentDeviceId = middleware.payload.obj.anonymousId;

                //simplified id
                mixpanelClient.register({
                  $device_id: segmentDeviceId,
                  distinct_id: "$device:" + segmentDeviceId,
                });

                // Add session recording properties to the event
                const sessionReplayProperties =
                  mixpanelClient.get_session_recording_properties();

                middleware.payload.obj.properties = {
                  ...middleware.payload.obj.properties,
                  ...sessionReplayProperties,
                };
              }
            }

            if (middleware.payload.type === "identify") {
              if (mixpanelClient) {
                const userId = middleware.payload.obj.userId;

                mixpanelClient.identify(userId);
              }
            }

            middleware.next(middleware.payload);
          },
        );
      } else if (segment.ceKey) {
        // This is a self-hosted instance. Only send data if the analytics are NOT disabled by the user
        if (userId !== AnalyticsUtil.cachedUserId) {
          AnalyticsUtil.cachedAnonymoustId = sha256(userId);
          AnalyticsUtil.cachedUserId = userId;
        }

        const userProperties = {
          userId: AnalyticsUtil.cachedAnonymoustId,
          source,
          ...(sendAdditionalData
            ? {
                id: AnalyticsUtil.cachedAnonymoustId,
                email: userData.email,
                version: `Appsmith ${appVersion.edition} ${appVersion.id}`,
                instanceId: AnalyticsUtil.instanceId,
              }
            : {}),
        };

        log.debug(
          "Identify Anonymous User " + AnalyticsUtil.cachedAnonymoustId,
        );
        windowDoc.analytics.identify(
          AnalyticsUtil.cachedAnonymoustId,
          userProperties,
        );
      }
    }

    if (sentry.enabled) {
      Sentry.configureScope(function (scope) {
        scope.setUser({
          id: userId,
          username: userData.username,
          email: userData.email,
        });
      });
    }

    if (smartLook.enabled) {
      smartlookClient.identify(userId, { email: userData.email });
    }

    // If zipy was included, identify this user on the platform
    if (window.zipy && userId) {
      window.zipy.identify(userId, {
        email: userData.email,
        username: userData.username,
      });
    }

    AnalyticsUtil.blockTrackEvent = false;
  }

  static initInstanceId(instanceId: string) {
    AnalyticsUtil.instanceId = instanceId;
  }

  static getAnonymousId() {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowDoc: any = window;
    const { segment } = getAppsmithConfigs();

    if (windowDoc.analytics && windowDoc.analytics.user) {
      return windowDoc.analytics.user().anonymousId();
    } else if (segment.enabled) {
      return localStorage.getItem("ajs_anonymous_id")?.replaceAll('"', "");
    }
  }

  static reset() {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowDoc: any = window;

    if (windowDoc.Intercom) {
      windowDoc.Intercom("shutdown");
    }

    windowDoc.analytics && windowDoc.analytics.reset();
    windowDoc.mixpanel && windowDoc.mixpanel.reset();
    window.zipy && window.zipy.anonymize();
  }

  static removeAnalytics() {
    AnalyticsUtil.blockTrackEvent = false;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).analytics = undefined;
  }

  static setBlockErrorLogs(value: boolean) {
    AnalyticsUtil.blockErrorLogs = value;
  }
}

export default AnalyticsUtil;
