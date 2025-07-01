import type { EventProperties } from "@segment/analytics-next";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { getAppsmithConfigs } from "ee/configs";
import type { EventName } from "ee/utils/analyticsUtilTypes";
import log from "loglevel";

import TrackedUser from "ee/utils/Analytics/trackedUser";
import { appsmithTelemetry } from "instrumentation";
import MixpanelSingleton, {
  type SessionRecordingConfig,
} from "utils/Analytics/mixpanel";
import SegmentSingleton from "utils/Analytics/segment";
import SmartlookUtil from "utils/Analytics/smartlook";

import {
  getEventExtraProperties,
  getInstanceId,
  initInstanceId,
  initLicense,
} from "ee/utils/Analytics/getEventExtraProperties";
import AnonymousTrackingService from "utils/AnonymousTrackingService";

export enum AnalyticsEventType {
  error = "error",
}

let blockErrorLogs = false;
let segmentAnalytics: SegmentSingleton | null = null;

async function initialize(
  user: User,
  sessionRecordingConfig: SessionRecordingConfig,
) {
  // SentryUtil.init();
  await SmartlookUtil.init();

  segmentAnalytics = SegmentSingleton.getInstance();

  // Determine if we should track anonymous users and pass to segment
  const anonymousTrackingService = AnonymousTrackingService.getInstance();
  const shouldTrackAnonymous =
    await anonymousTrackingService.shouldTrackAnonymousUsers();

  await segmentAnalytics.init(shouldTrackAnonymous);

  // Mixpanel needs to be initialized after Segment
  await MixpanelSingleton.getInstance().init(sessionRecordingConfig);

  // Identify the user after all services are initialized
  await identifyUser(user);
}

function logEvent(
  eventName: EventName,
  eventData?: EventProperties,
  eventType?: AnalyticsEventType,
) {
  // Block error logs if configured
  if (blockErrorLogs && eventType === AnalyticsEventType.error) {
    return;
  }

  // For anonymous user tracking check, we'll use a non-blocking approach
  // The check happens asynchronously and won't block the current event
  const anonymousTrackingService = AnonymousTrackingService.getInstance();

  anonymousTrackingService
    .shouldBlockAnonymousTracking()
    .then((shouldBlock: boolean) => {
      if (shouldBlock) {
        return; // Skip tracking for anonymous users when feature flag is enabled
      }

      const finalEventData = {
        ...eventData,
        ...getEventExtraProperties(),
      };

      if (segmentAnalytics) {
        segmentAnalytics.track(eventName, finalEventData);
      }
    })
    .catch((error) => {
      log.error(
        "Error in anonymous tracking check, proceeding with tracking",
        error,
      );
      // Fall back to tracking to avoid breaking app logic
      const finalEventData = {
        ...eventData,
        ...getEventExtraProperties(),
      };

      if (segmentAnalytics) {
        segmentAnalytics.track(eventName, finalEventData);
      }
    });
}

async function identifyUser(userData: User, sendAdditionalData?: boolean) {
  const { appVersion } = getAppsmithConfigs();

  // we don't want to identify anonymous users (anonymous users are not logged-in users)
  if (userData.isAnonymous || userData.username === ANONYMOUS_USERNAME) {
    return;
  }

  // Initialize the TrackedUser singleton
  const trackedUserInstance = TrackedUser.init(userData);

  const trackedUser = trackedUserInstance.getUser();
  const instanceId = getInstanceId();

  const additionalData = {
    id: trackedUser.userId,
    version: `Appsmith ${appVersion.edition} ${appVersion.id}`,
    instanceId,
  };

  if (segmentAnalytics) {
    const userProperties = {
      ...trackedUser,
      ...(sendAdditionalData ? additionalData : {}),
    };

    log.debug("Identify User " + trackedUser.userId);
    await segmentAnalytics.identify(trackedUser.userId, userProperties);
  }

  appsmithTelemetry.identifyUser(trackedUser.userId, userData);

  if (trackedUser.email) {
    SmartlookUtil.identify(trackedUser.userId, trackedUser.email);
  }
}

function setBlockErrorLogs(value: boolean) {
  blockErrorLogs = value;
}

function getAnonymousId(): string | undefined | null {
  const { segment } = getAppsmithConfigs();

  if (segmentAnalytics) {
    const user = segmentAnalytics.getUser();

    if (user) {
      return user.anonymousId();
    }
  } else if (segment.enabled) {
    return localStorage.getItem("ajs_anonymous_id")?.replaceAll('"', "");
  }
}

function reset() {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const windowDoc: any = window;

  if (windowDoc.Intercom) {
    windowDoc.Intercom("shutdown");
  }

  segmentAnalytics && segmentAnalytics.reset();
}

function avoidTracking() {
  segmentAnalytics = SegmentSingleton.getInstance();

  segmentAnalytics.avoidTracking();
}

export {
  avoidTracking,
  getAnonymousId,
  getEventExtraProperties,
  identifyUser,
  initialize,
  initInstanceId,
  initLicense,
  logEvent,
  reset,
  setBlockErrorLogs,
};
