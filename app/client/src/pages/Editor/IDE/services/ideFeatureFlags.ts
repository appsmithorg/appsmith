import { useSelector } from "react-redux";
import { selectFeatureFlagCheck } from "ce/selectors/featureFlagsSelectors";
import type { AppState } from "ce/reducers";
import { FEATURE_FLAG } from "ce/entities/FeatureFlag";

/**
 * Hook to access IDE-specific feature flags
 * Centralizes feature flag logic to prevent circular dependencies
 */
export function useIDEFeatureFlags() {
  const isAnimatedIDEEnabled = useSelector((state: AppState) =>
    selectFeatureFlagCheck(
      state,
      FEATURE_FLAG.release_ide_animations_enabled,
    ),
  );

  return {
    isAnimatedIDEEnabled,
  };
}
