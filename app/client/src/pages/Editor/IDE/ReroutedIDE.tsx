import React, { Suspense } from "react";
import { Switch, useRouteMatch } from "react-router-dom";
import { SentryRoute, loadingIndicator } from "../../../ce/AppRouter";
import { editorRoutes } from "./EditorRoutes";
import { useIDEFeatureFlags } from "./services/ideFeatureFlags";
import { useGridLayoutTemplate } from "./Layout/hooks/useGridLayoutTemplate";

const AnimatedLayout = React.lazy(() => 
  import("./Layout/AnimatedLayout").then(m => ({ default: m.AnimatedLayout }))
);
const StaticLayout = React.lazy(() => 
  import("./Layout/StaticLayout").then(m => ({ default: m.StaticLayout }))
);

/**
 * ReroutedIDE serves as a bridge between AppRouter and IDE internals
 * to break circular dependencies between routing and IDE components
 */
export default function ReroutedIDE() {
  const { path } = useRouteMatch();
  const { isAnimatedIDEEnabled } = useIDEFeatureFlags();
  const layoutProps = useGridLayoutTemplate();

  const LayoutComponent = isAnimatedIDEEnabled ? AnimatedLayout : StaticLayout;

  return (
    <Suspense fallback={loadingIndicator}>
      <LayoutComponent {...layoutProps}>
        <Switch>
          {editorRoutes.map((route) => (
            <SentryRoute
              key={route.key}
              component={route.component}
              exact={route.exact}
              path={`${path}${route.path}`}
            />
          ))}
        </Switch>
      </LayoutComponent>
    </Suspense>
  );
}
