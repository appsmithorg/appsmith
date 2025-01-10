import React, { lazy, Suspense } from "react";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { loadingIndicator } from "ce/AppRouter";

const AnimatedLayout = lazy(() => import("./Layout/AnimatedLayout").then(m => ({ default: m.AnimatedLayout })));
const StaticLayout = lazy(() => import("./Layout/StaticLayout").then(m => ({ default: m.StaticLayout })));
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

  return (
    <Suspense fallback={loadingIndicator}>
      <LayoutComponent {...layoutProps} />
    </Suspense>
  );
}

IDE.displayName = "AppIDE";

export default React.memo(IDE);
