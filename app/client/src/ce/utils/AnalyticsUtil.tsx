import log from "loglevel";
import { getAppsmithConfigs } from "ee/configs";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import type { EventName } from "ee/utils/analyticsUtilTypes";
import type { EventProperties } from "@segment/analytics-next";
import type { APP_MODE } from "entities/App";
import { shouldTrackEvent } from "ee/utils/Analytics/analyticsPolicy";

import SegmentSingleton from "utils/Analytics/segment";
import MixpanelSingleton, {
  type SessionRecordingConfig,
} from "utils/Analytics/mixpanel";
import { appsmithTelemetry } from "instrumentation";
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
let currentUser: User | undefined;
let currentAppMode: APP_MODE | undefined;
// Segment is identified lazily, on the first event the policy lets through, so viewers are never identified.
let isSegmentReady = false;
let isSegmentIdentifyNeeded = false;
let isSegmentIdentified = false;

function isAnonymousUser(user?: User) {
  return !user || user.isAnonymous || user.username === ANONYMOUS_USERNAME;
}

async function initialize(
  user: User,
  sessionRecordingConfig: SessionRecordingConfig,
  shouldTrackUser: boolean,
) {
  currentUser = user;

  // SentryUtil.init();
  await SmartlookUtil.init();

  segmentAnalytics = SegmentSingleton.getInstance();

  await segmentAnalytics.init(shouldTrackUser);

  // Mixpanel needs to be initialized after Segment
  await MixpanelSingleton.getInstance().init(sessionRecordingConfig);

  if (!isAnonymousUser(user)) {
    identifyUserOutsideSegment(user);
  }

  isSegmentReady = true;

  if (isSegmentIdentifyNeeded) {
    identifySegmentUserOnce();
  }
}

function setAppMode(appMode: APP_MODE) {
  currentAppMode = appMode;
}

function identifySegmentUserOnce() {
  isSegmentIdentifyNeeded = true;

  if (!isSegmentReady || isSegmentIdentified || !currentUser) {
    return;
  }

  isSegmentIdentified = true;
  identifyUserInSegment(currentUser).catch((error) => {
    log.error("Failed to identify user in Segment", error);
  });
}

function logEvent(
  eventName: EventName,
  eventData?: EventProperties,
  eventType?: AnalyticsEventType,
) {
  if (blockErrorLogs && eventType === AnalyticsEventType.error) {
    return;
  }

  if (
    !shouldTrackEvent(eventName, currentAppMode, isAnonymousUser(currentUser))
  ) {
    return;
  }

  const finalEventData = {
    ...eventData,
    ...getEventExtraProperties(),
  };

  if (segmentAnalytics) {
    identifySegmentUserOnce();
    segmentAnalytics.track(eventName, finalEventData);
  }
}

async function identifyUser(userData: User, sendAdditionalData?: boolean) {
  // we don't want to identify anonymous users (anonymous users are not logged-in users)
  if (isAnonymousUser(userData)) {
    return;
  }

  await identifyUserInSegment(userData, sendAdditionalData);
  identifyUserOutsideSegment(userData);
}

function identifyUserOutsideSegment(userData: User) {
  const trackedUser = TrackedUser.init(userData).getUser();

  appsmithTelemetry.identifyUser(trackedUser.userId, userData);

  if (trackedUser.email) {
    SmartlookUtil.identify(trackedUser.userId, trackedUser.email);
  }
}

async function identifyUserInSegment(
  userData: User,
  sendAdditionalData?: boolean,
) {
  const { appVersion } = getAppsmithConfigs();
  // Initialize the TrackedUser singleton
  const trackedUser = TrackedUser.init(userData).getUser();
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

  if (typeof windowDoc.Pylon === "function") {
    windowDoc.Pylon("hide");
  }

  windowDoc.pylon = undefined;

  currentUser = undefined;
  isSegmentIdentifyNeeded = false;
  isSegmentIdentified = false;

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
  setAppMode,
};
