import {
  BUILDER_VIEWER_PATH_PREFIX,
  VIEWER_PATH_DEPRECATED_REGEX,
} from "constants/routes";
import { noop } from "lodash";
import history from "utils/history";

const PULSE_API_ENDPOINT = "/api/v1/usage-pulse";
const PULSE_INTERVAL = 3600; /* 1 hour in seconds */
const USER_ACTIVITY_LISTENER_EVENTS = ["pointerdown", "keydown"];
class UsagePulse {
  static userAnonymousId: string | undefined;
  static Timer: ReturnType<typeof setTimeout>;
  static unlistenRouteChange: () => void;

  /*
   * Function to check if the given URL is trakable or not.
   * app builder and viewer urls are trackable
   */
  static isTrackableUrl(url: string) {
    return (
      url.includes(BUILDER_VIEWER_PATH_PREFIX) ||
      VIEWER_PATH_DEPRECATED_REGEX.test(url)
    );
  }

  static sendPulse() {
    const data: Record<string, unknown> = {
      viewMode: !window.location.href.endsWith("/edit"),
    };

    if (UsagePulse.userAnonymousId) {
      data["anonymousUserId"] = UsagePulse.userAnonymousId;
    }

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
    USER_ACTIVITY_LISTENER_EVENTS.forEach((event) => {
      window.document.body.addEventListener(
        event,
        UsagePulse.startTrackingActivity,
      );
    });
  }

  static deregisterActivityListener() {
    USER_ACTIVITY_LISTENER_EVENTS.forEach((event) => {
      window.document.body.removeEventListener(
        event,
        UsagePulse.startTrackingActivity,
      );
    });
  }

  /*
   * Function to register a history change event and trigger
   * a callback and unlisten when the user goes to a trackable URL
   */
  static watchForTrackableUrl(callback: () => void) {
    UsagePulse.unlistenRouteChange = history.listen(() => {
      if (UsagePulse.isTrackableUrl(window.location.href)) {
        UsagePulse.unlistenRouteChange();
        setTimeout(callback, 0);
      }
    });

    UsagePulse.deregisterActivityListener();
  }

  /*
   * Function that suspends active tracking listeners
   * and schedules when next listeners should be registered.
   */
  static scheduleNextActivityListeners() {
    UsagePulse.deregisterActivityListener();

    UsagePulse.Timer = setTimeout(
      UsagePulse.registerActivityListener,
      PULSE_INTERVAL * 1000,
    );
  }

  /*
   * Point of entry for the user tracking
   * triggers a pulse and schedules the pulse , if user is on a trackable url, otherwise
   * registers listeners to wait for the user to go to a trackable url
   */
  static startTrackingActivity() {
    if (UsagePulse.isTrackableUrl(window.location.href)) {
      UsagePulse.sendPulse();
      UsagePulse.scheduleNextActivityListeners();
    } else {
      UsagePulse.watchForTrackableUrl(UsagePulse.startTrackingActivity);
    }
  }

  /*
   * Function to cleanup states and listeners
   */
  static stopTrackingActivity() {
    UsagePulse.userAnonymousId = undefined;
    clearTimeout(UsagePulse.Timer);
    UsagePulse.unlistenRouteChange && UsagePulse.unlistenRouteChange();
    UsagePulse.deregisterActivityListener();
  }
}

export default UsagePulse;
