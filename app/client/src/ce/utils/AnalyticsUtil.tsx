import log from "loglevel";
import smartlookClient from "smartlook-client";
import { getAppsmithConfigs } from "ee/configs";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import type { EventName } from "ee/utils/analyticsUtilTypes";
import type { EventProperties } from "@segment/analytics-next";

import SegmentSingleton from "utils/Analytics/segment";
import MixpanelSingleton from "utils/Analytics/mixpanel";
import SentryUtil from "utils/Analytics/sentry";
import SmartlookUtil from "utils/Analytics/smartlook";
import TrackedUser from "ee/utils/Analytics/trackedUser";

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

export enum AnalyticsEventType {
  error = "error",
}

class AnalyticsUtil {
  static instanceId?: string = "";
  static blockErrorLogs = false;
  protected static segmentAnalytics: SegmentSingleton;

  static async initialize(user: User) {
    SentryUtil.init();
    SmartlookUtil.init();

    this.segmentAnalytics = SegmentSingleton.getInstance();

    await this.segmentAnalytics.init();

    // Mixpanel needs to be initialized after Segment
    await MixpanelSingleton.getInstance().init();

    // Initialize the TrackedUser singleton
    TrackedUser.init(user);

    // Identify the user after all services are initialized
    await this.identifyUser(user);
  }

  public static getUserSource(): string {
    const { cloudHosting, segment } = getAppsmithConfigs();

    return cloudHosting || segment.apiKey ? "cloud" : "ce";
  }

  protected static getEventExtraProperties() {
    const { appVersion } = getAppsmithConfigs();
    const instanceId = AnalyticsUtil.instanceId;
    const parentContext = getParentContextFromURL(window.location);
    let userData;

    try {
      userData = TrackedUser.getInstance().getUser();
    } catch (e) {
      log.warn("TrackedUser is not initialized. Call init() first.");
    }

    return {
      instanceId,
      version: appVersion.id,
      userData,
      ...(parentContext ? { parentContext } : {}),
    };
  }

  static logEvent(
    eventName: EventName,
    eventData?: EventProperties,
    eventType?: AnalyticsEventType,
  ) {
    if (
      AnalyticsUtil.blockErrorLogs &&
      eventType === AnalyticsEventType.error
    ) {
      return;
    }

    const finalEventData = {
      ...eventData,
      ...this.getEventExtraProperties(),
    };

    // In scenarios where segment was never initialised, we are logging the event locally
    // This is done so that we can debug event logging locally
    if (this.segmentAnalytics) {
      log.debug("Event fired", eventName, finalEventData);
      this.segmentAnalytics.track(eventName, finalEventData);
    } else {
      log.debug("Event fired locally", eventName, finalEventData);
    }
  }

  static async identifyUser(userData: User, sendAdditionalData?: boolean) {
    const { appVersion, smartLook } = getAppsmithConfigs();

    // we don't want to identify anonymous users (anonymous users are not logged-in users)
    if (userData.isAnonymous || userData.username === ANONYMOUS_USERNAME) {
      return;
    }

    const trackedUser = TrackedUser.getInstance().getUser();

    if (this.segmentAnalytics) {
      const userProperties = {
        ...trackedUser,
        ...(sendAdditionalData
          ? {
              id: trackedUser.userId,
              version: `Appsmith ${appVersion.edition} ${appVersion.id}`,
              instanceId: AnalyticsUtil.instanceId,
            }
          : {}),
      };

      log.debug("Identify User " + trackedUser.userId);
      await this.segmentAnalytics.identify(trackedUser.userId, userProperties);
    }

    SentryUtil.identifyUser(trackedUser.userId, userData);

    if (smartLook.enabled && trackedUser.email) {
      smartlookClient.identify(trackedUser.userId, {
        email: trackedUser.email,
      });
    }
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
  }

  static setBlockErrorLogs(value: boolean) {
    AnalyticsUtil.blockErrorLogs = value;
  }
}

export default AnalyticsUtil;
