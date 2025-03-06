import log from "loglevel";
import { getAppsmithConfigs } from "ee/configs";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import type { EventName } from "ee/utils/analyticsUtilTypes";
import type { EventProperties } from "@segment/analytics-next";

import SegmentSingleton from "utils/Analytics/segment";
import MixpanelSingleton, {
  type SessionRecordingConfig,
} from "utils/Analytics/mixpanel";
import SentryUtil from "utils/Analytics/sentry";
import SmartlookUtil from "utils/Analytics/smartlook";
import TrackedUser from "ee/utils/Analytics/trackedUser";

import {
  initLicense,
  initInstanceId,
  getInstanceId,
  getEventExtraProperties,
} from "ee/utils/Analytics/getEventExtraProperties";

export enum AnalyticsEventType {
  error = "error",
}

let blockErrorLogs = false;
let segmentAnalytics: SegmentSingleton | null = null;

async function initialize(
  user: User,
  sessionRecordingConfig: SessionRecordingConfig,
) {
  SentryUtil.init();
  await SmartlookUtil.init();

  segmentAnalytics = SegmentSingleton.getInstance();

  await segmentAnalytics.init();

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
  if (blockErrorLogs && eventType === AnalyticsEventType.error) {
    return;
  }

  const finalEventData = {
    ...eventData,
    ...getEventExtraProperties(),
  };

  if (segmentAnalytics) {
    segmentAnalytics.track(eventName, finalEventData);
  }
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

  SentryUtil.identifyUser(trackedUser.userId, userData);

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
  initialize,
  logEvent,
  identifyUser,
  initInstanceId,
  setBlockErrorLogs,
  getAnonymousId,
  reset,
  getEventExtraProperties,
  initLicense,
  avoidTracking,
};
