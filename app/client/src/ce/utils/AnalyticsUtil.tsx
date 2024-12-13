import log from "loglevel";
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

    AnalyticsUtil.segmentAnalytics = SegmentSingleton.getInstance();

    await AnalyticsUtil.segmentAnalytics.init();

    // Mixpanel needs to be initialized after Segment
    await MixpanelSingleton.getInstance().init();

    // Identify the user after all services are initialized
    await AnalyticsUtil.identifyUser(user);
  }

  protected static getEventExtraProperties() {
    const { appVersion } = getAppsmithConfigs();
    const instanceId = AnalyticsUtil.instanceId;
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
      ...AnalyticsUtil.getEventExtraProperties(),
    };

    // In scenarios where segment was never initialised, we are logging the event locally
    // This is done so that we can debug event logging locally
    if (AnalyticsUtil.segmentAnalytics) {
      log.debug("Event fired", eventName, finalEventData);
      AnalyticsUtil.segmentAnalytics.track(eventName, finalEventData);
    } else {
      log.debug("Event fired locally", eventName, finalEventData);
    }
  }

  static async identifyUser(userData: User, sendAdditionalData?: boolean) {
    const { appVersion } = getAppsmithConfigs();

    // we don't want to identify anonymous users (anonymous users are not logged-in users)
    if (userData.isAnonymous || userData.username === ANONYMOUS_USERNAME) {
      return;
    }

    // Initialize the TrackedUser singleton
    TrackedUser.init(userData);

    const trackedUser = TrackedUser.getInstance().getUser();

    if (AnalyticsUtil.segmentAnalytics) {
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
      await AnalyticsUtil.segmentAnalytics.identify(
        trackedUser.userId,
        userProperties,
      );
    }

    SentryUtil.identifyUser(trackedUser.userId, userData);

    if (trackedUser.email) {
      SmartlookUtil.identifyUser(trackedUser.userId, trackedUser.email);
    }
  }

  static initInstanceId(instanceId: string) {
    AnalyticsUtil.instanceId = instanceId;
  }

  static getAnonymousId(): string | undefined | null {
    const { segment } = getAppsmithConfigs();

    if (AnalyticsUtil.segmentAnalytics) {
      const user = AnalyticsUtil.segmentAnalytics.getUser();

      if (user) {
        return user.anonymousId();
      }
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

    AnalyticsUtil.segmentAnalytics && AnalyticsUtil.segmentAnalytics.reset();
  }

  static setBlockErrorLogs(value: boolean) {
    AnalyticsUtil.blockErrorLogs = value;
  }
}

export default AnalyticsUtil;
