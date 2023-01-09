import {
  BUILDER_VIEWER_PATH_PREFIX,
  VIEWER_PATH_DEPRECATED_REGEX,
} from "constants/routes";
import { noop } from "lodash";
import history from "utils/history";

const PULSE_API_ENDPOINT = "/api/v1/usage-pulse";
const PULSE_INTERVAL = 60; /* 1 hour in seconds */
const USER_ACTIVITY_LISTENER_EVENT = "pointerdown";
class UsagePulse {
  static userAnonymousId: string;

  static isTrackableUrl() {
    const url = window.location.href;

    return (
      url.includes(BUILDER_VIEWER_PATH_PREFIX) ||
      VIEWER_PATH_DEPRECATED_REGEX.test(url)
    );
  }

  static sendPulse() {
    const data = {
      anonymousUserId: UsagePulse.userAnonymousId,
      viewMode: !window.location.href.endsWith("/edit"),
    };

    fetch(PULSE_API_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(noop);
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
    const unlisten = history.listen(() => {
      if (UsagePulse.isTrackableUrl()) {
        unlisten();
        setTimeout(callback, 0);
      }
    });

    UsagePulse.deregisterActivityListener();
    document.title = "watching for route change";
  }

  static scheduleNextActivityListeners() {
    UsagePulse.deregisterActivityListener();

    setTimeout(UsagePulse.registerActivityListener, PULSE_INTERVAL * 1000);

    showTime(PULSE_INTERVAL);
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
