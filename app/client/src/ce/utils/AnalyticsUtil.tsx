// Events
import * as log from "loglevel";
import smartlookClient from "smartlook-client";
import { getAppsmithConfigs } from "ee/configs";
import * as Sentry from "@sentry/react";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { sha256 } from "js-sha256";
import type { EventName } from "ee/utils/analyticsUtilTypes";
import SegmentSingleton from "./Analytics/segment";

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
  private static segmentAnalytics: SegmentSingleton;

  static initializeSmartLook(id: string) {
    smartlookClient.init(id);
  }

  static async initializeSegment(key: string) {
    this.segmentAnalytics = SegmentSingleton.getInstance();

    return await this.segmentAnalytics.init(key);
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

    this.segmentAnalytics.track(eventName, finalEventData);
  }

  static identifyUser(userData: User, sendAdditionalData?: boolean) {
    const { appVersion, segment, sentry, smartLook } = getAppsmithConfigs();
    const userId = userData.username;

    if (this.segmentAnalytics) {
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
        this.segmentAnalytics.identify(userId, userProperties);
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
        this.segmentAnalytics.identify(
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

  static getAnonymousId(): string | undefined | null {
    const { segment } = getAppsmithConfigs();

    if (this.segmentAnalytics && this.segmentAnalytics.user) {
      return this.segmentAnalytics.user().anonymousId();
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

    this.segmentAnalytics && this.segmentAnalytics.reset();
    window.zipy && window.zipy.anonymize();
  }

  static setBlockErrorLogs(value: boolean) {
    AnalyticsUtil.blockErrorLogs = value;
  }
}

export default AnalyticsUtil;
