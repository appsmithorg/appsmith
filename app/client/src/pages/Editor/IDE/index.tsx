import React from "react";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { AnimatedLayout, StaticLayout } from "./Layout";
import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { BaseLayoutProps } from "./Layout/Layout.types";
import { useGridLayoutTemplate } from "./Layout/hooks/useGridLayoutTemplate";

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
  const layoutProps = useGridLayoutTemplate();

  const LayoutComponent = isAnimatedIDEEnabled ? AnimatedLayout : StaticLayout;

  return <LayoutComponent {...layoutProps} />;
}

IDE.displayName = "AppIDE";

export default React.memo(IDE);
