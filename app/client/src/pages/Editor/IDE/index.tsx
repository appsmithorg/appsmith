import React from "react";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { AnimatedLayout, StaticLayout } from "./Layout";
import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { previewModeSelector } from "selectors/editorSelectors";
import useShowEnvSwitcher from "hooks/useShowEnvSwitcher";
import BottomBar from "components/BottomBar";

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
  const isPreviewMode = useSelector(previewModeSelector);
  const showEnvSwitcher = useShowEnvSwitcher({ viewMode: isPreviewMode });

  if (isAnimatedIDEEnabled) {
    return (
      <AnimatedLayout showEnvSwitcher={!isPreviewMode || showEnvSwitcher} />
    );
  }

  return <StaticLayout showEnvSwitcher={!isPreviewMode || showEnvSwitcher} />;
}

IDE.displayName = "AppIDE";

export default React.memo(IDE);
