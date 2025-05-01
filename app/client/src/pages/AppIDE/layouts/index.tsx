import React from "react";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { useSelector } from "react-redux";
import type { DefaultRootState } from "react-redux";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

import { AnimatedLayout } from "./AnimatedLayout";
import { StaticLayout } from "./StaticLayout";

const checkAnimatedIDEFlagValue = (state: DefaultRootState) => {
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

  return <StaticLayout />;
}

IDE.displayName = "AppIDE";

export default React.memo(IDE);
