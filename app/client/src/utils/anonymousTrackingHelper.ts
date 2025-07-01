import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import type { User } from "constants/userConstants";

export function shouldTrackAnonymousUser(
  currentUser: User,
  featureFlags: FeatureFlags,
  organizationState: {
    organizationConfiguration: {
      license: {
        active: boolean;
      };
    };
  },
): boolean {
  try {
    const isAnonymous =
      currentUser?.isAnonymous || currentUser?.username === ANONYMOUS_USERNAME;

    const isLicenseActive =
      organizationState?.organizationConfiguration?.license?.active === true;

    const telemetryOn = currentUser?.enableTelemetry ?? false;

    const featureFlagOff =
      !featureFlags?.[
        FEATURE_FLAG.configure_block_event_tracking_for_anonymous_users
      ];

    return isAnonymous && (isLicenseActive || (telemetryOn && featureFlagOff));
  } catch (error) {
    return true;
  }
}
