import React, { Suspense } from "react";
import { loadingIndicator } from "ce/AppRouter";
import { useIDEFeatureFlags } from "./services/ideFeatureFlags";
import { useGridLayoutTemplate } from "./Layout/hooks/useGridLayoutTemplate";
import type { BaseLayoutProps } from "./Layout/Layout.types";
import { PaneComponentsProvider } from "./services/PaneComponentsContext";
import LeftPane from "./LeftPane";
import RightPane from "./RightPane";
import MainPane from "./MainPane";
import Sidebar from "./Sidebar";

// Lazy load layout components directly to break circular dependencies
const AnimatedLayout = React.lazy(() => 
  import("./Layout/AnimatedLayout").then(({ AnimatedLayout }) => ({ default: AnimatedLayout }))
);
const StaticLayout = React.lazy(() => 
  import("./Layout/StaticLayout").then(({ StaticLayout }) => ({ default: StaticLayout }))
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
      <PaneComponentsProvider
        components={{
          LeftPane,
          RightPane,
          MainPane,
          Sidebar,
        }}
      >
        <LayoutComponent {...layoutProps} />
      </PaneComponentsProvider>
    </Suspense>
  );
}

IDE.displayName = "AppIDE";

export default React.memo(IDE);
