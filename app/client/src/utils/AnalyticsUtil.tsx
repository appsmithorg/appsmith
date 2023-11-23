// Events
import * as log from "loglevel";
import smartlookClient from "smartlook-client";
import { getAppsmithConfigs } from "@appsmith/configs";
import * as Sentry from "@sentry/react";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { sha256 } from "js-sha256";
import type { EventName } from "@appsmith/utils/analyticsUtilTypes";

declare global {
  interface Window {
    // Zipy is added via script tags in index.html
    zipy: {
      identify: (uid: string, userInfo: Record<string, string>) => void;
      anonymize: () => void;
    };
  }
}

function getApplicationId(location: Location) {
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
            analytics.factory = function (t: any) {
              return function () {
                const e = Array.prototype.slice.call(arguments); //eslint-disable-line prefer-rest-params
                e.unshift(t);
                analytics.push(e);
                return analytics;
              };
            };
          }
          for (let t: any = 0; t < analytics.methods.length; t++) {
            const e = analytics.methods[t];
            analytics[e] = analytics.factory(e);
          }
          analytics.load = function (t: any, e: any) {
            const n = document.createElement("script");
            n.type = "text/javascript";
            n.async = !0;
            // Ref: https://www.notion.so/appsmith/530051a2083040b5bcec15a46121aea3
            n.src = "https://a.appsmith.com/reroute/" + t + "/main.js";
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

    const windowDoc: any = window;
    let finalEventData = eventData;
    const userData = AnalyticsUtil.user;
    const instanceId = AnalyticsUtil.instanceId;
    const appId = getApplicationId(windowDoc.location);
    const { appVersion, segment } = getAppsmithConfigs();
    if (userData) {
      let user: any = {};
      if (segment.apiKey) {
        user = {
          userId: userData.username,
          email: userData.email,
          appId: appId,
          source: "cloud",
        };
      } else {
        const userId = userData.username;
        if (userId !== AnalyticsUtil.cachedUserId) {
          AnalyticsUtil.cachedAnonymoustId = sha256(userId);
          AnalyticsUtil.cachedUserId = userId;
        }
        user = {
          userId: AnalyticsUtil.cachedAnonymoustId,
          source: "ce",
        };
      }
      finalEventData = {
        ...eventData,
        userData: user.userId === ANONYMOUS_USERNAME ? undefined : user,
      };
    }
    finalEventData = { ...finalEventData, instanceId, version: appVersion.id };

    if (windowDoc.analytics) {
      log.debug("Event fired", eventName, finalEventData);
      windowDoc.analytics.track(eventName, finalEventData);
    } else {
      log.debug("Event fired locally", eventName, finalEventData);
    }
  }

  static identifyUser(userData: User) {
    const { segment, sentry, smartLook } = getAppsmithConfigs();
    const windowDoc: any = window;
    const userId = userData.username;
    if (windowDoc.analytics) {
      // This flag is only set on Appsmith Cloud. In this case, we get more detailed analytics of the user
      if (segment.apiKey) {
        const userProperties = {
          email: userData.email,
          name: userData.name,
          userId: userId,
          source: "cloud",
          emailVerified: userData.emailVerified,
        };
        AnalyticsUtil.user = userData;
        log.debug("Identify User " + userId);
        windowDoc.analytics.identify(userId, userProperties);
      } else if (segment.ceKey) {
        // This is a self-hosted instance. Only send data if the analytics are NOT disabled by the user
        if (userId !== AnalyticsUtil.cachedUserId) {
          AnalyticsUtil.cachedAnonymoustId = sha256(userId);
          AnalyticsUtil.cachedUserId = userId;
        }
        const userProperties = {
          userId: AnalyticsUtil.cachedAnonymoustId,
          source: "ce",
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
    const windowDoc: any = window;
    const { segment } = getAppsmithConfigs();
    if (windowDoc.analytics && windowDoc.analytics.user) {
      return windowDoc.analytics.user().anonymousId();
    } else if (segment.enabled) {
      return localStorage.getItem("ajs_anonymous_id")?.replaceAll('"', "");
    }
  }

  static reset() {
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
    (window as any).analytics = undefined;
  }
  static setBlockErrorLogs(value: boolean) {
    AnalyticsUtil.blockErrorLogs = value;
  }
}

export default AnalyticsUtil;
