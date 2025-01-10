import React, { Suspense } from "react";
import { loadingIndicator } from "ce/AppRouter";
import { useIDEFeatureFlags } from "./services/ideFeatureFlags";
import { useGridLayoutTemplate } from "./Layout/hooks/useGridLayoutTemplate";
import type { BaseLayoutProps } from "./Layout/Layout.types";

// Lazy load layout components to break circular dependencies
const AnimatedLayout = React.lazy(() => 
  import("./Layout").then(({ AnimatedLayout }) => ({ default: AnimatedLayout }))
);
const StaticLayout = React.lazy(() => 
  import("./Layout").then(({ StaticLayout }) => ({ default: StaticLayout }))
);

/**
 * OldName: MainContainer
 */
function IDE() {
  const { isAnimatedIDEEnabled } = useIDEFeatureFlags();
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
