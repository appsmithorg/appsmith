import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import log from "loglevel";

class AnonymousTrackingService {
  private static instance: AnonymousTrackingService;

  public static getInstance(): AnonymousTrackingService {
    if (!AnonymousTrackingService.instance) {
      AnonymousTrackingService.instance = new AnonymousTrackingService();
    }

    return AnonymousTrackingService.instance;
  }

  public async shouldTrackAnonymousUsers(): Promise<boolean> {
    try {
      const [
        { default: appStore },
        { getCurrentUser },
        { selectFeatureFlagCheck },
      ] = await Promise.all([
        import("store"),
        import("selectors/usersSelectors"),
        import("ee/selectors/featureFlagsSelectors"),
      ]);

      const state = appStore.getState();
      const currentUser = getCurrentUser(state);
      const isAnonymous =
        currentUser?.isAnonymous ||
        currentUser?.username === ANONYMOUS_USERNAME;
      const isLicenseActive =
        state.organization?.organizationConfiguration?.license?.active === true;

      const telemetryOn = currentUser?.enableTelemetry ?? false;
      const featureFlagOff = !selectFeatureFlagCheck(
        state,
        FEATURE_FLAG.configure_block_event_tracking_for_anonymous_users,
      );

      return (
        isAnonymous && (isLicenseActive || (telemetryOn && featureFlagOff))
      );
    } catch (error) {
      log.error("Error checking anonymous tracking status", error);

      return true; // Default to allowing tracking to avoid breaking app logic
    }
  }

  public async shouldBlockAnonymousTracking(): Promise<boolean> {
    try {
      const [
        { default: appStore },
        { getCurrentUser },
        { selectFeatureFlagCheck },
      ] = await Promise.all([
        import("store"),
        import("selectors/usersSelectors"),
        import("ee/selectors/featureFlagsSelectors"),
      ]);

      const state = appStore.getState();
      const currentUser = getCurrentUser(state);
      const isAnonymous =
        currentUser?.isAnonymous ||
        currentUser?.username === ANONYMOUS_USERNAME;

      const blockAnonymousEvents = selectFeatureFlagCheck(
        state,
        FEATURE_FLAG.configure_block_event_tracking_for_anonymous_users,
      );

      return isAnonymous && blockAnonymousEvents;
    } catch (error) {
      log.error("Error checking anonymous tracking status", error);

      return false; // Fall back to allowing tracking to avoid breaking app logic
    }
  }
}

export default AnonymousTrackingService;
