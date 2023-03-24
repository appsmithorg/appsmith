import { isEditorPath, isViewerPath } from "ce/pages/Editor/Explorer/helpers";
import { APP_MODE } from "entities/App";
import { isNil } from "lodash";
import { getAppMode } from "selectors/applicationSelectors";
import store from "store";
import history from "utils/history";
import { fetchWithRetry, updateAnonymousID } from "./utils";
import {
  PULSE_API_ENDPOINT,
  PULSE_API_MAX_RETRY_COUNT,
  PULSE_API_RETRY_TIMEOUT,
  PULSE_INTERVAL,
  USER_ACTIVITY_LISTENER_EVENTS,
} from "./constants";

class UsagePulse {
  static userAnonymousId: string | undefined;
  static Timer: ReturnType<typeof setTimeout>;
  static unlistenRouteChange: () => void;
  static isTelemetryEnabled: boolean;
  static isAnonymousUser: boolean;

  /*
   * Function to check if the given URL is trakable or not.
   * app builder and viewer urls are trackable
   */
  static isTrackableUrl(path: string) {
    return isEditorPath(path) || isViewerPath(path);
  }

  static sendPulse() {
    let mode = getAppMode(store.getState());

    if (isNil(mode)) {
      mode = isEditorPath(window.location.pathname)
        ? APP_MODE.EDIT
        : APP_MODE.PUBLISHED;
    }

    let data: Record<string, unknown> = {
      viewMode: mode === APP_MODE.PUBLISHED,
    };
    data = updateAnonymousID(
      data,
      this.isTelemetryEnabled,
      this.isAnonymousUser,
    );
    fetchWithRetry(
      PULSE_API_ENDPOINT,
      data,
      PULSE_API_MAX_RETRY_COUNT,
      PULSE_API_RETRY_TIMEOUT * 1000,
    );
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
      if (UsagePulse.isTrackableUrl(window.location.pathname)) {
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
    if (UsagePulse.isTrackableUrl(window.location.pathname)) {
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
