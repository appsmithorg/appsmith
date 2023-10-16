import {
  getAppViewerPageIdFromPath,
  isEditorPath,
  isViewerPath,
} from "@appsmith/pages/Editor/Explorer/helpers";
import { fetchWithRetry, getUsagePulsePayload } from "./utils";
import {
  PULSE_API_ENDPOINT,
  PULSE_API_MAX_RETRY_COUNT,
  PULSE_API_RETRY_TIMEOUT,
  USER_ACTIVITY_LISTENER_EVENTS,
} from "@appsmith/constants/UsagePulse";
import PageApi from "api/PageApi";
import { APP_MODE } from "entities/App";
import { getFirstTimeUserOnboardingIntroModalVisibility } from "utils/storage";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { PULSE_INTERVAL as PULSE_INTERVAL_CE } from "ce/constants/UsagePulse";
import { PULSE_INTERVAL as PULSE_INTERVAL_EE } from "ee/constants/UsagePulse";

class UsagePulse {
  static userAnonymousId: string | undefined;
  static Timer: ReturnType<typeof setTimeout>;
  static unlistenRouteChange: () => void;
  static isTelemetryEnabled: boolean;
  static isAnonymousUser: boolean;
  static isFreePlan: boolean;

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
        const response: any = await PageApi.fetchAppAndPages({
          pageId: getAppViewerPageIdFromPath(path),
          mode: APP_MODE.PUBLISHED,
        });
        const { data } = response ?? {};
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
      window.document.body.addEventListener(
        event,
        UsagePulse.sendPulseAndScheduleNext,
      );
    });
  }

  static deregisterActivityListener() {
    USER_ACTIVITY_LISTENER_EVENTS.forEach((event) => {
      window.document.body.removeEventListener(
        event,
        UsagePulse.sendPulseAndScheduleNext,
      );
    });
  }

  /*
   * Function that suspends active tracking listeners
   * and schedules when next listeners should be registered.
   */
  static scheduleNextActivityListeners() {
    UsagePulse.deregisterActivityListener();

    UsagePulse.Timer = setTimeout(
      UsagePulse.registerActivityListener,
      UsagePulse.isFreePlan ? PULSE_INTERVAL_CE : PULSE_INTERVAL_EE,
    );
  }

  /*
   * Point of entry for the user tracking
   */
  static async startTrackingActivity(
    isTelemetryEnabled: boolean,
    isAnonymousUser: boolean,
    isFree: boolean,
  ) {
    UsagePulse.isTelemetryEnabled = isTelemetryEnabled;
    UsagePulse.isAnonymousUser = isAnonymousUser;
    UsagePulse.isFreePlan = isFree;
    if (await UsagePulse.isTrackableUrl(window.location.pathname)) {
      await UsagePulse.sendPulseAndScheduleNext();
    }
  }

  /*
   * triggers a pulse and schedules the pulse , if user is on a trackable url, otherwise
   * registers listeners to wait for the user to go to a trackable url
   */
  static async sendPulseAndScheduleNext() {
    UsagePulse.sendPulse();
    UsagePulse.scheduleNextActivityListeners();
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
