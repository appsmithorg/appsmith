// Events
import * as log from "loglevel";
import FeatureFlag from "./featureFlags";
import smartlookClient from "smartlook-client";
import { getAppsmithConfigs } from "configs";
import * as Sentry from "@sentry/react";
import { ANONYMOUS_USERNAME, User } from "../constants/userConstants";
import { sha256 } from "js-sha256";

export type EventLocation =
  | "LIGHTNING_MENU"
  | "API_PANE"
  | "QUERY_PANE"
  | "QUERY_TEMPLATE";

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
  | "CREATE_ACTION"
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
  | "RUN_QUERY_CLICK"
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
  | "SAVE_DATA_SOURCE_CLICK"
  | "TEST_DATA_SOURCE_SUCCESS"
  | "TEST_DATA_SOURCE_CLICK"
  | "CREATE_QUERY_CLICK"
  | "NAVIGATE"
  | "PAGE_LOAD"
  | "NAVIGATE_EDITOR"
  | "PROPERTY_PANE_OPEN"
  | "PROPERTY_PANE_CLOSE"
  | "PROPERTY_PANE_OPEN_CLICK"
  | "PROPERTY_PANE_CLOSE_CLICK"
  | "WIDGET_DELETE_UNDO"
  | "WIDGET_COPY_VIA_SHORTCUT"
  | "WIDGET_COPY"
  | "WIDGET_CUT_VIA_SHORTCUT"
  | "WIDGET_PASTE"
  | "WIDGET_DELETE_VIA_SHORTCUT"
  | "OPEN_HELP"
  | "INVITE_USER"
  | "ROUTE_CHANGE"
  | "PROPERTY_PANE_CLOSE_CLICK"
  | "APPLICATIONS_PAGE_LOAD"
  | "EXECUTE_ACTION"
  | "WELCOME_TOUR_CLICK"
  | "ONBOARDING_WELCOME"
  | "ONBOARDING_START_BUILDING"
  | "ONBOARDING_INTRODUCTION"
  | "ONBOARDING_ADD_QUERY"
  | "ONBOARDING_RUN_QUERY"
  | "ONBOARDING_ADD_WIDGET_CLICK"
  | "ONBOARDING_ADD_WIDGET_TABLE"
  | "ONBOARDING_ADD_WIDGET_INPUT"
  | "ONBOARDING_ONSUBMIT_SUCCESS"
  | "ONBOARDING_BINDING_HINT"
  | "ONBOARDING_CHEAT"
  | "ONBOARDING_SUCCESSFUL_BINDING"
  | "ONBOARDING_DEPLOY"
  | "ONBOARDING_SKIP_NOW"
  | "ONBOARDING_NEXT_MISSION"
  | "ONBOARDING_GO_HOME"
  | "END_ONBOARDING"
  | "ONBOARDING_COMPLETE"
  | "OPEN_OMNIBAR"
  | "CLOSE_OMNIBAR"
  | "NAVIGATE_TO_ENTITY_FROM_OMNIBAR"
  | "PAGE_SAVE"
  | "CORRECT_BAD_BINDING";

function getApplicationId(location: Location) {
  const pathSplit = location.pathname.split("/");
  const applicationsIndex = pathSplit.findIndex(
    (path) => path === "applications",
  );
  const appId = pathSplit[applicationsIndex + 1];

  return appId;
}

class AnalyticsUtil {
  static cachedAnonymoustId: string;
  static cachedUserId: string;
  static user?: User = undefined;
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

  static logEvent(eventName: EventName, eventData: any = {}) {
    const windowDoc: any = window;
    let finalEventData = eventData;
    const userData = AnalyticsUtil.user;
    const appId = getApplicationId(windowDoc.location);
    if (userData) {
      const { segment } = getAppsmithConfigs();
      const app = (userData.applications || []).find(
        (app: any) => app.id === appId,
      );
      let user: any = {};
      if (segment.enabled && segment.apiKey) {
        user = {
          userId: userData.username,
          email: userData.email,
          currentOrgId: userData.currentOrganizationId,
          appId: appId,
          appName: app ? app.name : undefined,
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

    if (windowDoc.analytics) {
      log.debug("Event fired", eventName, finalEventData);
      windowDoc.analytics.track(eventName, finalEventData);
    }
  }

  static identifyUser(userData: User) {
    const { segment, smartLook } = getAppsmithConfigs();
    const windowDoc: any = window;
    const userId = userData.username;
    FeatureFlag.identify(userData);
    if (windowDoc.analytics) {
      // This flag is only set on Appsmith Cloud. In this case, we get more detailed analytics of the user
      if (segment.apiKey) {
        const userProperties = {
          email: userData.email,
          name: userData.name,
          userId: userId,
          source: "cloud",
        };
        AnalyticsUtil.user = userData;
        log.debug("Identify User " + userId);
        windowDoc.analytics.identify(userId, userProperties);
      } else if (segment.ceKey) {
        // This is a self-hosted instance. Only send data if the analytics are NOT disabled by the user
        // This is done by setting environment variable APPSMITH_DISABLE_TELEMETRY in the docker.env file
        if (userId !== AnalyticsUtil.cachedUserId) {
          AnalyticsUtil.cachedAnonymoustId = sha256(userId);
          AnalyticsUtil.cachedUserId = userId;
        }
        const userProperties = {
          userId: AnalyticsUtil.cachedUserId,
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
    Sentry.configureScope(function(scope) {
      scope.setUser({
        id: userId,
        username: userData.username,
        email: userData.email,
      });
    });

    if (smartLook.enabled) {
      smartlookClient.identify(userId, { email: userData.email });
    }
  }

  static reset() {
    const windowDoc: any = window;
    if (windowDoc.Intercom) {
      windowDoc.Intercom("shutdown");
    }
    windowDoc.analytics && windowDoc.analytics.reset();
    windowDoc.mixpanel && windowDoc.mixpanel.reset();
  }
}

export default AnalyticsUtil;
