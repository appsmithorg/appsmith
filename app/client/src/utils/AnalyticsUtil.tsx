// Events
import * as log from "loglevel";
import smartlookClient from "smartlook-client";
import { getAppsmithConfigs } from "@appsmith/configs";
import * as Sentry from "@sentry/react";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { sha256 } from "js-sha256";

declare global {
  interface Window {
    // Zipy is added via script tags in index.html
    zipy: {
      identify: (uid: string, userInfo: Record<string, string>) => void;
      anonymize: () => void;
    };
  }
}

export type EventLocation =
  | "LIGHTNING_MENU"
  | "API_PANE"
  | "QUERY_PANE"
  | "QUERY_TEMPLATE"
  | "QUICK_COMMANDS"
  | "OMNIBAR"
  | "SUBMENU"
  | "ACTION_SELECTOR"
  | "ENTITY_EXPLORER"
  | "KEYBOARD_SHORTCUT"
  | "JS_OBJECT_GUTTER_RUN_BUTTON" // Gutter: https://codemirror.net/examples/gutter/
  | "JS_OBJECT_MAIN_RUN_BUTTON"
  | "JS_OBJECT_RESPONSE_RUN_BUTTON";

export type EventName =
  | "APP_CRASH"
  | "SWITCH_DATASOURCE"
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
  | "SAVE_SAAS"
  | "DELETE_SAAS"
  | "RUN_SAAS_API"
  | "SAVE_API"
  | "SAVE_API_CLICK"
  | "RUN_API"
  | "RUN_API_CLICK"
  | "RUN_API_SHORTCUT"
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
  | "RUN_QUERY_SHORTCUT"
  | "DELETE_QUERY"
  | "SAVE_QUERY"
  | "MOVE_API"
  | "3P_PROVIDER_CLICK"
  | "API_SELECT"
  | "CREATE_API_CLICK"
  | "AUTO_COMPLETE_SHOW"
  | "AUTO_COMPLETE_SELECT"
  | "CREATE_APP_CLICK"
  | "CREATE_APP"
  | "CREATE_DATA_SOURCE_CLICK"
  | "SAVE_DATA_SOURCE"
  | "SAVE_DATA_SOURCE_CLICK"
  | "CONSOLE_LOG_CREATED"
  | "TEST_DATA_SOURCE_SUCCESS"
  | "TEST_DATA_SOURCE_CLICK"
  | "UPDATE_DATASOURCE"
  | "CREATE_QUERY_CLICK"
  | "NAVIGATE"
  | "PAGE_LOAD"
  | "NAVIGATE_EDITOR"
  | "PROPERTY_PANE_OPEN"
  | "PROPERTY_PANE_CLOSE"
  | "PROPERTY_PANE_OPEN_CLICK"
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
  | "GUIDED_TOUR_RATING"
  | "GUIDED_TOUR_REACHED_STEP"
  | "END_GUIDED_TOUR_CLICK"
  | "OPEN_OMNIBAR"
  | "CLOSE_OMNIBAR"
  | "NAVIGATE_TO_ENTITY_FROM_OMNIBAR"
  | "PAGE_SAVE"
  | "CORRECT_BAD_BINDING"
  | "OPEN_DEBUGGER"
  | "DEBUGGER_TAB_SWITCH"
  | "DEBUGGER_FILTER_CHANGED"
  | "DEBUGGER_ENTITY_NAVIGATION"
  | "GSHEET_AUTH_INIT"
  | "GSHEET_AUTH_COMPLETE"
  | "CYCLICAL_DEPENDENCY_ERROR"
  | "DISCORD_LINK_CLICK"
  | "INTERCOM_CLICK"
  | "BINDING_SUCCESS"
  | "ENTITY_BINDING_SUCCESS"
  | "APP_MENU_OPTION_CLICK"
  | "SLASH_COMMAND"
  | "DEBUGGER_NEW_ERROR"
  | "DEBUGGER_RESOLVED_ERROR"
  | "DEBUGGER_NEW_ERROR_MESSAGE"
  | "DEBUGGER_RESOLVED_ERROR_MESSAGE"
  | "DEBUGGER_LOG_ITEM_EXPAND"
  | "DEBUGGER_HELP_CLICK"
  | "DEBUGGER_CONTEXT_MENU_CLICK"
  | "ADD_MOCK_DATASOURCE_CLICK"
  | "GEN_CRUD_PAGE_CREATE_NEW_DATASOURCE"
  | "GEN_CRUD_PAGE_FORM_SUBMIT"
  | "GEN_CRUD_PAGE_EDIT_DATASOURCE_CONFIG"
  | "GEN_CRUD_PAGE_SELECT_DATASOURCE"
  | "GEN_CRUD_PAGE_SELECT_TABLE"
  | "GEN_CRUD_PAGE_SELECT_SEARCH_COLUMN"
  | "BUILD_FROM_SCRATCH_ACTION_CARD_CLICK"
  | "GEN_CRUD_PAGE_ACTION_CARD_CLICK"
  | "GEN_CRUD_PAGE_DATA_SOURCE_CLICK"
  | "DATASOURCE_CARD_GEN_CRUD_PAGE_ACTION"
  | "DATASOURCE_CARD_DELETE_ACTION"
  | "DATASOURCE_CARD_EDIT_ACTION"
  | "UNSUPPORTED_PLUGIN_DIALOG_BACK_ACTION"
  | "UNSUPPORTED_PLUGIN_DIALOG_CONTINUE_ACTION"
  | "SELECT_IN_CANVAS_CLICK"
  | "WIDGET_SELECTED_VIA_SNIPING_MODE"
  | "SUGGESTED_WIDGET_CLICK"
  | "ASSOCIATED_ENTITY_CLICK"
  | "CREATE_DATA_SOURCE_AUTH_API_CLICK"
  | "CONNECT_DATA_CLICK"
  | "RESPONSE_TAB_RUN_ACTION_CLICK"
  | "ASSOCIATED_ENTITY_DROPDOWN_CLICK"
  | "PAGES_LIST_LOAD"
  | "WIDGET_GROUP"
  | "CLOSE_GEN_PAGE_INFO_MODAL"
  | "COMMENTS_TOGGLE_MODE"
  | "COMMENTS_ONBOARDING_SKIP_BUTTON_CLICK"
  | "COMMENTS_ONBOARDING_STEP_CHANGE"
  | "COMMENTS_ONBOARDING_SUBMIT_BUTTON_CLICK"
  | "COMMENTS_ONBOARDING_MODAL_DISMISSED"
  | "COMMENTS_ONBOARDING_MODAL_TRIGGERED"
  | "REPLAY_UNDO"
  | "REPLAY_REDO"
  | "URL_COPIED"
  | "SNIPPET_CUSTOMIZE"
  | "SNIPPET_EXECUTE"
  | "SNIPPET_FILTER"
  | "SNIPPET_COPIED"
  | "SNIPPET_LOOKUP"
  | "SIGNPOSTING_SKIP"
  | "SIGNPOSTING_CREATE_DATASOURCE_CLICK"
  | "SIGNPOSTING_CREATE_QUERY_CLICK"
  | "SIGNPOSTING_ADD_WIDGET_CLICK"
  | "SIGNPOSTING_CONNECT_WIDGET_CLICK"
  | "SIGNPOSTING_PUBLISH_CLICK"
  | "SIGNPOSTING_BUILD_APP_CLICK"
  | "SIGNPOSTING_WELCOME_TOUR_CLICK"
  | "GS_BRANCH_MORE_MENU_OPEN"
  | "GIT_DISCARD_WARNING"
  | "GIT_DISCARD_CANCEL"
  | "GIT_DISCARD"
  | "GS_OPEN_BRANCH_LIST_POPUP"
  | "GS_CREATE_NEW_BRANCH"
  | "GS_SYNC_BRANCHES"
  | "GS_CONNECT_GIT_CLICK"
  | "GS_SETTING_CLICK"
  | "GS_DISCONNECT_GIT_CLICK"
  | "GS_COMMIT_AND_PUSH_BUTTON_CLICK"
  | "GS_LAST_DEPLOYED_PREVIEW_LINK_CLICK"
  | "GS_PULL_GIT_CLICK"
  | "GS_DEPLOY_GIT_CLICK"
  | "GS_DEPLOY_GIT_MODAL_TRIGGERED"
  | "GS_MERGE_GIT_MODAL_TRIGGERED"
  | "GS_REPO_LIMIT_ERROR_MODAL_TRIGGERED"
  | "GS_GIT_DOCUMENTATION_LINK_CLICK"
  | "GS_MERGE_CHANGES_BUTTON_CLICK"
  | "GS_REPO_URL_EDIT"
  | "GS_MATCHING_REPO_NAME_ON_GIT_DISCONNECT_MODAL"
  | "GS_GENERATE_KEY_BUTTON_CLICK"
  | "GS_COPY_SSH_KEY_BUTTON_CLICK"
  | "GS_DEFAULT_CONFIGURATION_EDIT_BUTTON_CLICK"
  | "GS_DEFAULT_CONFIGURATION_CHECKBOX_TOGGLED"
  | "GS_CONNECT_BUTTON_ON_GIT_SYNC_MODAL_CLICK"
  | "GS_IMPORT_VIA_GIT_CARD_CLICK"
  | "GS_CONTACT_SALES_CLICK"
  | "GS_REGENERATE_SSH_KEY_CONFIRM_CLICK"
  | "GS_REGENERATE_SSH_KEY_MORE_CLICK"
  | "GS_SWITCH_BRANCH"
  | "ADMIN_SETTINGS_CLICK"
  | "ADMIN_SETTINGS_RESET"
  | "ADMIN_SETTINGS_SAVE"
  | "ADMIN_SETTINGS_ERROR"
  | "ADMIN_SETTINGS_DISCONNECT_AUTH_METHOD"
  | "ADMIN_SETTINGS_UPGRADE_AUTH_METHOD"
  | "ADMIN_SETTINGS_EDIT_AUTH_METHOD"
  | "ADMIN_SETTINGS_ENABLE_AUTH_METHOD"
  | "ADMIN_SETTINGS_UPGRADE_HOOK"
  | "BILLING_UPGRADE_ADMIN_SETTINGS"
  | "AUDIT_LOGS_UPGRADE_ADMIN_SETTINGS"
  | "GAC_UPGRADE_CLICK_ADMIN_SETTINGS"
  | "REFLOW_BETA_FLAG"
  | "CONTAINER_JUMP"
  | "CONNECT_GIT_CLICK"
  | "REPO_URL_EDIT"
  | "GENERATE_KEY_BUTTON_CLICK"
  | "COPY_SSH_KEY_BUTTON_CLICK"
  | "LEARN_MORE_LINK_FOR_REMOTEURL_CLICK"
  | "LEARN_MORE_LINK_FOR_SSH_CLICK"
  | "DEFAULT_CONFIGURATION_EDIT_BUTTON_CLICK"
  | "DEFAULT_CONFIGURATION_CHECKBOX_TOGGLED"
  | "CONNECT_BUTTON_ON_GIT_SYNC_MODAL_CLICK"
  | "DATASOURCE_AUTH_COMPLETE"
  | "APP_THEMING_CHOOSE_THEME"
  | "APP_THEMING_APPLY_THEME"
  | "APP_THEMING_CUSTOMIZE_THEME"
  | "APP_THEMING_SAVE_THEME_START"
  | "APP_THEMING_SAVE_THEME_SUCCESS"
  | "APP_THEMING_DELETE_THEME"
  | "RECONNECTING_DATASOURCE_ITEM_CLICK"
  | "ADD_MISSING_DATASOURCE_LINK_CLICK"
  | "RECONNECTING_SKIP_TO_APPLICATION_BUTTON_CLICK"
  | "TEMPLATE_FILTER_SELECTED"
  | "MANUAL_UPGRADE_CLICK"
  | "PAGE_NOT_FOUND"
  | "SIMILAR_TEMPLATE_CLICK"
  | "TEMPLATES_TAB_CLICK"
  | "PROPERTY_PANE_KEYPRESS"
  | "PAGE_NAME_CLICK"
  | "BACK_BUTTON_CLICK"
  | "WIDGET_TAB_CLICK"
  | "ENTITY_EXPLORER_CLICK"
  | "ADMIN_SETTINGS_UPGRADE_WATERMARK"
  | "ADMIN_SETTINGS_UPGRADE"
  | "PRETTIFY_CODE_MANUAL_TRIGGER"
  | "PRETTIFY_CODE_KEYBOARD_SHORTCUT"
  | "JS_OBJECT_CREATED"
  | "JS_OBJECT_FUNCTION_ADDED"
  | "JS_OBJECT_FUNCTION_RUN"
  | "JS_OBJECT_SETTINGS_CHANGED"
  | "SHOW_BINDINGS_TRIGGERED"
  | "BINDING_COPIED"
  | "AUTO_HEIGHT_OVERLAY_HANDLES_UPDATE"
  | "ENTITY_EXPLORER_ADD_PAGE_CLICK"
  | "CANVAS_BLANK_PAGE_CTA_CLICK"
  | AUDIT_LOGS_EVENT_NAMES
  | GAC_EVENT_NAMES
  | "BRANDING_UPGRADE_CLICK"
  | "BRANDING_PROPERTY_UPDATE"
  | "BRANDING_SUBMIT_CLICK"
  | "Cmd+Click Navigation"
  | "WIDGET_PROPERTY_SEARCH"
  | "PEEK_OVERLAY_OPENED"
  | "PEEK_OVERLAY_COLLAPSE_EXPAND_CLICK"
  | "PEEK_OVERLAY_VALUE_COPIED"
  | LIBRARY_EVENTS
  | "APP_SETTINGS_SECTION_CLICK"
  | APP_NAVIGATION_EVENT_NAMES
  | "PRETTIFY_AND_SAVE_KEYBOARD_SHORTCUT";

