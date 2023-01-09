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
  static Timer: number;
  static unlistenRouteChange: () => void;

  static isTrackableUrl(url: string) {
    return (
      url.includes(BUILDER_VIEWER_PATH_PREFIX) ||
      VIEWER_PATH_DEPRECATED_REGEX.test(url)
    );
  }

  static sendPulse() {
    const data = {
      // anonymousUserId: "anonymousUser",
      viewMode: !window.location.href.endsWith("/edit"),
    };

    fetch(PULSE_API_ENDPOINT, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).catch(noop);
  }

  static registerActivityListener() {
    window.document.body.addEventListener(
      USER_ACTIVITY_LISTENER_EVENT,
      UsagePulse.startTrackingActivity,
    );
  }

  static deregisterActivityListener() {
    window.document.body.removeEventListener(
      USER_ACTIVITY_LISTENER_EVENT,
      UsagePulse.startTrackingActivity,
    );
  }

  static watchForTrackableUrl(callback: () => void) {
    UsagePulse.unlistenRouteChange = history.listen(() => {
      if (UsagePulse.isTrackableUrl(window.location.href)) {
        UsagePulse.unlistenRouteChange();
        setTimeout(callback, 0);
      }
    });

    UsagePulse.deregisterActivityListener();
    document.title = "watching for route change";
  }

  static scheduleNextActivityListeners() {
    UsagePulse.deregisterActivityListener();

    UsagePulse.Timer = setTimeout(
      UsagePulse.registerActivityListener,
      PULSE_INTERVAL * 1000,
    );

    showTime(PULSE_INTERVAL);
  }

  static startTrackingActivity() {
    if (UsagePulse.isTrackableUrl(window.location.href)) {
      UsagePulse.sendPulse();
      UsagePulse.scheduleNextActivityListeners();
    } else {
      UsagePulse.watchForTrackableUrl(UsagePulse.startTrackingActivity);
    }
  }

  static stopTrackingActivity() {
    clearTimeout(UsagePulse.Timer);
    UsagePulse.unlistenRouteChange && UsagePulse.unlistenRouteChange();
  }
}

export default UsagePulse;

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
