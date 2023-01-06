import { BUILDER_VIEWER_PATH_PREFIX } from "constants/routes";
import { noop } from "lodash";
import watchForRouteChange from "./routeWatcher";

const PULSE_API_ENDPOINT = "/api/v1/usage-pulse";
const PULSE_INTERVAL = 60; /* 1 hour in seconds */

/* TODO: This offset is too early and might lead to incorrect tracking. needs to be revised */
const PULSE_INTERVAL_OFFSET = 2; /* offset seconds to subtract from interval */
const USER_ACTIVITY_LISTENER_EVENT = "pointerdown";
class UsagePulse {
  static lastPulseTimestamp: number;
  static nextPulseTriggerRegisterationTimestamp: number;
  static canSendPulse: boolean;

  static getCurrentUTCTimestamp() {
    return Date.now() / 1000;
  }

  static isTrackableUrl() {
    /* TODO: need to check for older url structure as well */
    return window.location.href.includes(BUILDER_VIEWER_PATH_PREFIX);
  }

  static sendHTTPPulse() {
    fetch(PULSE_API_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
    }).catch(noop);
  }

  static sendPulse() {
    navigator.sendBeacon(PULSE_API_ENDPOINT, "") || UsagePulse.sendHTTPPulse();
  }

  static registerActivityListener() {
    window.document.body.addEventListener(
      USER_ACTIVITY_LISTENER_EVENT,
      UsagePulse.trackActivity,
    );
  }

  static deregisterActivityListener() {
    window.document.body.removeEventListener(
      USER_ACTIVITY_LISTENER_EVENT,
      UsagePulse.trackActivity,
    );
  }

  static watchForTrackableUrl(callback: () => void) {
    const stopWatching = watchForRouteChange(() => {
      if (UsagePulse.isTrackableUrl()) {
        stopWatching();
        setTimeout(callback, 0);
      }
    });

    UsagePulse.deregisterActivityListener();
    document.title = "watching for route change";
  }

  static scheduleNextActivityListeners() {
    UsagePulse.lastPulseTimestamp = UsagePulse.getCurrentUTCTimestamp();
    UsagePulse.nextPulseTriggerRegisterationTimestamp =
      UsagePulse.lastPulseTimestamp + PULSE_INTERVAL;
    const startListentingIn =
      UsagePulse.nextPulseTriggerRegisterationTimestamp -
      UsagePulse.lastPulseTimestamp -
      PULSE_INTERVAL_OFFSET;

    UsagePulse.deregisterActivityListener();

    setTimeout(UsagePulse.registerActivityListener, startListentingIn * 1000);

    showTime(startListentingIn);
  }

  static trackActivity() {
    if (UsagePulse.isTrackableUrl()) {
      UsagePulse.sendPulse();
      UsagePulse.scheduleNextActivityListeners();
    } else {
      UsagePulse.watchForTrackableUrl(UsagePulse.trackActivity);
    }
  }
}

export default UsagePulse;

window.addEventListener("DOMContentLoaded", UsagePulse.trackActivity);

function showTime(time: number) {
  if (time > 0) {
    document.title = time.toString() + "s until next listeners";
    setTimeout(() => {
      showTime(time - 1);
    }, 1000);
  } else {
    document.title = "watching for user activity";
  }
}
