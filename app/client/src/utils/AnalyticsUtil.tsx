// Events
import * as log from "loglevel";
import FeatureFlag from "./featureFlags";
import smartlookClient from "smartlook-client";
import { getAppsmithConfigs } from "configs";
import * as Sentry from "@sentry/react";

export type EventName =
  | "LOGIN_CLICK"
  | "SIGNUP_CLICK"
  | "PAGE_VIEW"
  | "ADD_COMPONENT"
  | "DELETE_COMPONENT"
  | "RESIZE_COMPONENT"
  | "WIDGET_DRAG"
  | "WIDGET_DROP"
  | "WIDGET_DELETE"
  | "WIDGET_RESIZE_START"
  | "WIDGET_RESIZE_END"
  | "WIDGET_PROPERTY_UPDATE"
  | "WIDGET_TOGGLE_JS_PROP"
  | "WIDGET_CARD_DRAG"
  | "WIDGET_CARD_DROP"
  | "CREATE_PAGE"
  | "PAGE_RENAME"
  | "PAGE_SWITCH"
  | "DELETE_PAGE"
  | "SIDEBAR_NAVIGATION"
  | "PUBLISH_APP"
  | "PREVIEW_APP"
  | "EDITOR_OPEN"
  | "CREATE_API"
  | "SAVE_API"
  | "SAVE_API_CLICK"
  | "RUN_API"
  | "RUN_API_CLICK"
  | "DELETE_API"
  | "DELETE_API_CLICK"
  | "IMPORT_API"
  | "EXPAND_API"
  | "IMPORT_API_CLICK"
  | "MOVE_API_CLICK"
  | "ADD_API_PAGE"
  | "DUPLICATE_API"
  | "DUPLICATE_API_CLICK"
  | "RUN_QUERY"
  | "DELETE_QUERY"
  | "SAVE_QUERY"
  | "MOVE_API"
  | "3P_PROVIDER_CLICK"
  | "API_SELECT"
  | "CREATE_API_CLICK"
  | "AUTO_COMPELTE_SHOW"
  | "AUTO_COMPLETE_SELECT"
  | "CREATE_APP_CLICK"
  | "CREATE_APP"
  | "CREATE_DATA_SOURCE_CLICK"
  | "SAVE_DATA_SOURCE"
  | "CREATE_QUERY_CLICK"
  | "NAVIGATE"
  | "PAGE_LOAD"
  | "NAVIGATE_EDITOR"
  | "PROPERTY_PANE_OPEN"
  | "PROPERTY_PANE_CLOSE"
  | "PROPERTY_PANE_OPEN_CLICK"
  | "PROPERTY_PANE_CLOSE_CLICK";

export type Gender = "MALE" | "FEMALE";
export interface User {
  userId: string;
  name: string;
  email: string;
  gender: Gender;
}

function getApplicationId(location: Location) {
  const pathSplit = location.pathname.split("/");
  const applicationsIndex = pathSplit.findIndex(
    path => path === "applications",
  );
  const appId = pathSplit[applicationsIndex + 1];

  return appId;
}

class AnalyticsUtil {
  static user: any = undefined;
  static initializeSmartLook(id: string) {
    smartlookClient.init(id);
  }

  static initializeSegment(key: string) {
    (function init(window: any) {
      const analytics = (window.analytics = window.analytics || []);
      if (!analytics.initialize) {
        if (analytics.invoked) {
          window.console &&
            console.error &&
            console.error("Segment snippet included twice.");
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
          analytics.factory = function(t: any) {
            return function() {
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
        analytics.load = function(t: any, e: any) {
          const n = document.createElement("script");
          n.type = "text/javascript";
          n.async = !0;
          n.src =
            "https://cdn.segment.com/analytics.js/v1/" +
            t +
            "/analytics.min.js";
          const a: any = document.getElementsByTagName("script")[0];
          a.parentNode.insertBefore(n, a);
          analytics._loadOptions = e;
        };
        analytics.SNIPPET_VERSION = "4.1.0";
        analytics.load(key);
        analytics.page();
      }
    })(window);
  }

  static logEvent(eventName: EventName, eventData: any) {
    const windowDoc: any = window;
    let finalEventData = eventData;
    const userData = AnalyticsUtil.user;
    const appId = getApplicationId(windowDoc.location);
    if (userData) {
      const app = (userData.applications || []).find(
        (app: any) => app.id === appId,
      );
      finalEventData = {
        ...finalEventData,
        userData: {
          userId: userData.id,
          email: userData.email,
          currentOrgId: userData.currentOrganizationId,
          appId: appId,
          appName: app ? app.name : undefined,
        },
      };
    }
    if (windowDoc.analytics) {
      windowDoc.analytics.track(eventName, finalEventData);
    } else {
      log.debug("Event fired", eventName, finalEventData);
    }
  }

  static identifyUser(userId: string, userData: User) {
    const windowDoc: any = window;
    AnalyticsUtil.user = userData;
    FeatureFlag.identify(userData);
    if (windowDoc.analytics) {
      windowDoc.analytics.identify(userId, {
        email: userData.email,
        name: userData.name,
        userId: userId,
      });
    }
    Sentry.configureScope(function(scope) {
      scope.setUser({
        id: userData.userId,
        username: userData.email,
        email: userData.email,
      });
    });
    const { smartLook } = getAppsmithConfigs();
    if (smartLook.enabled) {
      smartlookClient.identify(userData.email, { email: userData.email });
    }
  }

  static reset() {
    const windowDoc: any = window;
    windowDoc.analytics && windowDoc.analytics.reset();
    windowDoc.mixpanel && windowDoc.mixpanel.reset();
  }
}

export default AnalyticsUtil;
