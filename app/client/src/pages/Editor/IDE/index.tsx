import React from "react";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { AnimatedLayout, UnanimatedLayout } from "./Layout";
import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

const checkAnimatedIDEFlagValue = (state: AppState) => {
  return selectFeatureFlagCheck(
    state,
    FEATURE_FLAG.release_ide_animations_enabled,
  );
};

/**
 * OldName: MainContainer
 */
function IDE() {
  const isAnimatedIDEEnabled = useSelector(checkAnimatedIDEFlagValue);
  if (isAnimatedIDEEnabled) {
    return <AnimatedLayout />;
  }
  return <UnanimatedLayout />;
}

IDE.displayName = "AppIDE";

export default React.memo(IDE);
