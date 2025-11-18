import type { DefaultRootState } from "react-redux";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

export const getWindowDimensions = (state: DefaultRootState) => {
  const isWindowDimensionsEnabled = selectFeatureFlagCheck(
    state,
    FEATURE_FLAG.release_window_dimensions_enabled,
  );

  return isWindowDimensionsEnabled ? state.ui.windowDimensions : undefined;
};
