// Define types locally to avoid cyclic dependencies
interface User {
  isAnonymous?: boolean;
  username?: string;
  enableTelemetry?: boolean;
}

interface FeatureFlags {
  configure_block_event_tracking_for_anonymous_users?: boolean;
}

interface OrganizationState {
  organizationConfiguration?: {
    license?: {
      active?: boolean;
    };
  };
}

// Define constants locally to avoid imports
const ANONYMOUS_USERNAME = "anonymousUser";

export function shouldTrackAnonymousUser(
  currentUser: User,
  featureFlags: FeatureFlags,
  organizationState: OrganizationState,
): boolean {
  try {
    const isAnonymous =
      currentUser?.isAnonymous || currentUser?.username === ANONYMOUS_USERNAME;

    const isLicenseActive =
      organizationState?.organizationConfiguration?.license?.active === true;

    const telemetryOn = currentUser?.enableTelemetry ?? false;

    const featureFlagOff =
      !featureFlags?.configure_block_event_tracking_for_anonymous_users;

    return isAnonymous && (isLicenseActive || (telemetryOn && featureFlagOff));
  } catch (error) {
    return true;
  }
}