export type LIBRARY_EVENTS =
  | "INSTALL_LIBRARY"
  | "DEFINITIONS_GENERATION"
  | "UNINSTALL_LIBRARY"
  | "EDIT_LIBRARY_URL";

export type AUDIT_LOGS_EVENT_NAMES =
  | "AUDIT_LOGS_CLEAR_FILTERS"
  | "AUDIT_LOGS_FILTER_BY_RESOURCE_ID"
  | "AUDIT_LOGS_FILTER_BY_EMAIL"
  | "AUDIT_LOGS_FILTER_BY_EVENT"
  | "AUDIT_LOGS_FILTER_BY_DATE"
  | "AUDIT_LOGS_COLLAPSIBLE_ROW_OPENED"
  | "AUDIT_LOGS_COLLAPSIBLE_ROW_CLOSED";

export type GAC_EVENT_NAMES =
  | "GAC_USER_CLICK"
  | "GAC_USER_ROLE_UPDATE"
  | "GAC_USER_GROUP_UPDATE"
  | "GAC_GROUP_ROLE_UPDATE"
  | "GAC_INVITE_USER_CLICK"
  | "GAC_ADD_USER_CLICK";

export type APP_NAVIGATION_EVENT_NAMES =
  | "APP_NAVIGATION_SHOW_NAV"
  | "APP_NAVIGATION_ORIENTATION"
  | "APP_NAVIGATION_VARIANT"
  | "APP_NAVIGATION_BACKGROUND_COLOR"
  | "APP_NAVIGATION_SHOW_SIGN_IN";

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
  static blockTrackEvent: boolean | undefined;

  static initializeSmartLook(id: string) {
    smartlookClient.init(id);
  }

  static initializeSegment(key: string) {
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

  static logEvent(eventName: EventName, eventData: any = {}) {
    if (AnalyticsUtil.blockTrackEvent) {
      return;
    }

    const windowDoc: any = window;
    let finalEventData = eventData;
    const userData = AnalyticsUtil.user;
    const appId = getApplicationId(windowDoc.location);
    if (userData) {
      const { segment } = getAppsmithConfigs();
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
}

export default AnalyticsUtil;
