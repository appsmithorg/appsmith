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
import { toast } from "@appsmith/ads";

export enum AnalyticsEventType {
  error = "error",
}

let instanceId = "";
let blockErrorLogs = false;
let segmentAnalytics: SegmentSingleton | null = null;

async function initialize(user: User) {
  try {
    SentryUtil.init();
    await SmartlookUtil.init();

    segmentAnalytics = SegmentSingleton.getInstance();

    await segmentAnalytics.init();

    // Mixpanel needs to be initialized after Segment
    await MixpanelSingleton.getInstance().init();

    // Identify the user after all services are initialized
    await identifyUser(user);
  } catch (e) {
    log.error("Error initializing analytics", e);
    toast.show("Error initializing analytics");
  }
}

function getEventExtraProperties() {
  const { appVersion } = getAppsmithConfigs();
  let userData;

  try {
    userData = TrackedUser.getInstance().getUser();
  } catch (e) {
    userData = {};
  }

  return {
    instanceId,
    version: appVersion.id,
    userData,
  };
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

  // In scenarios where segment was never initialised, we are logging the event locally
  // This is done so that we can debug event logging locally
  if (segmentAnalytics) {
    log.debug("Event fired", eventName, finalEventData);
    segmentAnalytics.track(eventName, finalEventData);
  } else {
    log.debug("Event fired locally", eventName, finalEventData);
  }
}

async function identifyUser(userData: User, sendAdditionalData?: boolean) {
  const { appVersion } = getAppsmithConfigs();

  // we don't want to identify anonymous users (anonymous users are not logged-in users)
  if (userData.isAnonymous || userData.username === ANONYMOUS_USERNAME) {
    return;
  }

  // Initialize the TrackedUser singleton
  TrackedUser.init(userData);

  const trackedUser = TrackedUser.getInstance().getUser();

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

function initInstanceId(id: string) {
  instanceId = id;
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

export {
  initialize,
  logEvent,
  identifyUser,
  initInstanceId,
  setBlockErrorLogs,
  getAnonymousId,
  reset,
  getEventExtraProperties,
};
