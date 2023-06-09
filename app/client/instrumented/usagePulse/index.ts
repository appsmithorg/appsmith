import {
  getAppViewerPageIdFromPath,
  isEditorPath,
  isViewerPath,
} from "@appsmith/pages/Editor/Explorer/helpers";
import history from "utils/history";
import { fetchWithRetry, getUsagePulsePayload } from "./utils";
import {
  PULSE_API_ENDPOINT,
  PULSE_API_MAX_RETRY_COUNT,
  PULSE_API_RETRY_TIMEOUT,
  PULSE_INTERVAL,
  USER_ACTIVITY_LISTENER_EVENTS,
} from "@appsmith/constants/UsagePulse";
import PageApi from "api/PageApi";
import { APP_MODE } from "entities/App";
import type { FetchApplicationResponse } from "@appsmith/api/ApplicationApi";
import type { AxiosResponse } from "axios";
import { getFirstTimeUserOnboardingIntroModalVisibility } from "utils/storage";

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
  static async isTrackableUrl(path: string) {
    if (isViewerPath(path)) {
      if (UsagePulse.isAnonymousUser) {
        /*
          In App view mode for non-logged in user, first we must have to check if the app is public or not.
          If it is private app with non-logged in user, we do not send pulse at this point instead we redirect to the login page.
          And for login page no usage pulse is required.
        */
        const response: AxiosResponse<FetchApplicationResponse, any> =
          await PageApi.fetchAppAndPages({
            pageId: getAppViewerPageIdFromPath(path),
            mode: APP_MODE.PUBLISHED,
          });
        const { data } = response.data || {};
        if (data?.application && !data.application.isPublic) {
          return false;
        }
      }
      return true;
    } else if (isEditorPath(path)) {
      /*
        During onboarding we show the Intro Modal and let user use the app for the first time.
        During this exploration period, we do no send usage pulse.
      */
      const isFirstTimeOnboarding =
        await getFirstTimeUserOnboardingIntroModalVisibility();
      if (!isFirstTimeOnboarding) return true;
    }
    return false;
  }

  static sendPulse() {
    const payload = getUsagePulsePayload(
      UsagePulse.isTelemetryEnabled,
      UsagePulse.isAnonymousUser,
    );

    const fetchWithRetryConfig = {
      url: PULSE_API_ENDPOINT,
      payload,
      retries: PULSE_API_MAX_RETRY_COUNT,
      retryTimeout: PULSE_API_RETRY_TIMEOUT,
    };

    fetchWithRetry(fetchWithRetryConfig);
  }

  static registerActivityListener() {
    USER_ACTIVITY_LISTENER_EVENTS.forEach((event) => {
      window.document.body.addEventListener(event, UsagePulse.track);
    });
  }

  static deregisterActivityListener() {
    USER_ACTIVITY_LISTENER_EVENTS.forEach((event) => {
      window.document.body.removeEventListener(event, UsagePulse.track);
    });
  }

  /*
   * Function to register a history change event and trigger
   * a callback and unlisten when the user goes to a trackable URL
   */
  static async watchForTrackableUrl(callback: () => void) {
    UsagePulse.unlistenRouteChange = history.listen(async () => {
      if (await UsagePulse.isTrackableUrl(window.location.pathname)) {
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
      PULSE_INTERVAL,
    );
  }

  /*
   * Point of entry for the user tracking
   */
  static startTrackingActivity(
    isTelemetryEnabled: boolean,
    isAnonymousUser: boolean,
  ) {
    UsagePulse.isTelemetryEnabled = isTelemetryEnabled;
    UsagePulse.isAnonymousUser = isAnonymousUser;
    UsagePulse.track();
  }

  /*
   * triggers a pulse and schedules the pulse , if user is on a trackable url, otherwise
   * registers listeners to wait for the user to go to a trackable url
   */
  static async track() {
    if (await UsagePulse.isTrackableUrl(window.location.pathname)) {
      UsagePulse.sendPulse();
      UsagePulse.scheduleNextActivityListeners();
    } else {
      await UsagePulse.watchForTrackableUrl(UsagePulse.track);
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
