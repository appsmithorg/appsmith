// Events
import * as log from "loglevel";

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
  | "DUPLICATE_API"
  | "MOVE_API"
  | "API_SELECT"
  | "CREATE_API_CLICK"
  | "AUTO_COMPELTE_SHOW"
  | "AUTO_COMPLETE_SELECT"
  | "CREATE_APP_CLICK"
  | "CREATE_APP"
  | "CREATE_DATA_SOURCE_CLICK"
  | "SAVE_DATA_SOURCE"
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
  static initializeHotjar(id: string, sv: string) {
    (function init(h: any, o: any, t: any, j: any, a?: any, r?: any) {
      h.hj =
        h.hj ||
        function() {
          (h.hj.q = h.hj.q || []).push(arguments); //eslint-disable-line prefer-rest-params
        };
      h._hjSettings = { hjid: id, hjsv: sv };
      a = o.getElementsByTagName("head")[0];
      r = o.createElement("script");
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, "//static.hotjar.com/c/hotjar-", ".js?sv=");
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
          currentOrgId: userData.currentOrganization.id,
          currentOrgName: userData.currentOrganization.name,
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
    if (windowDoc.analytics) {
      windowDoc.analytics.identify(userId, userData);
    }
  }

  static reset() {
    const windowDoc: any = window;
    windowDoc.analytics && windowDoc.analytics.reset();
    windowDoc.mixpanel && windowDoc.mixpanel.reset();
  }
}

export default AnalyticsUtil;
